import fs from "fs";
import "colors";
import express, { response } from "express";
import axios, { Axios, AxiosResponse, AxiosResponseHeaders } from "axios";
import { Configuration } from "@shared/Configuration";
import { Objects } from "@shared/Extensions.Objects";
import { Timer, IntervalCounter } from "@shared/Timer";
import { Cache } from "@shared/Cache";
import { Http } from "@shared/Http";
import { Analytics, ItemType } from "@shared/Analytics";
import { Logger } from "@shared/Logger";
import {
  Console,
  Layout,
  Log,
  ObjectLog,
  LargeText,
  Bar,
  Unit,
} from "@shared/Console";

interface CachedResponse {
  dt: number;
  status: {
    code: number;
    text: string;
  };
  headers: any;
  body: string;
}

const isCachable = (
  options: any,
  config: any,
  req?: any,
  response?: AxiosResponse<any, any>
) => {
  if (options.method != "GET") return false;
  if (!options.url) return false;
  if (
    [".jpg", ".jpeg", ".png", ".gif", ".webm", ".webp"].some((ext) =>
      options.url?.toLowerCase().endsWith(ext)
    )
  )
    return false;
  if (
    config.cache?.ignore?.some((pattern: string) => options.url?.match(pattern))
  )
    return false;
  if (response && response.status != 200) return false;
  return true;
};

