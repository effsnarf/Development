import fs, { stat } from "fs";
import "colors";
import express, { response } from "express";
import axios, { Axios, AxiosResponse, AxiosResponseHeaders } from "axios";
import https from "https";
import { Configuration } from "@shared/Configuration";
import { Objects } from "@shared/Extensions.Objects";
import { Timer, IntervalCounter } from "@shared/Timer";
import { Cache } from "@shared/Cache";
import { Http } from "@shared/Http";
import { Analytics, ItemType } from "@shared/Analytics";
import { Logger, LoggerBase } from "@shared/Logger";
import { DbQueue } from "@shared/Database/DbQueue";

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

interface Task {
  id: number | null;
  timer: Timer;
  url: string;
  options: any;
  origin: string;
  timeout: number;
  cacheKey: string;
  postData: any;
  attempt: number;
  nodeIndex: number;
  log: string[];
  logTimer: NodeJS.Timer | null;
  isPiping: boolean;
}

class TaskManager {
  private _taskID = 1;
  private items = new Map<number, Task>();

  constructor(
    private taskLogger: LoggerBase,
    private statusLogger: LoggerBase
  ) {}

  add(task: Task, req?: any) {
    if (!task.id) task.id = this._taskID++;
    task.log.push(
      `[${task.id}] ${task.options?.method || req.method} ${
        task.options?.url || req?.url
      }`
    );
    task.log.push(JSON.stringify(task.postData).shorten(200));
    task.logTimer = setInterval(() => {
      if (task.isPiping) return;
      task.log.push(
        `${task.timer.elapsed?.unitifyTime().withoutColors()} passed`
      );
      if (this.items.has(task.id || 0)) this.taskLogger.log(task);
    }, (1).seconds());
    this.items.set(task.id, task);
  }

  remove(task: Task, successfullyCompleted?: boolean) {
    clearInterval(task.logTimer || 0);
    if (!successfullyCompleted) this.taskLogger.log(task);
    this.items.delete(task.id || 0);
  }

  logStatus() {
    this.statusLogger.log(
      `${this.items.size} tasks`,
      [...this.items.values()].map((item: any) => {
        item = { ...item } as any;
        item.elapsed = item.timer.elapsed?.unitifyTime().withoutColors();
        delete item.timer;
        delete item.logTimer;
        return item;
      })
    );
  }

  get count() {
    return this.items.size;
  }
}

