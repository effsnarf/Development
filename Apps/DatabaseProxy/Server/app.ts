// #region ⚙️ Imports
import "colors";
import path from "path";
import fs from "fs";
import util, { debuglog } from "util";
import axios from "axios";
import express from "express";
const bodyParser = require("body-parser");
const compression = require("compression");
import cookieParser from "cookie-parser";
import "@shared/Extensions";
import { Objects } from "@shared/Extensions.Objects";
import { Http } from "@shared/Http";
import { Timer, IntervalCounter } from "@shared/Timer";
import { Reflection } from "@shared/Reflection";
import { Google } from "@shared/Google";
import { Cache, CacheBase, MemoryCache } from "@shared/Cache";
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
import { Analytics, Intervals, Interval, ItemType } from "@shared/Analytics";
import { debug } from "console";
import { DatabaseProxy } from "../Client/DbpClient";
import { Shakespearizer } from "../../../Projects/Shakespearizer/Shakespearizer";
// #endregion

const getResponseSize = (response: any) => {
  if (!response.headers) return null;
  return parseInt(response.headers["content-length"] || 0);
};

const loadApiMethods = async (db: MongoDatabase, config: any) => {
  const apiMethods = await db?.find("_ApiMethods", {});
  for (const apiMethodKey of Object.keys(config.api.methods)) {
    const key = apiMethodKey.split(".");
    const apiMethod = config.api.methods[apiMethodKey];
    apiMethods.push({
      entity: key[0],
      group: key[1],
      name: key[2],
      admin: apiMethod.admin || false,
      args: apiMethod.args || [],
      code: apiMethod.code,
    });
  }
  return apiMethods;
};

