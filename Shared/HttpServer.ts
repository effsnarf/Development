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
import "../Shared/Extensions";

Handlebars.registerHelper("json", function (obj: any) {
  return JSON.stringify(obj);
});

class HttpServer {
  private constructor(
    private port: number,
    private ip: string,
    private handler: (req: any, res: any, data: any) => any,
    private getIndexPageTemplateData: (req: any) => Promise<any>,
    private indexPagePath?: string
  ) {
    const server = http.createServer(this.requestListener.bind(this));
    server.listen(port, ip, () => {
      console.log(`${`Server is running on http://${ip}:${port}`.green}`);
    });
  }

  static async new(
    port: number,
    ip: string,
    handler: (req: any, res: any, data: any) => any,
    getIndexPageTemplateData: (req: any) => Promise<any>,
    indexPagePath?: string
  ) {
    const server = new HttpServer(
      port,
      ip,
      handler,
      getIndexPageTemplateData,
      indexPagePath
    );
    return server;
  }

  private async requestListener(req: any, res: any) {
    const rootPath = this.indexPagePath;

    const timer = Timer.start();

    try {
      const data = await Http.getPostData(req);

      const customResult = await this.handler(req, res, data);
      if (customResult) {
        this.logResponse(timer, req, customResult);
        return;
      }

      var path = req.url;

      var mimeType = HttpServer.getMimeType(path);

      if (path == "/") path = rootPath;
      else path = `.${path}`;

      if (!fs.existsSync(path)) {
        path = rootPath;
      }

      const status = 200;

      res.writeHead(status, { "Content-Type": `${mimeType}; charset=utf-8` });

      if (typeof mimeType == `string` && mimeType.startsWith(`video`)) {
        let readStream = fs.createReadStream(path);
        readStream.pipe(res);
      } else {
        const content = await this.getContent(req, res, path);
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
        console.log(`${ex.stack?.bgRed}`);
      }
    }
  }

  private logResponse(timer: Timer, req: any, res?: any) {
    console.log(
      `${`${this.ip}:${this.port}`.gray} ${timer.elapsed
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
    // console.log(types);
    // console.log(extension);
    return mime.types[extension];
  }

  private async getContent(req: any, res: any, path: string) {
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
          fileContent = Handlebars.compile(fileContent)(templateData);
          fileContent = HAML.render(fileContent);
          for (const key of Object.keys(templateData)) {
            fileContent = fileContent.replace(
              `(((${key})))`,
              JSON.stringify(templateData[key])
            );
          }
          return fileContent;
        } catch (ex: any) {
          console.log(`${ex.stack.bgRed}`);
          return ex.stack;
        }
      }

      return fileContent;
    } catch (ex: any) {
      console.log(ex.stack?.bgRed);
      throw { status: 500, message: ex.stack };
    }
  }
}

export { HttpServer };
