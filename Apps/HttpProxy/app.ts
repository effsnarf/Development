import fs from "fs";
import "colors";
import express from "express";
import axios from "axios";
import { Configuration } from "@shared/Configuration";
import { Timer, IntervalCounter } from "@shared/Timer";
import { Cache } from "@shared/Cache";
import { Http } from "@shared/Http";
import {
  Console,
  Layout,
  Log,
  ObjectLog,
  LargeText,
  Bar,
  Unit,
} from "@shared/Console";

const logLine = (...args: any[]) => {
  args = [new Date().toLocaleTimeString().blue.bold, ...args];
  process.stdout.write("\r");
  process.stdout.clearLine(0);
  process.stdout.write(args.join(" "));
  process.stdout.write("\r");
};

const logNewLine = (...args: any[]) => {
  args = [new Date().toLocaleTimeString().blue.bold, ...args];
  process.stdout.write("\r");
  process.stdout.clearLine(0);
  console.log(...args);
};

(async () => {
  const config = (await Configuration.new()).data;

  const stats = {
    interval: config.display.stats.every.deunitify(),
  } as any;
  stats.successes = new IntervalCounter(stats.interval);
  stats.cache = {
    hits: new IntervalCounter(stats.interval),
  };

  const cache = await Cache.new(config.cache.store);

  // Forward all incoming HTTP requests to config.target.base.url/..
  // If a request times out, try the cache first
  // If the cache doesn't have the response, try again up to cache.target.try.again.retries times
  const app = express();
  // Catch all requests
  app.all("*", async (req: any, res: any) => {
    const targetUrl = `${config.target.base.url}${req.url}`;
    // Remove &_uid=1685119338348 from the URL (uniquifies the request)
    let cacheKey = req.url;
    cacheKey = cacheKey?.replace(/&_uid=\d+/g, "");

    const postData = req.method == "POST" ? await Http.getPostData(req) : null;
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
    } as any;

    const timer = Timer.start();

    const tryRequest = async (attempt: number = 0) => {
      if (attempt >= config.target.try.again.retries) {
        // Temporarily unavailable
        logNewLine(
          `${timer.elapsed?.unitifyTime()} ${
            config.target.try.again.retries.toString().yellow
          } ${`attempts failed`.red.bold} ${options.url.gray}`
        );
        res.status(503);
        return res.end();
      }

      if (attempt == 1) {
        //logNewLine(`${`Trying again`.yellow} ${options.url.gray}`);
      }
      try {
        // We're only interested in the time it took us to get the response from the target,
        // not the time it took us to send the response to the client
        const elapsed = timer.elapsed;
        const response = await axios.request(options);
        res.status(response.status);
        res.set(response.headers);
        response.data.pipe(res);
        // When the response ends
        response.data.on("end", async () => {
          logLine(`${elapsed?.unitifyTime()} ${options.url.gray}`);
          stats.successes.track(1);
        });
      } catch (ex: any) {
        // Some HTTP status codes are not errors (304 Not Modified, 404 Not Found, etc.)
        const targetIsDown =
          !ex.response || ex.message.includes("ECONNREFUSED");

        // If target is not down, target returned a real error and we should return it
        if (!targetIsDown) {
          logLine(
            `${timer.elapsed?.unitifyTime()} ${ex.message.yellow} ${
              options.url.gray
            }`
          );
          res.status(ex.response.status);
          res.set(ex.response.headers);
          return res.end(ex.response.data.data);
        }

        if (targetIsDown) {
          // Try the cache
          if (await cache.has(cacheKey)) {
            const isCachable = !config.cache.ignore.find((c: any) =>
              options.url.startsWith(c)
            );
            if (isCachable) {
              const cachedResponse = await cache.get(cacheKey);
              if (cachedResponse) {
                stats.cache.hits.track(1);
                logLine(
                  `${
                    `Cache hit`.yellow.bold
                  } ${cachedResponse.body.length.unitifySize()} ${
                    options.url.gray
                  }`
                );
                res.status(cachedResponse.status.code);
                res.set(cachedResponse.headers);
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
        }
      }
    };

    tryRequest();
  });

  // Every second, display stats
  setInterval(() => {
    logNewLine(
      `${stats.successes.count.humanize()} ${
        `successful proxied requests and`.gray
      } ${stats.cache.hits.count.humanize()} ${
        `cache hits per`.gray
      } ${stats.interval.unitifyTime()}`
    );
  }, stats.interval);

  app.listen(config.incoming.server.port, () => {
    logNewLine(
      `${`HTTP Proxy`.green} ${`listening on `.gray} ${
        config.incoming.server.host.toString().green
      }:${config.incoming.server.port.toString().yellow}`
    );
    logNewLine(
      `${`Target`.green} ${`URL`.gray} ${config.target.base.url.yellow}`
    );
  });
})();