(async () => {
  // #region 📝 Configuration
  const configObj = await Configuration.new({
    quitIfChanged: [path.resolve(__dirname, "../Client/Client.js")],
  });
  const config = configObj.data;
  // #endregion

  let dbps = {} as any;
  setTimeout(async () => {
    for (const dbName of Object.keys(config.dbs)) {
      dbps[dbName] = await DatabaseProxy.new(
        `http://${config.server.host}:${config.server.port}/${dbName}`,
        async (url) => {
          try {
            return (await axios.get(url)).data;
          } catch (ex: any) {
            throw new Error(`${ex.message}: ${url}`);
          }
        }
      );
    }
  }, 1000);

  const cache = {
    _store: null as CacheBase | null,
    _getStore: async () => {
      if (!cache._store) cache._store = await MemoryCache.new();
      // cache._store = await Cache.new({
      //   memory: true,
      // });
      return cache._store;
    },
    get: {
      api: {
        methods: async (db: MongoDatabase | undefined) => {
          if (!db) return null;
          return (
            await (
              await cache._getStore()
            ).get(`${db.database}._ApiMethods`, async () => {
              return { apiMethods: await loadApiMethods(db, config) };
            })
          )?.apiMethods;
        },
      },
      collection: {
        names: async (db: MongoDatabase | undefined) => {
          return (
            await (
              await cache._getStore()
            ).get(`${db?.database}.CollectionNames`, async () => {
              return { collectionNames: await db?.getEntityNames() };
            })
          )?.collectionNames;
        },
        infos: async (db: MongoDatabase | undefined) => {
          const entities = [];
          const entityNames = await cache.get.collection.names(db);
          for (const entityName of entityNames) {
            const collection = await db?.getCollection(entityName);
            const pipeline = [{ $collStats: { storageStats: {} } }];

            const results = await collection?.aggregate(pipeline).toArray();
            let stats = results?.first().storageStats;
            stats = Objects.getObjectFields(stats, [
              "size",
              "count",
              "avgObjSize",
              "capped",
            ]);
            const fields = await db?.getEntityFields(entityName);
            const indexes = await collection?.listIndexes().toArray();
            entities.push({
              name: entityName,
              fields,
              indexes,
              stats,
            });
          }
          return entities;
        },
      },
    },
  };

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

  // #region 📝 Logging
  const debugLogger = Logger.new(config.log.debug);
  const errorLogger = Logger.new(config.log.errors);
  debugLogger.log(Objects.yamlify(config));
  // #endregion

  // #region Render the dashboard
  const uptime = Timer.start();
  const requests = {
    per: {
      minute: new IntervalCounter((1).minutes()),
    },
  };

  let currentRequests = 0;

  const renderDashboard = () => {
    mainLog.title = `${config.title} (${
      `uptime`.gray
    } ${uptime.elapsed?.unitifyTime()}) (${currentRequests.severify(
      10,
      20,
      "<"
    )} ${`requests`.gray})`;
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
  const dbs = {
    _analytics: null as Analytics | null,
    _dbs: new Map<string, MongoDatabase>(),
    get: async (dbName: string) => {
      if (!dbs._analytics) {
        if (config.analytics.database) {
          dbs._analytics = await Analytics.new(config.analytics);
        }
      }

      if (!dbs._dbs.has(dbName)) {
        const db = await MongoDatabase.new(
          config.database.connectionString,
          dbName,
          { verifyDatabaseExists: true, lowercaseFields: true }
        );

        Reflection.bindClassMethods(
          db,
          () => Timer.start(),
          (timer, className, methodName, args) => {
            if (timer.elapsed < config.analytics.min.elapsed) return;
            // Remove the $ from $match, $sort, etc, because it can't be stored in MongoDB
            args = args.map((arg) =>
              Objects.json.parse(
                JSON.stringify(arg)?.replace(/\$([a-z]+)/g, "$1")
              )
            );
            // dbs._analytics?.create(
            //   ItemType.Undefined,
            //   config.title,
            //   className,
            //   methodName,
            //   { database: { name: dbName }, args }
            //   // timer.elapsed
            // );
          }
        );

        dbs._dbs.set(dbName, db);
      }
      return dbs._dbs.get(dbName);
    },
  };
  // #endregion

  // #region 🔍 Request Handling
  const init = async (httpServer: express.Express) => {
    // #region 🌐 CORS
    httpServer.use(function (req: any, res: any, next: any) {
      const allowedOrigins = config.server.cors
        .map((host: string) => [`https://${host}`, `http://${host}`])
        .flatMap((hosts: string[]) => hosts);
      const origin = req.headers.origin || req.headers.host;
      if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
      }

      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      next();
    });
    // #endregion

    // #region 🔗 Proxy
    if (config.server.proxy) {
      // Proxy GET, POST and all requests to the host specified in config.server.proxy
      httpServer.all("*", (req: any, res: any) => {
        currentRequests++;

        const url = req.url;
        const method = req.method;
        const body = req.body;
        const proxyUrl = `https://${config.server.proxy}${url}`;

        const timer = Timer.start();

        axios({
          method: method,
          url: proxyUrl,
          //data: body,
        })
          .then((response: any) => {
            itemsLog.log(
              method,
              response.status.severifyByHttpStatus(),
              getResponseSize(response)?.unitifySize(),
              timer.elapsed
                ?.unitifyTime()
                .severify(
                  ...(config.requests.severity.time as [
                    number,
                    number,
                    "<" | ">"
                  ])
                ),
              proxyUrl
            );
            res.status(response.status);
            res.send(response.data);
            res.end();
          })
          .catch((ex: any) => {
            if (!ex.response) {
              itemsLog.log(
                method,
                null,
                null,
                timer.elapsed
                  ?.unitifyTime()
                  .severify(
                    ...(config.requests.severity.time as [
                      number,
                      number,
                      "<" | ">"
                    ])
                  ),
                proxyUrl.bgRed,
                ex.message.bgRed
              );
              return;
            }
            if (ex.response.status != 404) {
              itemsLog.log(
                method,
                ex.response.status.severifyByHttpStatus(),
                getResponseSize(ex.response)?.unitifySize(),
                timer.elapsed
                  ?.unitifyTime()
                  .severify(
                    ...(config.requests.severity.time as [
                      number,
                      number,
                      "<" | ">"
                    ])
                  ),
                proxyUrl,
                ex.message.bgRed
              );
            }
            res.status(ex.response.status).send(ex.message);
          })
          .finally(() => {
            currentRequests--;
          });
        return;
      });
      return;
    }
    // #endregion

    // #region processRequest() helper
    const processRequest = (handler: any) => {
      return async (req: any, res: any) => {
        currentRequests++;

        const timer = Timer.start();
        const origin = req.headers.origin || "*";
        try {
          requests.per.minute.track(1);
          // Check if it's a preflight request
          if (req.method === "OPTIONS") {
            res.set("access-control-allow-headers", "*");
            res.set("access-control-allow-origin", origin);
            return res.status(200).end();
          }
          // Get the POST data
          const data =
            req.method.toLowerCase() == "post"
              ? await Http.getPostDataFromStream(req)
              : null;
          const user = await User.get(req, res, data);
          debugLogger.log(req.method, req.url, data);
          await handler(req, res, user, data);
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
          debugLogger.log(`${timer.elapsed?.unitifyTime()} ${req.url}`);
          errorLogger.log(ex.stack || ex);
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
            req.url.bgRed
          );
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
            ex.message?.bgRed
          );
          return res.status(500).end(ex.stack || ex);
        } finally {
          debugLogger.log(`${timer.elapsed?.unitifyTime()} ${req.url}`);
          currentRequests--;
        }
      };
    };
    // #endregion

    // #region Restart
    if (config.restart?.url) {
      mainLog.log("Restart URL:", config.restart.url.bgRed);
      httpServer.get(config.restart.url, (req: any, res: any) => {
        mainLog.log("Restarting...");
        res.end("Restarting...");
        process.exit(0);
      });
    }
    // #endregion

    // #region 📦 Sheakspearizer
    if (config.shakespearizer) {
      const shakespearizer = await Shakespearizer.new(config);
      httpServer.post(
        "/shakespearize",
        processRequest(
          async (req: any, res: any, user: User, postData: any) => {
            const text = postData.text;

            const shakespearized = await shakespearizer.shakespearize(text);

            const result = {
              text: text,
              shakespearized: shakespearized,
            };

            return res.end(JSON.stringify(result));
          }
        )
      );
    }
    // #endregion

    // #region 📝 File Transpilation
    httpServer.get(
      "/*.js",
      processRequest(async (req: any, res: any) => {
        // Response type
        res.setHeader("Content-Type", "application/javascript");
        const fileName = req.url.substring(1);
        // If a .ts version exists, transpile it and return it
        const tsUrl = req.url.substring(0, req.url.length - 3) + ".ts";
        const tsFilePath = path.join(
          __dirname,
          "../Client",
          fileName.replace(/\.js$/, ".ts")
        );
        if (fs.existsSync(tsFilePath)) {
          // Read the TypeScript file
          const tsCode = fs.readFileSync(tsFilePath, "utf8");
          // Transpile the TypeScript code
          const jsCode = TypeScript.transpileToJavaScript(tsCode);
          // Return the JavaScript code
          return res.end(jsCode);
        }
        // Get [__dirname]/Client/[fileName].js
        const jsFilePath = path.join(__dirname, "../Client", fileName);
        if (fs.existsSync(jsFilePath)) {
          // Read the JavaScript file
          const jsCode = fs.readFileSync(jsFilePath, "utf8");
          // Return the JavaScript code
          return res.end(jsCode);
        }
        // If the file doesn't exist, return 404
        return res.status(404).send(`${jsFilePath} not found`);
      })
    );
    // #endregion

    // // #region 📑 Analytics
    // httpServer.all(
    //   "/analytics/*",
    //   processRequest(async (req: any, res: any) => {
    //     return dbs._analytics?.api.handleRequest(req, res);
    //   })
    // );
    // // #endregion

    // #region 📑 Database Analytics
    httpServer.get(
      "/:database/analytics/:entity/since/:since",
      processRequest(async (req: any, res: any) => {
        const db = await dbs.get(req.params.database);
        const entity = req.params.entity;
        const since = req.params.since.deunitify();
        const from = Date.now() - since;

        const intervals = Intervals.getSince(since, 60);

        const getFilter = (interval: Interval) => {
          const isDateField = entity == "Instances";
          let { from, to } = interval as any;
          if (isDateField) {
            from = new Date(from);
            to = new Date(to);
          }
          const filter = {} as any;
          filter.Created = { $gte: from, $lte: to };
          if (["Threads", "Posts"].includes(entity))
            filter.Imported = { $exists: false };
          return filter;
        };

        for (const interval of intervals) {
          let count = (await db?.count(entity, getFilter(interval))) || 0;
          interval.count = count;
        }

        const counts = intervals.map((intr) => intr.count);

        return res.end(JSON.stringify(counts));
      })
    );

    httpServer.get(
      "/analytics/*",
      processRequest(async (req: any, res: any) => {
        res.status(404).send("Not found");
        // Too slow, everything hangs
        //return dbs._analytics?.api.handleRequest(req, res);
      })
    );

    // For /, return "Add a database name to the URL: /[database]"
    httpServer.get("/", (req: any, res: any) => {
      const dbNames = Object.keys(config.dbs);
      return res.end(JSON.stringify(dbNames));
    });

    // #region 📑 Entity Listing
    // For /[database], return the list of entities (collections)
    httpServer.get(
      "/:database",
      processRequest(async (req: any, res: any) => {
        // Response type
        res.setHeader("Content-Type", "application/json");
        // If database name has a dot, it's a file
        if (req.params.database.indexOf(".") > -1)
          return res.status(404).send(`File ${req.params.database} not found`);

        const db = await dbs.get(req.params.database);
        if (!db)
          return res
            .status(404)
            .send(`Database ${req.params.database} not found`);

        const entities = (await cache.get.collection.names(db))?.filter(
          (e: string) => !e.startsWith("_")
        );
        return res.end(JSON.stringify(entities));
      })
    );
    // #endregion

    httpServer.all(
      "/:database/execute",
      processRequest(async (req: any, res: any, user: User, postData: any) => {
        const script = postData.script;
        const db = await dbs.get(req.params.database);
        const queryData = await db?.execute(script, []);
        return res.end(JSON.stringify(queryData));
      })
    );

    httpServer.get(
      "/:database/get/entities",
      processRequest(async (req: any, res: any) => {
        const db = await dbs.get(req.params.database);
        const entities = await cache.get.collection.infos(db);
        return res.end(JSON.stringify(entities));
      })
    );

    // [database]/get/googleLogin
    httpServer.post(
      "/:database/get/googleLogin",
      processRequest((req: any, res: any, user: User, postData: any) => {
        res.setHeader("Content-Type", "application/json");
        if (!postData?.credential) return res.end(JSON.stringify(null));
        return res.end(JSON.stringify(user?.data));
      })
    );

    // For /[database]/get/new/id, return a new unique ID
    httpServer.get("/:database/get/new/id", async (req: any, res: any) => {
      // Response type
      res.setHeader("Content-Type", "application/json");

      const count = parseInt(req.query.count || 1);

      const db = await dbs.get(req.params.database);

      const ids = await db?.getNewIDs(count);

      return res.end(JSON.stringify(ids));
    });

    // [database]/get/user (returns the user object)
    httpServer.get(
      "/:database/get/user",
      processRequest(async (req: any, res: any, user: User) => {
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify(user?.data));
      })
    );

    // /[database]/set/user
    httpServer.get(
      "/:database/set/user",
      processRequest(async (req: any, res: any, user: User) => {
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify(user?.data));
      })
    );

    // /[database]/log/out
    httpServer.get(
      "/:database/log/out",
      processRequest(async (req: any, res: any, user: User) => {
        await User.logout(req, res);
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify(user?.data));
      })
    );

    // For /[database]/api, return {}
    httpServer.get(
      "/:database/api",
      processRequest(async (req: any, res: any) => {
        // Response type
        res.setHeader("Content-Type", "application/json");
        const db = await dbs.get(req.params.database);
        const apiMethods = await cache.get.api.methods(db);
        const entityNames = apiMethods?.map((m: any) => m.entity).distinct();
        const entities = entityNames?.map((en: any) => {
          const groups = apiMethods
            ?.filter((m: any) => m.entity == en)
            .map((m: any) => m.group)
            .distinct()
            .map((gn: any) => {
              const methods = apiMethods
                ?.filter((m: any) => m.entity == en && m.group == gn)
                .map((m: any) => ({
                  name: m.name,
                  args: m.args,
                }));
              return {
                name: gn,
                methods: methods,
              };
            });
          return {
            entity: en,
            groups: groups,
          };
        });
        return res.end(JSON.stringify(entities));
      })
    );

    const handleApiRequest = async (
      req: any,
      res: any,
      user: User,
      data: any
    ) => {
      // Response type
      res.setHeader("Content-Type", "application/json");

      //if (req.url.includes("/create/")) return res.end("dbp:" + req.url);

      const db = await dbs.get(req.params.database);
      const apiMethods = await cache.get.api.methods(db);
      const apiMethod = (apiMethods?.filter(
        (m: any) =>
          m.entity == req.params.entity &&
          m.group == req.params.group &&
          m.name == req.params.method
      ))[0];
      if (!apiMethod)
        return res
          .status(404)
          .send(`Method not found: ${JSON.stringify(req.params)}`);
      const userIP =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      const isAdmin = config.admin.ips.includes(userIP);
      if (apiMethod.admin && !isAdmin) {
        return res.status(500).send("You are not authorized to do this.");
      }
      const funcStr = `async (dbp, fs, user, db, db${
        req.params.entity
      }, axios, ${apiMethod.args.join(", ")}) => { ${apiMethod.code} }`;
      const func = eval(funcStr);
      const collection = await db?.getCollection(req.params.entity);
      const args = apiMethod.args.map((arg: any) => {
        if (data && data[arg]) return data[arg];
        return Objects.json.parse(req.query[arg] || "null");
      });

      const start = Date.now();

      let result: any;

      let methodStr = `${req.params.entity}.${req.params.group}.${req.params.method}`;

      try {
        const dbp = dbps[req.params.database];

        result = await func(dbp, fs, user, db, collection, axios, ...args);

        const elapsed = Date.now() - start;

        if (elapsed < config.analytics.min.elapsed) {
          methodStr = methodStr.gray;
        } else {
          // dbs._analytics?.create(
          //   ItemType.Unknown,
          //   config.title,
          //   "api",
          //   methodStr,
          //   { args },
          //   elapsed
          // );
        }

        if (result == undefined) result = null;

        debugLogger.log(req.method, req.url, data);
        debugLogger.log(result);

        return res.end(Objects.jsonify(result));
      } catch (ex: any) {
        if (typeof ex == "string") {
          if (ex.includes("not found")) {
            return res.status(404).send(ex);
          }
        }
        errorLogger.log(methodStr, ex.stack);
        if (req.query.debug) {
          return res
            .status(500)
            .send(
              `${args}\n\n${funcStr}\n\n${JSON.stringify(
                apiMethod
              )}\n\n${result}\n\n${ex}\n\n${ex.stack}`
            );
        } else {
          if (ex?.message?.includes("not found"))
            return res.status(404).send(ex.message);
          return res.status(500).send(`${ex.stack}\n\n${JSON.stringify(data)}`);
        }
      }
    };

    // For /[database]/api/[entity]/[group]/[method], execute the method
    httpServer.all(
      "/:database/api/:entity/:group/:method",
      processRequest(handleApiRequest)
    );

    httpServer.get(
      "/:database/get/current/operations",
      processRequest(async (req: any, res: any) => {
        const getOpDesc = (op: any) => {
          let cmd = Objects.clone(op.command);
          // Remove $ keys
          for (const key of Object.keys(cmd).filter((k) => k.startsWith("$")))
            delete cmd[key];
          const s = Objects.yamlify(cmd);
          return s;
        };
        const dbName = req.params.database;
        const minElapsed = parseFloat(req.query.minElapsed || 0);
        const db = await dbs.get(dbName);
        let ops = await db?.getCurrentOperations(minElapsed);
        ops = ops?.filter((op: any) => op.command?.$db == dbName);
        ops = ops?.map((op) => ({
          ...op,
          desc: getOpDesc(op),
        }));
        return res.end(JSON.stringify(ops));
      })
    );

    httpServer.get(
      "/:database/kill/op",
      processRequest(async (req: any, res: any) => {
        const opId = parseInt(req.query.id);
        const db = await dbs.get(req.params.database);
        await db?.killOp(opId);
        return res.end(JSON.stringify(true));
      })
    );

    // #region 🔍 Entity CRUD
    // For /[database]/[entity]?find={...}, return the list of documents
    httpServer.get(
      "/:database/:entity",
      processRequest(async (req: any, res: any) => {
        // Response type
        res.setHeader("Content-Type", "application/json");

        const db = await dbs.get(req.params.database);
        const getArg = (name: string) => {
          if (req.query[name]) return Objects.json.parse(req.query[name]);
          return null;
        };

        const pipeline = [
          { $match: getArg("find") },
          { $limit: config.database.query.max.docs },
        ];

        const items = await db?.aggregate(req.params.entity, pipeline);

        return res.end(JSON.stringify(items));
      })
    );

    // [database]/[entity]/update
    httpServer.post(
      "/:database/:entity/update",
      processRequest(async (req: any, res: any, user: User, postData: any) => {
        const db = await dbs.get(req.params.database);
        const entity = req.params.entity;
        const _id = parseInt(req.query._id);
        const doc = postData;
        if (!doc._id) doc._id = _id;
        const result = await db?.upsert(entity, doc, false, true);
        return res.end(JSON.stringify(result));
      })
    );
    // #endregion
  };
  // #endregion

  class User {
    private constructor(public readonly data: any) {}

    static get = async (req: any, res: any, postData: any) => {
      const database = req.params.database;
      if (!database) return null;

      if (!(config.dbs || [])[database]?.users?.enabled) return null;

      const db = await dbs.get(database);

      // Attempt Google login
      if (postData?.credential) {
        return await User.googleLogin(db, postData, res);
      }

      // Attempt Cookie login
      const userLoginTokenKey = req.cookies.userLoginTokenKey;
      if (userLoginTokenKey) {
        const user = await User.cookieLogin(db, userLoginTokenKey);
        if (user) return user;
      }

      // Attempt IP login
      const user = await User.ipLogin(req, db, res);
      if (user) return user;
    };

    static googleLogin = async (db: any, postData: any, res: any) => {
      const googleUserData = await Google.verifyIdToken(postData.credential);
      let dbUser = await User.findOrCreateGoogleUser(db, googleUserData);
      await User.setLoginToken(db, dbUser, res);
      return new User(dbUser);
    };

    static cookieLogin = async (db: any, userLoginTokenKey: string) => {
      const token = await User.findTokenByKey(db, userLoginTokenKey);
      if (!token) return null;
      const dbUser = await User.findUserById(db, token.data.user._id);
      return dbUser ? new User(dbUser) : null;
    };

    static ipLogin = async (req: any, db: any, res: any) => {
      const userIP = User.getUserIP(req);
      let dbUser = await User.findUserByIP(db, userIP);
      if (!dbUser) {
        dbUser = await User.createIPUser(db, userIP);
      }
      await User.setLoginToken(db, dbUser, res);
      return new User(dbUser);
    };

    static setLoginToken = async (db: any, dbUser: any, res: any) => {
      const tokenKey = User.generateTokenKey();
      await User.createToken(db, "login", dbUser._id, tokenKey);
      User.setLoginTokenCookie(res, tokenKey);
    };

    // Helper methods
    static findOrCreateGoogleUser = async (db: any, googleUserData: any) => {
      let dbUser = (
        await db?.find("Users", {
          "google.email": googleUserData.email,
        })
      )?.first();

      if (!dbUser) {
        dbUser = {
          _id: await db?.getNewID(),
          type: null,
          ip: null,
          created: Date.now(),
          data: {
            componentClasses: {
              _ids: [],
            },
          },
          google: googleUserData,
          info: {
            image: googleUserData.picture,
            name: googleUserData.given_name,
          },
        };
        await db?.upsert("Users", dbUser);
        await User.onUserCreated(db, dbUser);
      }
      return dbUser;
    };

    static generateTokenKey = () => {
      return [...Array(20)]
        .map(() => (~~(Math.random() * 36)).toString(36))
        .join("");
    };

    static createToken = async (
      db: any,
      type: string,
      userId: string,
      tokenKey: string,
      deleteExisting = true
    ) => {
      if (deleteExisting) await User.deleteTokens(db, type, userId);
      const dbToken = {
        _id: await db?.getNewID(),
        created: Date.now(),
        expires: (Date.now() + 1000 * 60 * 60 * 24 * 30).toString(),
        type,
        data: {
          key: tokenKey,
          user: {
            _id: userId,
          },
        },
      };
      await db?.upsert("Tokens", dbToken);
    };

    static deleteTokens = async (db: any, type: string, userId: string) => {
      await db?.delete("Tokens", {
        type,
        "data.user._id": userId,
      });
    };

    static setLoginTokenCookie = (res: any, tokenKey: string) => {
      res.cookie("userLoginTokenKey", tokenKey, {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        httpOnly: true,
        sameSite: "none",
        secure: true,
        overwrite: true,
      });
    };

    static findTokenByKey = async (db: any, tokenKey: string) => {
      return (
        await db?.find("Tokens", {
          "data.key": tokenKey,
        })
      )?.first();
    };

    static findUserById = async (db: any, userId: string) => {
      return (
        await db?.find("Users", {
          _id: userId,
        })
      )?.first();
    };

    static getUserIP = (req: any) => {
      return (
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress
      ).ipToNumber();
    };

    static findUserByIP = async (db: any, userIP: any) => {
      return (
        await db?.find("Users", {
          ip: userIP,
        })
      )?.first();
    };

    static createIPUser = async (db: any, userIP: any) => {
      const dbUser = {
        _id: await db?.getNewID(),
        type: null,
        ip: userIP,
        created: Date.now(),
        data: {
          componentClasses: {
            _ids: [],
          },
        },
        google: null,
        info: {
          image: null,
          name: null,
        },
      };
      await db?.upsert("Users", dbUser);
      await User.onUserCreated(db, dbUser);
      return dbUser;
    };

    static onUserCreated = async (db: any, dbUser: any) => {
      let dbHandler = config.dbs[db.database]?.on?.user?.created;
      if (!dbHandler) return;
      dbHandler = eval(`(${dbHandler})`);
      await dbHandler(db, dbUser);
    };

    static logout = async (req: any, res: any) => {
      const database = req.params.database;
      if (!database) return null;
      if (!(config.dbs || [])[database]?.users?.enabled) null;

      const db = await dbs.get(database);

      // Retrieve the user's login token key from the request cookies.
      const userLoginTokenKey = req.cookies.userLoginTokenKey;

      // If there's a token key, proceed to invalidate it.
      if (userLoginTokenKey) {
        // Delete the token from the database.
        await db?.delete("Tokens", {
          "data.key": userLoginTokenKey,
        });

        // Clear the login token cookie from the user's browser.
        res.clearCookie("userLoginTokenKey", {
          httpOnly: true,
          sameSite: "none",
          secure: true,
        });
      }

      // You can also add additional logic here if you need to handle other tasks during logout,
      // such as logging the event or notifying other systems.

      // Optionally, you can return a confirmation message or status.
      return { message: "Logout successful" };
    };
  }

  // #endregion

  // #region Log unhandled errors
  process.on("uncaughtException", async (ex: any) => {
    mainLog.log(`Uncaught exception:`, ex.stack.bgRed);
    errorLogger.log(ex.stack);
  });
  // #endregion

  // #region 🚀 Start the server
  const start = () => {
    // Create the express app
    const httpServer = express();
    httpServer.use(compression());
    httpServer.use(express.json());
    httpServer.use(cookieParser());

    init(httpServer);

    // Start the server
    httpServer.listen(config.server.port, config.server.host);

    mainLog.log(
      `HTTP server: ${config.server.host.yellow}:${
        config.server.port.toString().green
      }`.gray
    );

    const allowedOrigins = config.server.cors
      .map((host: string) => [`https://${host}`, `http://${host}`])
      .flatMap((hosts: string[]) => hosts);

    for (const origin of allowedOrigins) {
      mainLog.log(`CORS: ${origin.green}`);
    }
  };

  process.title = config.title;

  start();
  // #endregion
})();
