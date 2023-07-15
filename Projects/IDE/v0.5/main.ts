import fs from "fs";
import os from "os";
import path from "path";
import colors from "colors";
import mime from "mime-types";
import yaml from "yaml";
const HAML = require("haml");
const Handlebars = require("Handlebars");
const http = require("http");
const https = require("https");
import { Configuration } from "../../../Shared/Configuration";
import { Cache } from "../../../Shared/Cache";
import { ChatOpenAI, Roles } from "../../../Apis/OpenAI/classes/ChatOpenAI";

(async () => {
  const config = (await Configuration.new()).data;

  const cache = await Cache.new(config.cache);

  const chat = await ChatOpenAI.new(Roles.ChatGPT);

  const getMimeType = (path: string) => {
    if (path.toLowerCase().endsWith(".haml")) return mime.lookup("html");
    return mime.lookup(path);
  };

  const getContent = async (path: string) => {
    try {
      if (path.startsWith(`./v0.6/`)) path = `../${path.substring(2)}`;
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
        return HAML.render(fileContent);
      }
      return fileContent;
    } catch (ex: any) {
      console.log(`File not found: ${path}`.bgRed);
      return "";
    }
  };

  const requestListener = async function (req: any, res: any) {
    try {
      var path = req.url;
      if (path.startsWith("/api/")) {
        // /api/css/[propertyName]/values
        if (path.startsWith("/api/css/")) {
          const propertyName = path.split("/")[3];
          const values = await cache.get(
            `css-${propertyName}-values`,
            async () => {
              const data = Objects.json.parse(
                await chat.send(
                  `give me a list of possible values for the css property [${propertyName}], in a json array. reply only with the json array of values and nothing else`
                )
              );
              return data;
            }
          );
          // Set the content type
          res.writeHead(200, {
            "Content-Type": `application/json; charset=utf-8`,
          });
          res.write(JSON.stringify(values), "utf-8");
          res.end();
          return;
        }
      }

      var mimeType = getMimeType(path);
      //console.log(`${mimeType}\t${path.yellow}\t`);
      if (path == "/") path = "./index.html";
      else path = `.${path}`;
      res.writeHead(200, { "Content-Type": `${mimeType}; charset=utf-8` });

      if (path == `./ide.classes.yaml.json`) {
        let srcs = [] as string[];
        for (const file of fs.readdirSync(`../v0.6/classes`)) {
          if (!file.endsWith(`.js.yaml`)) return;
          srcs.push(await getContent(`../v0.6/classes/${file}`));
        }
        res.write(JSON.stringify(srcs), "utf-8");
        res.end();
        return;
      }

      if (typeof mimeType == `string` && mimeType.startsWith(`video`)) {
        let readStream = fs.createReadStream(path);
        readStream.pipe(res);
      } else {
        const content = await getContent(path);
        if (typeof content == `string`) {
          res.write(content, "utf-8");
        } else {
          res.write(content);
        }
        res.end();
      }
      return;
    } catch (ex: any) {
      console.log(`${ex.stack}`);
      res.write(ex.toString());
      res.end();
    }
  };

  const isDevEnv = os.hostname() == "eff-pc";

  const { ip, port } = isDevEnv
    ? { ip: `127.0.0.1`, port: 80 }
    : { ip: `10.35.16.38`, port: 80 };

  console.log(`Vue Studio`);
  console.log(`${`http(s)://${ip}:${port}/`}`);

  const server = http.createServer(requestListener);
  server.listen(port, ip);
})();
