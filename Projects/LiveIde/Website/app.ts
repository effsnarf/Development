import ts from "typescript";
import fs from "fs";
import "colors";
import axios from "axios";
import path from "path";
import { Configuration } from "@shared/Configuration";
import { Objects } from "@shared/Extensions.Objects";
import { Files } from "@shared/Files";
import { Http } from "@shared/Http";
import { HttpServer } from "@shared/HttpServer";
import { TypeScript } from "@shared/TypeScript";
import { DatabaseProxy } from "../../../Apps/DatabaseProxy/Client/DbpClient";
import { MemoryCache } from "@shared/Cache";

const memoryCache = new MemoryCache();

const _fetchAsJson = async (url: string) => {
  const res = await axios.get(url);
  return res.data;
};

(async () => {
  const config = (await Configuration.new()).data;
  const projectConfig = (
    await Configuration.new(
      {},
      path.join(config.project.folder, "../../", "config.yaml")
    )
  ).data;

  const componentsFolder = path.join(config.project.folder, "Components");

  const dbp = await DatabaseProxy.new(
    projectConfig.databaseProxy.url,
    _fetchAsJson
  );

  const getCompName = (path: string) => {
    return path
      .replace(componentsFolder, "")
      .replace(".ws.yaml", "")
      .replace(/\\/g, ".")
      .substring(1);
  };

  const preProcessYaml = (yaml: string) => {
    yaml = yaml.replace(/@/g, "on_");
    return yaml;
  };

  const staticFileFolders = [
    process.cwd(),
    config.project.folder,
    config.webscript.folder,
  ];

  const httpServer = await HttpServer.new(
    config.server.port,
    config.server.host,
    async (req, res, data) => {
      if (req.url.startsWith("/images/")) {
        // Redirect to img.memegenerator.net
        const url = `https://img.memegenerator.net${req.url}`;
        // Return HTTP Moved Permanently (301) to the client
        res.writeHead(301, {
          Location: url,
        });
        return res.end();
      }

      if (req.url == "/components") {
        const comps = Files.getFiles(componentsFolder, {
          recursive: true,
        })
          .filter((s) => s.endsWith(".ws.yaml"))
          .map((s) => {
            const comp = {
              name: getCompName(s),
              path: s.replace(componentsFolder, ""),
              source: Objects.parseYaml(
                preProcessYaml(fs.readFileSync(s, "utf8"))
              ),
            } as any;

            if (Configuration.getEnvironment() == "dev") {
              if (comp.source) {
                delete comp.source.template;
              }
            }

            return comp;
          });
        return res.end(JSON.stringify(comps));
      }
      if (req.url == "/component/update") {
        if (Configuration.getEnvironment() != "dev") return res.end("ok");
        // Save a log of updates, just in case
        const updateLogFolder = path.join(
          config.project.folder,
          "../",
          "Temp/Component/Updates",
          new Date().toISOString().substring(0, 10)
        );
        fs.mkdirSync(updateLogFolder, { recursive: true });
        const fileName = `${Date.now()}.json`;
        const updateLogFilePath = path.join(updateLogFolder, fileName);
        fs.writeFileSync(updateLogFilePath, JSON.stringify(data, null, 2));

        const comp = data;
        const compPath = path.join(componentsFolder, comp.path);
        const yaml = Objects.yamlify(comp.source);
        fs.writeFileSync(compPath, yaml);
        return res.end("ok");
      }
      if (req.url == "/pug") {
        let html = Objects.pugToHtml(data);
        html = html.replace(/on_/g, "@");
        // Vue:
        // Replace v-slot="value" with v-slot:[value], meaning we're selecting a slot
        // unless it's v-slot="slotProps", which means we're passing scope
        if (!html.includes('v-slot="slotProps"')) {
          html = html.replace(/v-slot="([^"]+)"/g, "v-slot:$1");
        }
        return res.end(html);
      }
      // Serve static files
      if (req.url.length > 1) {
        for (const folder of staticFileFolders) {
          const filePath = path.join(folder, req.url.replace(".js", ".ts"));
          if (fs.existsSync(filePath)) {
            // If TypeScript file, serve as compiled JavaScript
            if (path.extname(filePath) == ".ts")
              return res.end(await TypeScript.webpackify(filePath));
            if (filePath.endsWith(".yaml"))
              return res.end(
                JSON.stringify(
                  Objects.parseYaml(fs.readFileSync(filePath, "utf8"))
                )
              );
            // If image file, serve as binary
            if (Http.isImageFile(filePath)) {
              res.setHeader("Content-Type", "image/png");
              return res.end(fs.readFileSync(filePath));
            }
            // Otherwise, serve as text
            return res.end(fs.readFileSync(filePath, "utf8"));
          }
        }
      }
    },
    (req: any) => eval(`(${projectConfig.template.get})`)(dbp, req)
  );
})();
