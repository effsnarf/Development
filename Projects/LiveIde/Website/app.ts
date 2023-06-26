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
import { Analytics, ItemType } from "@shared/Analytics";

const isDevEnv = Configuration.getEnvironment() == "dev";

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
      path.join(config.project.folder, "config.yaml"),
      false
    )
  ).data;

  console.log(config);
  console.log(projectConfig);

  const analytics = await Analytics.new(config.analytics);

  const componentsFolder = path.join(config.project.folder, "Components");

  const getComponents = async () => {
    const comps = Files.getFiles(componentsFolder, {
      recursive: true,
    })
      .filter((s) => s.endsWith(".ws.yaml"))
      .map((s) => {
        const comp = {
          name: getCompName(s),
          path: s.replace(componentsFolder, ""),
          source: Objects.parseYaml(preProcessYaml(fs.readFileSync(s, "utf8"))),
        } as any;

        if (Configuration.getEnvironment() == "dev") {
          if (comp.source) {
            delete comp.source.template;
          }
        }

        return comp;
      });
    return comps;
  };

  const getTemplates = async () => {
    return {
      vue: fs.readFileSync(
        path.join(config.webscript.folder, "vue.client.template.hbs"),
        "utf8"
      ),
      style: fs.readFileSync(
        path.join(config.webscript.folder, "style.template.hbs"),
        "utf8"
      ),
    };
  };

  const getHelpers = async () => {
    return Objects.parseYaml(
      fs.readFileSync(
        path.join(config.webscript.folder, "handlebars.helpers.yaml"),
        "utf8"
      )
    ).helpers;
  };

  const getClientConfig = async () => {
    const params = Objects.parseYaml(
      fs.readFileSync(path.join(config.project.folder, "params.yaml"), "utf8")
    );
    return {
      params,
    };
  };

  const getProjectPageTemplateObject = async (req: any) => {
    const getData = async () => {
      const components = await getComponents();
      const templates = await getTemplates();
      const helpers = await getHelpers();
      const config = await getClientConfig();
      return {
        components,
        templates,
        helpers,
        config,
      };
    };

    const data = isDevEnv
      ? await getData()
      : await memoryCache.get("projectPageTemplateObject_data", getData);

    const obj = {
      ...(await eval(`(${projectConfig.template.get})`)(dbp, req)),
      ...data,
    };

    return obj;
  };

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
    config.website.folder,
  ];

  console.log("staticFileFolders", staticFileFolders);

  const httpServer = await HttpServer.new(
    config.server.port,
    config.server.host,
    async (req, res, data) => {
      if (req.url.startsWith("/img/") && !req.url.startsWith("/img/banners/")) {
        // Redirect to img.memegenerator.net
        const url = `https://img.memegenerator.net/${req.url.replace(
          "/img/",
          ""
        )}`;
        // Return HTTP Moved Permanently (301) to the client
        res.statusCode = 301;
        res.writeHead(301, {
          Location: url,
        });
        return res.end();
      }

      if (req.url == "/components") {
        const comps = await getComponents();
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
        const existingComp = Objects.parseYaml(
          fs.readFileSync(compPath, "utf8")
        );
        if ("editable" in existingComp && !existingComp.editable) {
          const yaml = Objects.yamlify(comp.source);
          fs.writeFileSync(compPath, yaml);
        }
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
      if (req.url == "/analytics") {
        analytics.create(
          "MG",
          "site",
          "active.time",
          ItemType.Count,
          data.timeOnSite,
          data.timeOnSite,
          "ms"
        );
      }
      // Serve static files
      if (req.url.length > 1) {
        for (const folder of staticFileFolders) {
          const filePath = path.join(folder, req.url.replace(".js", ".ts"));
          if (fs.existsSync(filePath)) {
            // If TypeScript file, serve as compiled JavaScript
            if (path.extname(filePath) == ".ts") {
              const precompiledPath = filePath.replace(
                ".ts",
                ".precompiled.js"
              );
              if (Configuration.getEnvironment() != "dev") {
                if (fs.existsSync(precompiledPath)) {
                  return res.end(fs.readFileSync(precompiledPath, "utf8"));
                }
              }
              const compiledJsCode = await TypeScript.webpackify(filePath);
              fs.writeFileSync(precompiledPath, compiledJsCode);
              return res.end(compiledJsCode);
            }
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
    async (req: any) => await getProjectPageTemplateObject(req),
    path.join(config.project.folder, "../../LiveIde/Website", "index.haml")
  );
})();
