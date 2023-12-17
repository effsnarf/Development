import fs from "fs";
import os from "os";
import path from "path";
import colors from "colors";
const mime = require("mime") as any;
import { Http } from "./Http";
import { Timer } from "./Timer";
const HAML = require("./haml");
const Handlebars = require("Handlebars");
const http = require("http");
const https = require("https");
import "../Shared/Extensions";
import { Console } from "./Console";
import { Configuration } from "./Configuration";
import { Objects } from "./Extensions.Objects";
import { TypeScript } from "./TypeScript";

Handlebars.registerHelper("json", function (obj: any) {
  return JSON.stringify(obj);
});

interface HttpServerOptions {
  log?: { exclude?: string[] };
}

class HttpServer {
  private currentRequestsCount = 0;

  private constructor(
    private appName: string,
    private port: number,
    private ip: string,
    private sslDomains: {
      name: string;
      credentials: any;
      folder: string;
      key: any;
      cert: any;
    }[],
    private handler: (req: any, res: any, data: any) => any,
    private getIndexPageTemplateData: (req: any) => Promise<any>,
    private indexPagePath: string | null,
    private staticFileFolders: string[],
    private options?: HttpServerOptions
  ) {
    this.log(`${`static folders`.gray}`);
    for (const folder of staticFileFolders) {
      this.log(`  ${folder.yellow}`);
    }

    const server = http.createServer(this.requestListener.bind(this));
    server.listen(port, ip, () => {
      console.log(this.appName.green);
      this.log(
        `${`Server is running on`.green} ${`http://${ip}:${port}`.yellow}`
      );
    });

    const sslConfig = sslDomains?.map((d) => {
      return {
        name: d.name,
        credentials: {
          key: fs.readFileSync(`${d.folder}\\${d.key}`),
          cert: fs.readFileSync(`${d.folder}\\${d.cert}`),
        },
      };
    });

    if (sslConfig?.length) {
      const server2 = https.createServer(
        sslConfig[0].credentials,
        this.requestListener.bind(this)
      );
      server2.listen(443, ip, () => {
        this.log(
          `${`Server is running on`.green} ${`https://${ip}:443`.yellow}`
        );
      });
    }
  }

  static async new(
    appName: string,
    port: number,
    ip: string,
    sslDomains: {
      name: string;
      credentials: any;
      folder: string;
      key: any;
      cert: any;
    }[],
    handler: (req: any, res: any, data: any) => any,
    getIndexPageTemplateData: (req: any) => Promise<any>,
    indexPagePath: string | null,
    staticFileFolders: string[],
    options?: HttpServerOptions
  ) {
    const server = new HttpServer(
      appName,
      port,
      ip,
      sslDomains,
      handler,
      getIndexPageTemplateData,
      indexPagePath,
      staticFileFolders,
      options
    );
    return server;
  }

  private async requestListener(req: any, res: any) {
    const timer = Timer.start();

    try {
      this.currentRequestsCount++;

      const data = await Http.getPostDataFromStream(req);

      const customResult = await this.handler(req, res, data);

      if (customResult) {
        this.logResponse(timer, req, customResult);
        return;
      }

      // #region Serve static files
      if (req.url.length > 1) {
        for (const folder of this.staticFileFolders) {
          const filePath = path.join(folder, req.url.split("?")[0]);

          const tsFilePath = filePath.replace(".js", ".ts");

          if (fs.existsSync(tsFilePath)) {
            // If TypeScript file, serve as compiled JavaScript
            if (path.extname(tsFilePath) == ".ts") {
              const precompiledPath = tsFilePath.replace(
                ".ts",
                ".precompiled.js"
              );
              if (Configuration.getEnvironment() != "dev") {
                if (fs.existsSync(precompiledPath)) {
                  return res.end(fs.readFileSync(precompiledPath, "utf8"));
                }
              }
              const compiledJsCode = await TypeScript.webpackify(tsFilePath);
              fs.writeFileSync(precompiledPath, compiledJsCode);
              return res.end(compiledJsCode);
            }
          }

          if (fs.existsSync(filePath)) {
            if (filePath.endsWith(".yaml"))
              return res.end(
                JSON.stringify(
                  Objects.parseYaml(fs.readFileSync(tsFilePath, "utf8"))
                )
              );
            // If image file, serve as binary
            if (Http.isImageFile(filePath)) {
              res.setHeader("Content-Type", `image/${path.extname(filePath)}`);
              return res.end(fs.readFileSync(filePath));
            }
            if (Http.isVideoFile(filePath)) {
              res.setHeader("Content-Type", "video/mp4");
              return res.end(fs.readFileSync(filePath));
            }
            // Otherwise, serve as text
            return res.end(fs.readFileSync(filePath, "utf8"));
          }
        }
      }
      // #endregion

      var reqPath = req.url;

      var mimeType = HttpServer.getMimeType(reqPath);

      if (reqPath == "/") reqPath = this.indexPagePath;
      else reqPath = `.${path}`;

      if (!fs.existsSync(reqPath)) {
        reqPath = this.indexPagePath;
      }

      const status = 200;

      res.writeHead(status, { "Content-Type": `${mimeType}; charset=utf-8` });

      if (typeof mimeType == `string` && mimeType.startsWith(`video`)) {
        let readStream = fs.createReadStream(reqPath);
        readStream.pipe(res);
      } else {
        const content = await this.getContent(req, res, reqPath);
        if (typeof content == `string`) {
          res.write(content, "utf-8");
        } else {
          res.write(content);
        }
        res.end();
      }
      this.logResponse(timer, req, res);
      return;
    } catch (ex: any) {
      this.logResponse(timer, req);
      // Set status code 500
      res.statusCode = ex.status || 500;
      res.end(ex.stack);
      if (!ex.message?.includes("favicon.ico")) {
        this.logResponse(timer, req, res);
        this.log(`${ex.stack?.bgRed}`);
      }
    } finally {
      this.currentRequestsCount--;
    }
  }