(async () => {
  const config = (await Configuration.new()).data;

  const debugLogger = Logger.new(config.log);

  const logLine = (...args: any[]) => {
    args = [
      config.title.gray,
      new Date().toLocaleTimeString().gray,
      currentRequests.severify(10, 20, "<"),
      `queue`.gray,
      `${stats.successes.count}${
        `/`.gray
      }${stats.successes.timeSpan.unitifyTime()}`,
      ...args,
    ];
    process.stdout.write("\r");
    process.stdout.clearLine(0);
    process.stdout.write(args.join(" "));
    process.stdout.write("\r");
    debugLogger.log(...args);
  };

  const logNewLine = (...args: any[]) => {
    logLine(...args);
    console.log();
  };

  const interval = config.stats.every.deunitify();

  const stats = {
    interval,
    successes: new IntervalCounter(interval),
    cache: {
      hits: new IntervalCounter(interval),
    },
    response: {
      times: new IntervalCounter(interval),
    },
  };

  const cache = await Cache.new(config.cache.store);

  let currentRequests = 0;

  // Forward all incoming HTTP requests to config.target.base.urls/..
  // If a request fails (target is down), try the cache first
  // If the cache doesn't have the response, try backup urls up to target.try.again.retries times
  const app = express();
  // Catch all requests
  app.all("*", async (req: any, res: any) => {
    // Remove &_uid=1685119338348 from the URL (uniquifies the request)
    let cacheKey = req.url;
    cacheKey = cacheKey?.replace(/&_uid=\d+/g, "");

    const postData = req.method == "POST" ? await Http.getPostData(req) : null;

    const timer = Timer.start();
    currentRequests++;

    const tryRequest = async (attempt: number = 0) => {
      const nodeIndex = attempt % config.target.base.urls.length;

      const targetUrl = `${config.target.base.urls[nodeIndex]}${req.url}`;
      const options = {
        url: targetUrl,
        method: req.method as any,
        headers: req.headers,
        data: postData,
        // We want to proxy the data as-is,
        responseType: "stream",
        // We want to proxy the request as-is,
        // let the client handle the redirects
        maxRedirects: 0,
        timeout: config.target.timeout.deunitify(),
      } as any;

      if (attempt >= config.target.try.again.retries) {
        // Temporarily unavailable
        logNewLine(
          `${timer.elapsed?.unitifyTime().severify(100, 500, "<")} ${
            config.target.try.again.retries.toString().yellow
          } ${`attempts failed`.red.bold} ${options.url.gray}`
        );
        res.status(503);
        currentRequests--;
        return res.end();
      }

      const origin = req.headers.origin || "*";

      try {
        const responseInterval = setInterval(() => {
          // logLine(
          //   "fetching",
          //   responseTimer.elapsed?.unitifyTime(),
          //   options.url
          // );
        }, 1000);
        const nodeResponse = await axios.request(options);
        clearInterval(responseInterval);
        // Add debug headers
        // debug-proxy-source:
        // - forwarded
        // - cache
        res.set(
          "x-debug-proxy-source",
          `forwarded (${attempt.ordinalize()} attempt)`
        );
        res.status(nodeResponse.status);
        res.set(nodeResponse.headers);
        res.set("access-control-allow-origin", origin);

        nodeResponse.data.pipe(res);

        // When the response ends
        nodeResponse.data.on("end", async () => {
          logLine(
            `${timer.elapsed?.unitifyTime().severify(100, 500, "<")} ${
              nodeResponse.status.toString().yellow
            } ${options.url.gray}`
          );
          stats.response.times.track(timer.elapsed);
          stats.successes.track(1);
        });

        if (cache) {
          if (isCachable(options, config, req, nodeResponse)) {
            let data = await Http.getResponseStream(nodeResponse);
            if (typeof data != "string") data = Objects.jsonify(data);
            if (data.trim().length) {
              //console.log("caching", options.url);
              // Get the response data
              const cachedResponse = {
                dt: Date.now(),
                url: req.url,
                status: {
                  code: nodeResponse.status,
                  text: nodeResponse.statusText,
                },
                headers: nodeResponse.headers,
                body: data,
              };
              delete cachedResponse.headers["access-control-allow-origin"];
              await cache.set(req.url || "", cachedResponse);
            }
          }
        }

        currentRequests--;
        return;
      } catch (ex: any) {
        // Some HTTP status codes are not errors (304 not modified, 404 not found, etc.)
        const targetIsDown =
          !ex.response || ex.message.includes("ECONNREFUSED");

        // If target is not down, target returned some http status and we should return it
        if (!targetIsDown) {
          const isError = !ex.response.status.isBetween(200, 500);
          const elapsed = timer.elapsed;
          logLine(
            `${elapsed?.unitifyTime().severify(100, 500, "<")} ${
              !isError
                ? ex.response.status.toString().yellow
                : ex.message.yellow
            } ${options.url.gray}`
          );

          // We don't track response time for (304 not modified, 404 not found, etc) because
          // there is no processing time to measure
          //stats.response.times.track(elapsed);
          stats.successes.track(1);

          res.status(ex.response.status);
          res.set(ex.response.headers);
          currentRequests--;
          ex.response.data.pipe(res);
          return;
        }

        if (targetIsDown) {
          // Try the cache
          if (isCachable(options, config)) {
            if (await cache.has(cacheKey)) {
              const cachedResponse = await cache.get(cacheKey);
              if (cachedResponse) {
                stats.cache.hits.track(1);
                // We don't track response time for cached results
                // because we're interested in optimizing slow requests
                //stats.response.times.track(timer.elapsed);
                logLine(
                  `${timer.elapsed?.unitifyTime().severify(100, 500, "<")} ${
                    `Fallback cache hit`.yellow.bold
                  } ${cachedResponse.body.length.unitifySize()} ${
                    options.url.gray
                  }`
                );
                res.set("x-debug-proxy-source", "cache");
                res.status(cachedResponse.status.code);
                res.set(cachedResponse.headers);
                res.set("access-control-allow-origin", origin);
                currentRequests--;
                return res.end(cachedResponse.body);
              }
            }
          }

          if (attempt >= config.target.try.again.retries - 1) {
            logNewLine(`${ex.message.red.bold} ${options.url.gray}`);
          }

          // Try again
          setTimeout(
            () => tryRequest(attempt + 1),
            config.target.try.again.delay.deunitify()
          );
          return;
        }
      }
    };

    tryRequest();
  });

  // Every once in a while, display stats
  setInterval(() => {
    const successRate = 1 - stats.cache.hits.count / stats.successes.count;
    logNewLine(
      `${stats.successes.count.humanize()} ${
        `successful proxied requests and`.gray
      } ${stats.cache.hits.count.humanize()} ${
        `fallback cache hits per`.gray
      } ${stats.interval.unitifyTime()} (${successRate.unitifyPercent()})`
    );
  }, stats.interval);

  // Every minute, track requests/minute and response times in analytics
  const analytics = await Analytics.new(config.analytics);
  setInterval(async () => {
    await analytics.create(
      config.title.split(".").first(),
      "network",
      "requests",
      ItemType.Count,
      stats.interval,
      stats.successes.count,
      null
    );
    await analytics.create(
      config.title.split(".").first(),
      "network",
      "response.time",
      ItemType.Average,
      (1).minutes(),
      {
        count: stats.response.times.count,
        average: stats.response.times.average,
      },
      "ms"
    );
  }, stats.interval);

  const server = config.incoming.server;

  app.listen(server.port, server.host, () => {
    logNewLine(
      `${`HTTP Proxy`.green} ${`listening on `.gray} ${
        server.host.toString().green
      }:${server.port.toString().yellow}`
    );
    for (const url of config.target.base.urls) {
      logNewLine(`${`Target`.green} ${`URL`.gray} ${url.yellow}`);
    }
  });
})();
