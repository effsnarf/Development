import fs from "fs";
import os from "os";
import path from "path";
import colors from "colors";
import mime from "mime-types";
import { Http } from "./Http";
const HAML = require("./haml");
const Handlebars = require("Handlebars");
const http = require("http");

class HttpServer {
  private constructor(
    port: number,
    ip: string,
    private handler: (req: any, res: any, data: any) => any
  ) {
    const server = http.createServer(this.requestListener.bind(this));
    server.listen(port, ip, () => {
      console.log(`${`Server is running on http://${ip}:${port}`.green}`);
    });
  }

  static async new(
    port: number,
    ip: string,
    handler: (req: any, res: any, data: any) => any
  ) {
    const server = new HttpServer(port, ip, handler);
    return server;
  }

  private async requestListener(req: any, res: any) {
    try {
      const data = await Http.getPostData(req);

      console.log(req.url.green);

      const customResult = await this.handler(req, res, data);
      if (customResult) return;

      var path = req.url;

      var mimeType = HttpServer.getMimeType(path);
      if (path == "/") path = "./index.haml";
      else path = `.${path}`;
      res.writeHead(200, { "Content-Type": `${mimeType}; charset=utf-8` });

      if (typeof mimeType == `string` && mimeType.startsWith(`video`)) {
        let readStream = fs.createReadStream(path);
        readStream.pipe(res);
      } else {
        const content = await HttpServer.getContent(path);
        if (typeof content == `string`) {
          res.write(content, "utf-8");
        } else {
          res.write(content);
        }
        res.end();
      }
      return;
    } catch (ex: any) {
      if (!ex.message.includes("favicon.ico")) {
        console.log(`${ex.message?.bgRed}`);
      }
      // Set status code 500
      res.statusCode = ex.status || 500;
      res.end(ex.message);
    }
  }

  private static getMimeType(path: string) {
    if (path.toLowerCase().endsWith(".haml")) return mime.lookup("html");
    return mime.lookup(path);
  }

  private static getContent(path: string) {
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

      const fileContent = fs.readFileSync(path, "utf-8");
      if (path.endsWith(".haml")) {
        try {
          return HAML.render(fileContent);
        } catch (ex: any) {
          console.log(`${ex.stack.bgRed}`);
          return ex.toString();
        }
      }
      return fileContent;
    } catch (ex: any) {
      console.log(`File not found: ${path}`.bgRed);
      throw { status: 404, message: `File not found: ${path}` };
    }
  }
}

export { HttpServer };
