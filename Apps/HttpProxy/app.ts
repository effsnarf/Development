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

let _taskID = 1;

interface Task {
  id: number;
  timer: Timer;
  origin: string;
  timeout: number;
  cacheKey: string;
  postData: any;
  attempt: number;
  nodeIndex: number;
  log: string[];
}

const currentTasks = {} as any;

(async () => {
  const config = (await Configuration.new()).data;

  const debugLogger = Logger.new(config.log.debug);
  const errorLogger = Logger.new(config.log.errors);
  const taskLogger = Logger.new(config.log.tasks);
  const statusLogger = Logger.new(config.log.status);

  debugLogger.log(config);

  const tryRequest = async (task: Task, req: any, res: any) => {
    task.nodeIndex = task.attempt % config.target.base.urls.length;

    if (config.rotate?.nodes)
      task.nodeIndex = (task.nodeIndex + 1) % config.target.base.urls.length;

    const targetUrl = `${config.target.base.urls[task.nodeIndex]}${req.url}`;

    task.log.push(
      `Attempt ${task.attempt + 1} of ${config.target.try.again.retries}`
    );
    task.log.push(
      `Using node ${task.nodeIndex + 1} of ${config.target.base.urls.length}`
    );
    task.log.push(`Target URL: ${targetUrl}`);

    const options = {
      url: targetUrl,
      method: req.method as any,
      headers: req.headers,
      body: task.postData,
      // We want to proxy the data as-is,
      responseType: "stream",
      // We want to proxy the request as-is,
      // let the client handle the redirects
      maxRedirects: 0,
      timeout: task.timeout,
    } as any;

    if (task.attempt >= config.target.try.again.retries) {
      // Temporarily unavailable
      logNewLine(
        `${task.timer.elapsed?.unitifyTime().severify(100, 500, "<")} ${
          config.target.try.again.retries.toString().yellow
        } ${`attempts failed`.red.bold} ${options.url.red.bold}`
      );
      res.status(503);
      task.log.push(`Max attempts reached`);
      task.log.push(`Removing task from queue`);
      taskLogger.log(task);
      delete currentTasks[task.id];
      return res.end();
    }

    try {
      const nodeResponse = await axios.request(options);

      task.log.push(`Response status: ${nodeResponse.status}`);

      // Add debug headers
      // debug-proxy-source:
      // - forwarded
      // - cache
      const origin = req.headers.origin || "*";
      res.set(
        "x-debug-proxy-source",
        `forwarded (${task.attempt.ordinalize()} attempt)`
      );
      res.status(nodeResponse.status);
      res.set(nodeResponse.headers);
      res.set("access-control-allow-origin", origin);

      task.log.push(`Piping response to client`);

      nodeResponse.data.pipe(res);

      // When the response ends
      nodeResponse.data.on("end", async () => {
        logLine(
          `${task.timer.elapsed?.unitifyTime().severify(100, 500, "<")} ${
            nodeResponse.status.toString().yellow
          } ${(options.url as string).severifyByHttpStatus(
            nodeResponse.status
          )}`
        );
        stats.response.times.track(task.timer.elapsed);
        stats.successes.track(1);
        debugLogger.log(`Response piped successfully to client ${targetUrl}`);
        task.log.push(`Response piped successfully to client`);
        task.log.push(`Removing task from queue`);
        delete currentTasks[task.id];
      });

      nodeResponse.data.on("error", async (ex: any) => {
        logNewLine(
          `${task.timer.elapsed?.unitifyTime().severify(100, 500, "<")} ${
            nodeResponse.status.toString().yellow
          } ${ex.message?.red.bold} ${options.url.red.bold}`
        );
        stats.response.times.track(task.timer.elapsed);
        debugLogger.log(`Error piping response to client ${targetUrl}`);
        task.log.push(`Error piping response to client`);
        task.log.push(ex.stack);
        task.log.push(`Removing task from queue`);
        taskLogger.log(task);
        delete currentTasks[task.id];
      });

      // Save the response to the cache
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
            task.log.push(`Response cached`);
          }
        }
      }

      return;
    } catch (ex: any) {
      task.log.push(`Error: ${ex.message}`);

      // Some HTTP status codes are not errors (304 not modified, 404 not found, etc.)
      const targetIsDown = !ex.response || ex.message.includes("ECONNREFUSED");

      task.log.push(`Target is down: ${targetIsDown}`);

      // If target is not down, target returned some http status and we should return it
      if (!targetIsDown) {
        const isError = !ex.response.status.isBetween(200, 500);
        const elapsed = task.timer.elapsed;
        logLine(
          `${elapsed?.unitifyTime().severify(100, 500, "<")} ${
            !isError ? ex.response.status.toString().yellow : ex.message.yellow
          } ${options.url.severifyByHttpStatus(ex.response.status)}`
        );

        // We don't track response time for (304 not modified, 404 not found, etc) because
        // there is no processing time to measure
        //stats.response.times.track(elapsed);
        stats.successes.track(1);

        res.status(ex.response.status);
        res.set(ex.response.headers);
        res.set("access-control-allow-origin", origin);

        task.log.push(`Piping response to client`);

        ex.response.data.pipe(res);
        ex.response.data.on("end", async () => {
          task.log.push(`Response piped successfully to client`);
          task.log.push(`Removing task from queue`);
          taskLogger.log(task);
          delete currentTasks[task.id];
        });
        ex.response.data.on("error", async (ex: any) => {
          task.log.push(`Error piping response to client`);
          task.log.push(ex.stack);
          task.log.push(`Removing task from queue`);
          taskLogger.log(task);
          delete currentTasks[task.id];
        });
        return;
      }

      if (targetIsDown) {
        // Try the cache
        if (isCachable(options, config)) {
          if (await cache.has(task.cacheKey)) {
            const cachedResponse = await cache.get(task.cacheKey);
            if (cachedResponse) {
              stats.cache.hits.track(1);
              // We don't track response time for cached results
              // because we're interested in optimizing slow requests
              //stats.response.times.track(timer.elapsed);
              logLine(
                `${task.timer.elapsed?.unitifyTime().severify(100, 500, "<")} ${
                  `Fallback cache hit`.yellow.bold
                } ${cachedResponse.body.length.unitifySize()} ${options.url.severifyByHttpStatus(
                  cachedResponse.status.code
                )}`
              );
              res.set("x-debug-proxy-source", "cache");
              res.status(cachedResponse.status.code);
              res.set(cachedResponse.headers);
              res.set("access-control-allow-origin", origin);
              task.log.push(`Sending cached response to client`);
              task.log.push(`Removing task from queue`);
              taskLogger.log(task);
              delete currentTasks[task.id];
              return res.end(cachedResponse.body);
            }
          }
        }

        task.attempt++;

        task.log.push(
          `Trying again in ${config.target.try.again.delay.unitifyTime()}`
        );

        // Try again
        setTimeout(
          () => tryRequest(task, req, res),
          config.target.try.again.delay.deunitify()
        );
        return;
      }
    }
  };

  const logLine = (...args: any[]) => {
    args = [
      config.title.gray,
      new Date().toLocaleTimeString().gray,
      Object.keys(currentTasks).length.severify(10, 20, "<"),
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
    console.log();
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

  // Forward all incoming HTTP requests to config.target.base.urls/..
  // If a request fails (target is down), try the cache first
  // If the cache doesn't have the response, try backup urls up to target.try.again.retries times
  const app = express();
  // Catch all requests
  app.all("*", async (req: any, res: any) => {
    const task = {
      id: _taskID++,
      timer: Timer.start(),
      origin: req.headers.origin || "*",
      timeout: config.target.timeout.deunitify(),
      cacheKey: req.url.replace(/&_uid=\d+/g, ""),
      postData: req.method == "POST" ? await Http.getPostData(req) : null,
      attempt: 0,
      nodeIndex: 0,
      log: [],
    } as Task;

    task.log.push(`[${task.id}] ${req.method} ${req.url}`);

    currentTasks[task.id] = task;

    tryRequest(task, req, res);
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
    statusLogger.log(currentTasks);
  }, stats.interval);

  // #region Log unhandled errors
  process.on("uncaughtException", async (ex: any) => {
    errorLogger.log(`Uncaught exception:`, ex.stack);
    await errorLogger.flush();
  });
  // #endregion

  // #region Start the server
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
  // #endregion
})();
