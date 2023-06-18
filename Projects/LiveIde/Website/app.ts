import ts from "typescript";
import fs from "fs";
import "colors";
import path from "path";
import { Configuration } from "@shared/Configuration";
import { Objects } from "@shared/Extensions.Objects";
import { Files } from "@shared/Files";
import { HttpServer } from "@shared/HttpServer";
import { TypeScript } from "@shared/TypeScript";

(async () => {
  const config = (await Configuration.new()).data;

  const getCompName = (path: string) => {
    return path
      .replace(config.project.folder, "")
      .replace(".ws.yaml", "")
      .replace(/\\/g, ".")
      .substring(1);
  };

  const preProcessYaml = (yaml: string) => {
    yaml = yaml.replace(/@/g, "on_");
    return yaml;
  };

  const httpServer = await HttpServer.new(
    config.server.port,
    config.server.host,
    async (req, res, data) => {
      if (req.url.endsWith(".js")) {
        const tsPath = path.join(process.cwd(), req.url.replace(".js", ".ts"));
        if (fs.existsSync(tsPath)) {
          //const tsCode = fs.readFileSync(tsPath, "utf8");
          const jsCode = await TypeScript.webpackify(tsPath);
          return res.end(jsCode);
        }
      }
      if (req.url == "/components") {
        const comps = Files.getFiles(config.project.folder, {
          recursive: true,
        })
          .filter((s) => s.endsWith(".ws.yaml"))
          .map((s) => {
            return {
              name: getCompName(s),
              path: s.replace(config.project.folder, ""),
              source: Objects.parseYaml(
                preProcessYaml(fs.readFileSync(s, "utf8"))
              ),
            };
          });
        return res.end(JSON.stringify(comps));
      }
      if (req.url == "/pug") {
        let html = Objects.pugToHtml(data);
        // Vue:
        // Replace v-slot="value" with v-slot:[value], meaning we're selecting a slot
        // unless it's v-slot="slotProps", which means we're passing scope
        if (!html.includes('v-slot="slotProps"')) {
          html = html.replace(/v-slot="([^"]+)"/g, "v-slot:$1");
        }
        return res.end(html);
      }
      if (req.url.length > 1) {
        const staticPath = path.join(
          __dirname,
          "../../../Shared/WebScript",
          req.url
        );
        if (fs.existsSync(staticPath)) {
          let content = fs.readFileSync(staticPath, "utf8");
          if (staticPath.endsWith(".yaml"))
            content = JSON.stringify(Objects.parseYaml(content));
          return res.end(content);
        }
      }
    }
  );
})();