  private logResponse(timer: Timer, req: any, res?: any) {
    if (this.options?.log?.exclude?.includes(req.url)) return;

    this.log(
      `${timer.elapsed
        ?.unitifyTime()
        .severify(100, 500, "<")
        .padStartChars(
          6
        )} ${res?.statusCode?.severifyByHttpStatus()} ${req.url.severifyByHttpStatus(
        res?.statusCode
      )}`
    );
  }

  private static getMimeType(filePath: string) {
    let extension = path.extname(filePath).substring(1);
    if (extension == "haml") extension = "html";
    if (!extension) extension = "html";
    // let types = Object.keys(mime.types);
    // types.sortBy((a) => a);
    // types = types.filter((a) => a.startsWith("h"));
    // this.log(types);
    // this.log(extension);
    return mime.types[extension];
  }

  private async getContent(req: any, res: any, path: string) {
    if (!path) return "";
    try {
      if (
        ["ico", "png", "webp", "jpeg", "jpg"].some((ext) =>
          path.endsWith(`.${ext}`)
        )
      ) {
        // Read the file content as binary
        const bytes = fs.readFileSync(path);
        return bytes;
      }

      let fileContent = fs.readFileSync(path, "utf-8");

      if (path.endsWith(".haml")) {
        try {
          let templateData = await this.getIndexPageTemplateData(req);
          // Before %body, add templateData.staticStylesheets (string[]) lines
          // with "    " (4 spaces) indentation
          fileContent = fileContent.replace(
            /  %body/g,
            templateData.staticStylesheets
              ?.map((line: string) => `    ${line}`)
              .join("\n") + "\n %body"
          );
          // Same for templateData.staticJavaScripts (string[])
          fileContent = fileContent.replace(
            /%body/g,
            (
              templateData.staticJavaScripts
                ?.map((line: string) => `    ${line}`)
                .join("\n") + "\n  %body"
            ).substring(2)
          );
          fileContent = Handlebars.compile(fileContent)(templateData);
          fileContent = HAML.render(fileContent);
          fileContent = `<!DOCTYPE html>\n${fileContent}`;
          for (const key of Object.keys(templateData)) {
            fileContent = fileContent.replace(
              new RegExp(`(((${key})))`.escapeRegExp(), "g"),
              JSON.stringify(templateData[key])
            );
          }
          return fileContent;
        } catch (ex: any) {
          this.log(`${ex.stack.bgRed}`);
          this.log(fileContent.bgRed);
          return `${fileContent}\n\n${ex.stack}`;
        }
      }

      return fileContent;
    } catch (ex: any) {
      this.log(ex.stack?.bgRed);
      throw { status: 500, message: ex.stack };
    }
  }

  private log(...args: any[]) {
    args.unshift(
      `${this.currentRequestsCount.severify(10, 20, "<")} ${`reqs`.gray}`
    );
    args.unshift(`${new Date().toLocaleTimeString().gray}`);
    args.unshift(`${this.appName?.gray}`);
    const window = Console.getWindowSize();
    // Make sure that args fit in the console window
    while (args.join(" ").length > window.width) {
      // Find the longest argument and remove a character from it
      const argsLength = args.join(" ").length;
      const longestArg = args.reduce((a, b) => (a.length > b.length ? a : b));
      const index = args.indexOf(longestArg);
      args[index] = args[index].shorten(args[index].length - 1);
    }
    console.log(...args);
    Console.moveCursorUp();
  }
}

export { HttpServer };
