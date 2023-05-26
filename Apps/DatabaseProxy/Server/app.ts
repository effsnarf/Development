// #region ⚙️ Imports
import "colors";
import path from "path";
import fs from "fs";
import util from "util";
import axios from "axios";
import express from "express";
import cookieParser from "cookie-parser";
import "@shared/Extensions";
import { Http } from "@shared/Http";
import { Timer, IntervalCounter } from "@shared/Timer";
import { Google } from "@shared/Google";
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

(async () => {
  // #region User
  class User {
    private constructor(public readonly data: any) {}

    static get = async (req: any, res: any, postData: any) => {
      const database = req.params.database;
      if (!database) return null;

      const db = await dbs.get(database);

      // Google login
      if (postData?.credential) {
        const googleUserData = await Google.verifyIdToken(postData.credential);
        let dbUser = (
          await db?.find("Users", {
            "google.email": googleUserData.email,
          })
        )?.first();

        // If the user doesn't exist, create it
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
        }

        // Create a login token
        // 20 character random string
        const tokenKey = [...Array(20)]
          .map((i) => (~~(Math.random() * 36)).toString(36))
          .join("");

        // Delete other login tokens for this user
        await db?.delete("Tokens", {
          "data.user._id": dbUser._id,
        });

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

        // Save the token key in the response cookie
        res.cookie("userLoginTokenKey", tokenKey, {
          maxAge: 1000 * 60 * 60 * 24 * 30,
          httpOnly: true,
          sameSite: "none",
          secure: true,
          overwrite: true,
        });

        return new User(dbUser);
      }

      // Cookie login
      const userLoginTokenKey = req.cookies.userLoginTokenKey;
      if (userLoginTokenKey) {
        const token = (
          await db?.find("Tokens", {
            "data.key": userLoginTokenKey,
          })
        )?.first();
        if (token) {
          const dbUser = (
            await db?.find("Users", {
              _id: token.data.user._id,
            })
          )?.first();
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

      let dbUser = (
        await db?.find("Users", {
          ip: userIP,
        })
      )?.first();

      if (!dbUser) {
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
      }

      return new User(dbUser);
    };
  }
  // #endregion

  // #region 📝 Configuration
  const configObj = await Configuration.new();
  const config = configObj.data;
  // #endregion

  // #region 💻 Console

  // #region Create the dashboard layout
  const mainLog = Log.new(config.title);
  const itemsLog = Log.new("Items", {
    columns: [4, 3, 6],
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

        db.onMethodDone.push(
          (method: string, args: any[], result: any, dt: any) => {
            const loggedMethods = ["aggregate"];
            if (!loggedMethods.includes(method)) return;
            if (dt.elapsed < config.analytics.min.elapsed) return;
            let argsJson = JSON.stringify(args);
            // Remove the $ from $match, $sort, etc, because it can't be stored in MongoDB
            argsJson = argsJson.replace(/\$([a-z]+)/g, "$1");
            args = JSON.parse(argsJson);
            dbs._analytics?.create("db", method, { args }, dt.elapsed);
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
          itemsLog.log(
            req.method,
            res.statusCode.severifyByHttpStatus(),
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

        const entities = (await db?.getCollectionNames()).filter(
          (e: string) => !e.startsWith("_")
        );
        return res.send(entities);
      })
    );
    // #endregion

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

      // Get and inc [uniqueID] from _IdentityIntegers where _id = null
      const ids = await db?.getNewIDs(count);

      return res.send(JSON.stringify(ids));
    });

    httpServer.get(
      "/:database/get/user",
      processRequest(async (req: any, res: any, user: User) => {
        res.setHeader("Content-Type", "application/json");
        return res.send(JSON.stringify(user?.data));
      })
    );

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
        const apiMethods = await db?.find("_ApiMethods", {});
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
        const apiMethods = await db?.find("_ApiMethods", {
          entity: req.params.entity,
          group: req.params.group,
          name: req.params.method,
        });
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

    httpServer.post(
      "/:database/:entity/update",
      processRequest(async (req: any, res: any) => {
        return res.end(JSON.stringify(null));
      })
    );
    // #endregion
  };
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
