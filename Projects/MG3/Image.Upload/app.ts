import fs from "fs";
import "colors";
const formidable = require("formidable");
import http from "http";
import { Configuration } from "@shared/Configuration";
import { Loading } from "@shared/Loading";
import { Database } from "@shared/Database/Database";

(async () => {
  const config = (await Configuration.new()).data;
  const db = await Database.new(config.database);

  http
    .createServer(function (req: any, res: any) {
      if (req.url == "/upload") {
        var form = new formidable.IncomingForm();
        form.parse(req, function (err: any, fields: any, files: any) {
          const tempFilePath = files.file.filepath;
          console.log(tempFilePath);
          // access-control-allow-origin
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.write("ok");
          res.end();
          // fs.rename(oldpath, newpath, function (err) {
          //   if (err) throw err;
          //   res.write("File uploaded and moved!");
          //   res.end();
          // });
        });
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        return res.end();
      }
    })
    .listen(config.server.port, config.server.host);
})();