(async () => {
  // In cache queue mode, we're only processing the cache queue to update the cache, not serving clients
  const isCacheQueueMode = process.argv.includes("--cache-queue");

  const config = (await Configuration.new()).data;

  if (isCacheQueueMode) process.title = `${config.title} (cache queue)`;

  const debugLogger = Logger.new(config.log.debug);
  const errorLogger = Logger.new(config.log.errors);
  const taskLogger = Logger.new(config.log.tasks);
  const statusLogger = Logger.new(config.log.status);

  const tasks = new TaskManager(taskLogger, statusLogger);
  let pipingTasks = 0;

  debugLogger.log(config);

  const tryRequest = async (task: Task, req?: any, res?: any) => {
    if (config.custom) {
      for (const item of config.custom) {
        const regex = new RegExp(item.url);
        if (regex.test(req.url)) {
          res.status(item.status);
          res.end();
          task.log.push(`Custom response: ${item.status}`);
          tasks.remove(task, true);
          return;
        }
      }
    }

    const nodeIndex =
      (task.nodeIndex + task.attempt) % config.target.base.urls.length;

    const targetUrl = `${config.target.base.urls[nodeIndex]}${task.url}`;

    task.log.push(
      `Attempt ${task.attempt + 1} of ${config.target.try.again.retries}`
    );
    task.log.push(
      `Using node ${nodeIndex + 1} of ${config.target.base.urls.length}`
    );
    task.log.push(`Target URL: ${targetUrl}`);

    const options =
      task.options ||
      ({
        method: req.method,
        headers: req.headers,
        body: task.postData,
        // We want to proxy the data as-is,
        responseType: "stream",
        // We want to proxy the request as-is,
        // let the client handle the redirects
        maxRedirects: 0,
        timeout: task.timeout,
        mode: "no-cors",
      } as any);

    options.url = targetUrl;

    if (task.attempt >= config.target.try.again.retries) {
      // Temporarily unavailable
      logNewLine(
        `${task.timer.elapsed?.unitifyTime().severify(100, 500, "<")} ${
          config.target.try.again.retries.toString().yellow
        } ${`attempts failed`.red.bold} ${options.url.red.bold}`
      );
      res?.status(503);
      task.log.push(`Max attempts reached`);
      task.log.push(`Removing task from queue`);
      tasks.remove(task);
      return res?.end();
    }

    // Try the cache
    if (!isCacheQueueMode) {
      if (isCachable(options, config)) {
        if (await cache.has(task.cacheKey)) {
          const cachedResponse = await cache.get(task.cacheKey);
          if (cachedResponse) {
            stats.cache.hits.track(1);
            // We don't track response time for cached results
            // because we're interested in optimizing slow requests
            //stats.response.times.track(timer.elapsed);
            logLine(
              `${task.timer.elapsed
                ?.unitifyTime()
                .severify(100, 500, "<")
                .padStartChars(8, " ")} ${
                `Cache hit`.gray
              } ${cachedResponse.body.length
                .unitifySize()
                .padStartChars(8, " ")} ${options.url.gray}`
            );
            res.set("x-debug-proxy-source", "cache");
            res.status(cachedResponse.status.code);
            res.set(cachedResponse.headers);
            res.set("access-control-allow-origin", task.origin);
            task.log.push(`Sending cached response to client`);
            task.log.push(`Removing task from queue`);
            tasks.remove(task, true);
            res.end(cachedResponse.body);

            const cachedOptions = { ...options };
            const url = task.url;
            delete cachedOptions.url;

            let { method, body } = options;
            const queueItemKey = { method, url, body };

            // Queue the url as a background task
            // to update the cache
            const cacheQueueItem = {
              _id: queueItemKey,
              dt: Date.now(),
              ...queueItemKey,
              options: cachedOptions,
            };
            cacheQueue?.add(cacheQueueItem);

            return;
          }
        }
      }
    }

    try {
      const isHttpPost = (options.method || "").toLowerCase() == "post";

      const nodeResponse = isHttpPost
        ? await axios.post(options.url, task.postData, options)
        : await axios.request(options);

      task.log.push(`Response status: ${nodeResponse.status}`);

      if (res) {
        // Add debug headers
        // debug-proxy-source:
        // - forwarded
        // - cache
        res.set(
          "x-debug-proxy-source",
          `forwarded (${task.attempt.ordinalize()} attempt)`
        );
        res.status(nodeResponse.status);
        res.set(nodeResponse.headers);
        res.set("access-control-allow-origin", task.origin);
      }

      if (isHttpPost) {
        tasks.remove(task, true);
        return res?.end(Objects.jsonify(nodeResponse.data));
      }

      if (res) {
        nodeResponse.data.pipe(res);

        task.isPiping = true;
        task.log.push(`Piping response to client`);
        task.log.push(`Removing task from queue`);
        tasks.remove(task, true);
        pipingTasks++;

        // When the response ends
        nodeResponse.data.on("end", async () => {
          logLine(
            `${task.timer.elapsed
              ?.unitifyTime()
              .severify(100, 500, "<")
              .padStartChars(8, " ")} ${nodeResponse.status
              .severifyByHttpStatus()
              .padStartChars(9 + 8, " ")} ${(
              options.url as string
            ).severifyByHttpStatus(nodeResponse.status)}`
          );
          stats.response.times.track(task.timer.elapsed);
          stats.successes.track(1);
          task.log.push(`Response piped successfully to client`);
          pipingTasks--;
        });

        nodeResponse.data.on("error", async (ex: any) => {
          logNewLine(
            `${task.timer.elapsed
              ?.unitifyTime()
              .severify(100, 500, "<")
              .padStartChars(8, " ")} ${nodeResponse.status
              .severifyByHttpStatus()
              .padStartChars(9 + 8, " ")} ${ex.message?.red.bold} ${
              options.url.red.bold
            }`
          );
          stats.response.times.track(task.timer.elapsed);
          task.log.push(`Error piping response to client`);
          task.log.push(ex.stack);
          pipingTasks--;
        });
      }

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
              url: "/" + options.url.split("/").slice(3).join("/"),
              status: {
                code: nodeResponse.status,
                text: nodeResponse.statusText,
              },
              headers: nodeResponse.headers,
              body: data,
            };
            delete cachedResponse.headers["access-control-allow-origin"];
            await cache.set(task.cacheKey, cachedResponse);
            task.log.push(`Response cached`);
            if (isCacheQueueMode) {
              const cacheItemsCount = await cacheQueue?.count();
              logLine(
                `${cacheItemsCount?.humanize().severify(100, 200, "<")} ${
                  `cache queue`.gray
                }`,
                task.timer.elapsed?.unitifyTime().padStartChars(8, " "),
                data.length.unitifySize().padStartChars(8, " "),
                `Cache updated for ${task.cacheKey}`.gray
              );
            }
          }
        }
      }

      return;
    } catch (ex: any) {
      // Some HTTP status codes are not errors (304 not modified, 404 not found, etc.)
      const targetIsDown = !ex.response || ex.message.includes("ECONNREFUSED");

      if (!isCacheQueueMode) {
        // If target is not down, target returned some http status and we should return it
        if (!targetIsDown) {
          const isError = !ex.response.status.isBetween(200, 500);
          const elapsed = task.timer.elapsed;
          logLine(
            `${elapsed?.unitifyTime().severify(100, 500, "<")} ${
              !isError
                ? ex.response.status.toString().yellow
                : ex.message.yellow
            } ${options.url.severifyByHttpStatus(ex.response.status)}`
          );

          task.log.push(`Status: ${ex.response.status}`);

          // We don't track response time for (304 not modified, 404 not found, etc) because
          // there is no processing time to measure
          //stats.response.times.track(elapsed);
          stats.successes.track(1);

          const origin = options.headers.origin || "*";
          res.status(ex.response.status);
          res.set(ex.response.headers);
          res.set("access-control-allow-origin", task.origin);

          task.isPiping = true;
          task.log.push(`Piping response to client`);
          task.log.push(`Removing task from queue`);
          tasks.remove(task, true);
          pipingTasks++;

          ex.response.data.pipe(res);
          ex.response.data.on("end", async () => {
            task.log.push(`Response piped successfully to client`);
            pipingTasks--;
          });
          ex.response.data.on("error", async (ex: any) => {
            task.log.push(`Error piping response to client`);
            task.log.push(ex.stack);
            pipingTasks--;
          });
          return;
        }
      }

      if (targetIsDown) {
        task.attempt++;

        task.log.push(`Trying again in ${config.target.try.again.delay}`);

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
    args = isCacheQueueMode
      ? [config.title.gray, new Date().toLocaleTimeString().gray, ...args]
      : [
          config.title.gray,
          new Date().toLocaleTimeString().gray,
          tasks.count.severify(10, 20, "<"),
          `inner`.gray,
          pipingTasks.severify(10, 20, "<"),
          `outer`.gray,
          `${stats.successes.count.toLocaleString()} ${
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
  const cacheQueue = await DbQueue.new(config.cache.queue);

  let nextNodeIndex = 0;

  const processCacheQueue = async () => {
    const cacheQueueItem = await cacheQueue.pop();

    if (cacheQueueItem) {
      const options = cacheQueueItem.options;

      const task = {
        id: null,
        timer: Timer.start(),
        url: cacheQueueItem.url,
        options: options,
        origin: options.headers.origin,
        timeout: config.target.timeout.deunitify(),
        cacheKey:
          "/" +
          cacheQueueItem.url
            .replace(/&_uid=\d+/g, "")
            .split("/")
            .slice(3)
            .join("/"),
        postData: options.body,
        attempt: 0,
        nodeIndex: !config.rotate?.nodes
          ? 0
          : nextNodeIndex++ % config.target.base.urls.length,
        log: [],
        logTimer: null,
        isPiping: false,
      } as Task;

      tasks.add(task);

      tryRequest(task);
    }

    setTimeout(processCacheQueue, 10);
  };

  // Forward all incoming HTTP requests to config.target.base.urls/..
  // If a request fails (target is down), try the cache first
  // If the cache doesn't have the response, try backup urls up to target.try.again.retries times
  const app = express();
  // Catch all requests
  app.all("*", async (req: any, res: any) => {
    const task = {
      id: null,
      timer: Timer.start(),
      url: req.url,
      options: null,
      origin: req.headers.origin || "*",
      timeout: config.target.timeout.deunitify(),
      cacheKey: req.url.replace(/&_uid=\d+/g, ""),
      postData:
        req.method == "POST" ? await Http.getPostDataFromStream(req) : null,
      attempt: 0,
      nodeIndex: !config.rotate?.nodes
        ? 0
        : nextNodeIndex++ % config.target.base.urls.length,
      log: [],
      logTimer: null,
      isPiping: false,
    } as Task;

    tasks.add(task, req);

    tryRequest(task, req, res);
  });

  if (!isCacheQueueMode) {
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
  }

  // Every minute, track requests/minute and response times in analytics
  const analytics = await Analytics.new(config.analytics);
  const appTitle = config.title.split(".").take(2).join(".");
  console.log(appTitle);
  if (!isCacheQueueMode) {
    setInterval(async () => {
      await analytics.create(
        appTitle,
        "network",
        "requests",
        ItemType.Count,
        stats.interval,
        stats.successes.count,
        null
      );
      await analytics.create(
        appTitle,
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
      await analytics.create(
        appTitle,
        "network",
        "queue",
        ItemType.Count,
        stats.interval,
        tasks.count,
        null
      );
      tasks.logStatus();
    }, stats.interval);
  }

  // #region Log unhandled errors
  process.on("uncaughtException", async (ex: any) => {
    console.log(`Uncaught exception:`, ex.stack.bgRed.white);
    errorLogger.log(`Uncaught exception:`, ex.stack);
    await errorLogger.flush();
  });
  // #endregion

  if (isCacheQueueMode) {
    processCacheQueue();
  } else {
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
  }
})();
