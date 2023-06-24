import fs from "fs";
import os from "os";
import path from "path";
import colors from "colors";
const mime = require("mime") as any;
import { Http } from "./Http";
const HAML = require("./haml");
const Handlebars = require("Handlebars");
const http = require("http");

Handlebars.registerHelper("json", function (obj: any) {
  return JSON.stringify(obj);
});

class HttpServer {
  private constructor(
    port: number,
    ip: string,
    private handler: (req: any, res: any, data: any) => any,
    private getIndexPageTemplateData: (req: any) => Promise<any>
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
    getIndexPageTemplateData: (req: any) => Promise<any>
  ) {
    const server = new HttpServer(port, ip, handler, getIndexPageTemplateData);
    return server;
  }

  private async requestListener(req: any, res: any) {
    const rootPath = "./index.haml";
    try {
      const data = await Http.getPostData(req);

      console.log(req.url.green);

      const customResult = await this.handler(req, res, data);
      if (customResult) return;

      var path = req.url;

      var mimeType = HttpServer.getMimeType(path);

      console.log(mimeType);

      if (path == "/") path = rootPath;
      else path = `.${path}`;

      if (!fs.existsSync(path)) {
        path = rootPath;
      }

      res.writeHead(200, { "Content-Type": `${mimeType}; charset=utf-8` });

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
      return;
    } catch (ex: any) {
      if (!ex.message?.includes("favicon.ico")) {
        console.log(`${ex.stack?.bgRed}`);
      }
      // Set status code 500
      res.statusCode = ex.status || 500;
      res.end(ex.stack);
    }
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
