// #region ⚙️ Imports
import "colors";
import path from "path";
import fs from "fs";
import util from "util";
import axios from "axios";
import express from "express";
import "@shared/Extensions";
import { Objects } from "@shared/Extensions.Objects";
import { Http } from "@shared/Http";
import { Timer, IntervalCounter } from "@shared/Timer";
import { Reflection } from "@shared/Reflection";
import { Google } from "@shared/Google";
import { Cache, CacheBase } from "@shared/Cache";
import {
  Console,
  Layout,
  Log,
  ObjectLog,
  LargeText,
  Bar,
  Unit,
} from "@shared/Console";
import { Configuration } from "@shared/Configuration";
import { Logger } from "@shared/Logger";
import { TypeScript } from "@shared/TypeScript";
import { Database } from "@shared/Database/Database";
import { MongoDatabase } from "@shared/Database/MongoDatabase";
import { Analytics } from "@shared/Analytics";
import { debug } from "console";
// #endregion

const getResponseSize = (response: any) => {
  if (!response.headers) return null;
  return parseInt(response.headers["content-length"] || 0);
};

(async () => {
  // #region 📝 Configuration
  const configObj = await Configuration.new();
  const config = configObj.data;
  // #endregion

  const debugLog = await Logger.new(config.debug.log);
  // #region 💻 Console

  // #region Create the dashboard layout
  const mainLog = Log.new(config.title);
  const itemsLog = Log.new("Items", {
    columns: [4, 3, 6, 6],
    breakLines: true,
    extraSpaceForBytes: true,
  });

  const configLog = Log.new(`Configuration`);
  configLog.showDate = false;
  configLog.reverseItems = false;
  configLog.log(`${Configuration.getEnvironment().green}`);
  configObj.configPaths
    .map((cp) => cp.toShortPath())
    .forEach((cp) => {
      configLog.log(cp);
    });
  configLog.log("-");
  configObj.yaml.split("\n").forEach((line) => configLog.log(line));

  const layout = Layout.new();

  layout.addRow(
    Unit.box("0%", "0%", "100%", "100%"),
    [mainLog, itemsLog, configLog],
    ["25%", "50%", "25%"]
  );
  // #endregion

  // #region Render the dashboard
  const uptime = Timer.start();
  const requests = {
    per: {
      minute: new IntervalCounter((1).minutes()),
    },
  };

  const renderDashboard = () => {
    mainLog.title = `${config.title} (${
      `uptime`.gray
    } ${uptime.elapsed?.unitifyTime()})`;
    itemsLog.title = `Items (${requests.per.minute.count}${`/minute`.gray})`;
    layout.render();
    // Set the console window title
    process.title = `${config.title} (?)`;
  };
  setInterval(renderDashboard, 1000 / 1);
  // #endregion

  // If [q] is pressed, stop the load balancer
  mainLog.log(`Press [q] to quit`);
  Console.on.key("q", () => {
    mainLog.log(`Quitting..`);
    renderDashboard();
    process.exit();
  });

  if (configObj.nextRestartTime) {
    mainLog.log(
      `Next restart: ${configObj.nextRestartTime.toLocaleTimeString().bgRed} (${
        `every`.gray
      } ${config.process.restart.periodically.every})`
    );
  }
  // #endregion

  // #region 📦 Database

  // #endregion

  // #region 🔍 Request Handling
  const init = (httpServer: express.Express) => {
    // #region 🌐 CORS
    httpServer.use(function (req: any, res: any, next: any) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      next();
    });
    // #endregion

    // #region processRequest() helper
    const processRequest = (handler: any) => {
      return async (req: any, res: any) => {
        const timer = Timer.start();
        try {
          requests.per.minute.track(1);
          debugLog.log(req.url);
          // Get the POST data
          const data = await Http.getPostData(req);
          await handler(req, res, data);
          itemsLog.log(
            req.method,
            res.statusCode.severifyByHttpStatus(),
            getResponseSize(res)?.unitifySize(),
            timer.elapsed
              ?.unitifyTime()
              .severify(
                ...(config.requests.severity.time as [
                  number,
                  number,
                  "<" | ">"
                ])
              ),
            req.url
          );
        } catch (ex: any) {
          debugLog.log(ex.stack);
          itemsLog.log(
            req.method,
            res.statusCode.severifyByHttpStatus(),
            getResponseSize(res)?.unitifySize(),
            timer.elapsed
              ?.unitifyTime()
              .severify(
                ...(config.requests.severity.time as [
                  number,
                  number,
                  "<" | ">"
                ])
              ),
            req.url.bgRed,
            ex.message.bgRed
          );
          res.status(500).send(ex.stack);
        }
      };
    };
    // #endregion

    // For /, return the list of routes
    httpServer.get("/", (req: any, res: any) => {
      return res.send(config.routes.map((r: any) => r.path));
    });
  };
  // #endregion

  // #region Log unhandled errors
  process.on("uncaughtException", async (ex: any) => {
    mainLog.log(`Uncaught exception:`, ex.stack.bgRed);
    debugLog.log(`Uncaught exception:`, ex.stack);
    await debugLog.flush();
  });
  // #endregion

  // #region 🚀 Start the server
  const start = () => {
    // Create the express app
    const httpServer = express();
    httpServer.use(express.json());

    init(httpServer);

    // Start the server
    httpServer.listen(config.server.port, config.server.host);

    mainLog.log(
      `HTTP server running on ${config.server.host.yellow}:${
        config.server.port.toString().green
      }`.gray
    );
  };

  process.title = config.title;

  start();
  // #endregion
})();