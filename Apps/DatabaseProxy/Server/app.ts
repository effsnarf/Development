// #region ⚙️ Imports
import "colors";
import path from "path";
import fs from "fs";
import util from "util";
import axios from "axios";
import express from "express";
import cookieParser from "cookie-parser";
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

const cache = {
  _store: null as CacheBase | null,
  _getStore: async () => {
    if (!cache._store)
      cache._store = await Cache.new({
        memory: true,
      });
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
            return { apiMethods: await db?.find("_ApiMethods", {}) };
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
            return { collectionNames: await db?.getCollectionNames() };
          })
        )?.collectionNames;
      },
    },
  },
};

const getResponseSize = (response: any) => {
  if (!response.headers) return null;
  return parseInt(response.headers["content-length"] || 0);
};

(async () => {
  // #region 📝 Configuration
  const configObj = await Configuration.new({
    quitIfChanged: [path.resolve(__dirname, "../Client/Client.js")],
  });
  const config = configObj.data;
  // #endregion

  // #region 💻 Console

  // #region Create the dashboard layout
  const mainLog = Log.new(config.title);
  const itemsLog = Log.new("Items", {
    columns: [4, 3, 6, 6],
    breakLines: true,
    extraSpaceForBytes: true,
  });
  const debugLog = Logger.new(config.log);

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
  const dbs = {
    _analytics: null as Analytics | null,
    _dbs: new Map<string, MongoDatabase>(),
    get: async (dbName: string) => {
      if (!dbs._analytics) {
        if (config.analytics.database) {
          dbs._analytics = await Analytics.new(
            await Database.new(config.analytics.database)
          );
        }
      }

      if (!dbs._dbs.has(dbName)) {
        const db = await MongoDatabase.new(
          config.database.connectionString,
          dbName
        );

        Reflection.bindClassMethods(
          db,
          () => Timer.start(),
          (timer, className, methodName, args) => {
            if (timer.elapsed < config.analytics.min.elapsed) return;
            // Remove the $ from $match, $sort, etc, because it can't be stored in MongoDB
            args = args.map((arg) =>
              JSON.parse(JSON.stringify(arg).replace(/\$([a-z]+)/g, "$1"))
            );
            dbs._analytics?.create(
              className,
              methodName,
              { database: { name: dbName }, args },
              timer.elapsed
            );
          }
        );

        dbs._dbs.set(dbName, db);
      }
      return dbs._dbs.get(dbName);
    },
  };
  // #endregion

  // #region 🔍 Request Handling
  const init = (httpServer: express.Express) => {
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
        const url = req.url;
        const method = req.method;
        const body = req.body;
        const proxyUrl = `https://${config.server.proxy}${url}`;

        const timer = Timer.start();

        axios({
          method: method,
          url: proxyUrl,
          data: body,
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
                JSON.stringify(ex.response.data).bgRed
              );
            }
            res.status(ex.response.status).send(ex.response.data);
          });
        return;
      });
      return;
    }
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
          const user = await User.get(req, res, data);
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
          return res.send(jsCode);
        }
        // Get [__dirname]/Client/[fileName].js
        const jsFilePath = path.join(__dirname, "../Client", fileName);
        if (fs.existsSync(jsFilePath)) {
          // Read the JavaScript file
          const jsCode = fs.readFileSync(jsFilePath, "utf8");
          // Return the JavaScript code
          return res.send(jsCode);
        }
        // If the file doesn't exist, return 404
        return res.status(404).send(`${jsFilePath} not found`);
      })
    );
    // #endregion

    // For /, return "Add a database name to the URL: /[database]"
    httpServer.get("/", (req: any, res: any) => {
      return res.send("Add a database name to the URL: /[database]");
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
        return res.send(entities);
      })
    );
    // #endregion

    // [database]/get/googleLogin
    httpServer.post(
      "/:database/get/googleLogin",
      processRequest((req: any, res: any, user: User, postData: any) => {
        res.setHeader("Content-Type", "application/json");
        if (!postData?.credential) return res.send(JSON.stringify(null));
        return res.send(JSON.stringify(user?.data));
      })
    );

    // For /[database]/get/new/id, return a new unique ID
    httpServer.get("/:database/get/new/id", async (req: any, res: any) => {
      // Response type
      res.setHeader("Content-Type", "application/json");

      const count = parseInt(req.query.count || 1);

      const db = await dbs.get(req.params.database);

      const ids = await db?.getNewIDs(count);

      return res.send(JSON.stringify(ids));
    });

    // [database]/get/user (returns the user object)
    httpServer.get(
      "/:database/get/user",
      processRequest(async (req: any, res: any, user: User) => {
        res.setHeader("Content-Type", "application/json");
        return res.send(JSON.stringify(user?.data));
      })
    );

    // /[database]/set/user
    httpServer.get(
      "/:database/set/user",
      processRequest(async (req: any, res: any, user: User) => {
        res.setHeader("Content-Type", "application/json");
        return res.send(JSON.stringify(user?.data));
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
        return res.send(entities);
      })
    );

    // For /[database]/api/[entity]/[group]/[method], execute the method
    httpServer.get(
      "/:database/api/:entity/:group/:method",
      processRequest(async (req: any, res: any, user: User) => {
        // Response type
        res.setHeader("Content-Type", "application/json");

        const db = await dbs.get(req.params.database);
        const apiMethods = (await cache.get.api.methods(db))?.filter(
          (m: any) =>
            m.entity == req.params.entity &&
            m.group == req.params.group &&
            m.name == req.params.method
        );
        if (!apiMethods?.length)
          return res.status(404).send("Method not found");
        const apiMethod = apiMethods[0];
        const funcStr = `async (fs, user, db, db${
          req.params.entity
        }, axios, ${apiMethod.args.join(", ")}) => { ${apiMethod.code} }`;
        const func = eval(funcStr);
        const collection = await db?.getCollection(req.params.entity);
        const args = apiMethod.args.map((arg: any) =>
          JSON.parse(req.query[arg] || "null")
        );

        const start = Date.now();

        let result: any;

        try {
          result = await func(fs, user, db, collection, axios, ...args);

          const elapsed = Date.now() - start;

          let methodStr = `${req.params.entity}.${req.params.group}.${req.params.method}`;

          if (elapsed < config.analytics.min.elapsed) {
            methodStr = methodStr.gray;
          } else {
            dbs._analytics?.create("api", methodStr, { args }, elapsed);
          }

          return res.send(result);
        } catch (ex: any) {
          return res
            .status(500)
            .send(
              `${args}\n\n${funcStr}\n\n${JSON.stringify(
                apiMethod
              )}\n\n${result}\n\n${ex.stack}`
            );
        }
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
          if (req.query[name]) return JSON.parse(req.query[name]);
          return null;
        };

        const pipeline = [
          {
            $match: getArg("find"),
            $limit: config.database.query.max.docs,
          },
        ];

        const items = await db?.aggregate(req.params.entity, pipeline);

        return res.send(items);
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

  // #region 📝 Logging
  const debugLogger = Logger.new(config.log);
  debugLogger.log(Objects.yamlify(config));
  // #endregion

  // #region User
  class User {
    private constructor(public readonly data: any) {}

    static get = async (req: any, res: any, postData: any) => {
      debugLogger.log("[User.get] entered with arguments:", req, res, postData);

      const database = req.params.database;
      debugLogger.log("[User.get] Retrieving database:", database);
      if (!database) {
        debugLogger.log("[User.get] No database found. Returning null.");
        return null;
      }

      if (!(config.dbs || [])[database]?.users?.enabled) {
        debugLogger.log(
          "[User.get] User not enabled in the database. Returning null."
        );
        return null;
      }

      const db = await dbs.get(database);
      debugLogger.log("[User.get] Database retrieved:", db);

      // Google login
      if (postData?.credential) {
        debugLogger.log(
          "[User.get] Attempting Google login with credential:",
          postData.credential
        );

        const googleUserData = await Google.verifyIdToken(postData.credential);
        debugLogger.log(
          "[User.get] Google user data retrieved:",
          googleUserData
        );

        let dbUser = (
          await db?.find("Users", {
            "google.email": googleUserData.email,
          })
        )?.first();
        debugLogger.log("[User.get] Database user retrieved:", dbUser);

        // If the user doesn't exist, create it
        if (!dbUser) {
          debugLogger.log(
            "[User.get] User does not exist in the database. Creating a new user."
          );

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
          debugLogger.log(
            "[User.get] New user created in the database:",
            dbUser
          );
        }

        // Create a login token
        // 20 character random string
        const tokenKey = [...Array(20)]
          .map((i) => (~~(Math.random() * 36)).toString(36))
          .join("");

        debugLogger.log("[User.get] Login token key generated:", tokenKey);

        // Delete other login tokens for this user
        await db?.delete("Tokens", {
          "data.user._id": dbUser._id,
        });
        debugLogger.log(
          "[User.get] Other login tokens deleted for the user:",
          dbUser._id
        );

        // Create a new login token
        const dbToken = {
          _id: await db?.getNewID(),
          created: Date.now(),
          expires: (Date.now() + 1000 * 60 * 60 * 24 * 30).toString(),
          type: "login",
          data: {
            key: tokenKey,
            user: {
              _id: dbUser._id,
            },
          },
        };

        await db?.upsert("Tokens", dbToken);
        debugLogger.log("[User.get] New login token created:", dbToken);

        // Save the token key in the response cookie
        res.cookie("userLoginTokenKey", tokenKey, {
          maxAge: 1000 * 60 * 60 * 24 * 30,
          httpOnly: true,
          sameSite: "none",
          secure: true,
          overwrite: true,
        });
        debugLogger.log("[User.get] Token key saved in the response cookie.");

        return new User(dbUser);
      }

      // Cookie login
      const userLoginTokenKey = req.cookies.userLoginTokenKey;
      debugLogger.log(
        "[User.get] Retrieving userLoginTokenKey from cookies:",
        userLoginTokenKey
      );
      if (userLoginTokenKey) {
        debugLogger.log(
          "[User.get] Attempting cookie login with token key:",
          userLoginTokenKey
        );

        const token = (
          await db?.find("Tokens", {
            "data.key": userLoginTokenKey,
          })
        )?.first();
        debugLogger.log("[User.get] Token retrieved from the database:", token);

        if (token) {
          const dbUser = (
            await db?.find("Users", {
              _id: token.data.user._id,
            })
          )?.first();
          debugLogger.log(
            "[User.get] User retrieved from the database:",
            dbUser
          );

          if (dbUser) {
            return new User(dbUser);
          }
        }
      }

      // IP login
      const userIP = (
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress
      ).ipToNumber();
      debugLogger.log("[User.get] IP address retrieved:", userIP);

      let dbUser = (
        await db?.find("Users", {
          ip: userIP,
        })
      )?.first();
      debugLogger.log("[User.get] Database user retrieved:", dbUser);

      if (!dbUser) {
        debugLogger.log(
          "[User.get] User does not exist in the database. Creating a new user."
        );

        dbUser = {
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
        debugLogger.log("[User.get] New user created in the database:", dbUser);
      }

      return new User(dbUser);
    };
  }

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
    httpServer.use(cookieParser());

    init(httpServer);

    // Start the server
    httpServer.listen(config.server.port, config.server.host);

    mainLog.log(
      `HTTP server running on ${config.server.host.yellow}:${
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
