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
import isAttributeName from "@shared/WebScript/is.attribute.name";

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

  const compInfos = new Map<string, any>();
  const compIsModified = (comp: any) => {
    const info = compInfos.get(comp.name);
    if (!info) return true;
    const lastModified = fs.statSync(
      path.join(componentsFolder, comp.path)
    ).mtimeMs;
    return lastModified > info.last.served;
  };

  const getComponents = async () => {
    const now = Date.now();

    const comps = Files.getFiles(componentsFolder, {
      recursive: true,
    })
      .filter((s) => s.endsWith(".ws.yaml"))
      .map((s) => {
        let yaml = fs.readFileSync(s, "utf8");

        yaml = preProcessYaml(yaml);

        const comp = {
          name: getCompName(s),
          path: s.replace(componentsFolder, ""),
          source: Objects.parseYaml(yaml),
        } as any;

        if (Configuration.getEnvironment() == "dev") {
          if (comp.source) {
            delete comp.source.template;
          }
        }

        if (!compInfos.has(comp.name)) {
          compInfos.set(comp.name, {
            last: {
              served: now,
            },
          });
        }

        return comp;
      });
    return comps;
  };

  const getChangedComponents = async () => {
    const now = Date.now();
    const comps = await getComponents();
    const changedComps = comps.filter(compIsModified);
    changedComps.forEach((c) => {
      const info = compInfos.get(c.name);
      info.last.served = now;
    });
    return changedComps;
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
      // Current date is used to invalidate the script url cache (day date only, without time)
      let scriptUrlCacheInvalidator = parseInt(
        new Date().toISOString().split("T")[0].replace(/-/g, "")
      );

      return {
        components,
        templates,
        helpers,
        config,
        scriptUrlCacheInvalidator: scriptUrlCacheInvalidator,
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
    // Replace @ with on_
    yaml = yaml.replace(/@/g, "on_");
    // Normalize line endings
    yaml = yaml.replace(/\r\n|\r/g, "\n");
    // Normalize indentation to spaces
    yaml = yaml.replace(/\t/g, "  ");
    // Remove #1, #2, etc from the end of keys (div#1: -> div:)
    // that may have been left from the previous step
    yaml = yaml.replace(/(\w+)#\d+:/g, "$1: ");
    // Find duplicate lines
    // example:
    //   div:
    //   div:
    // have the same indent and key, so we add #1, #2, etc to the end of the keys
    // Crop everything from "dom:\n" to the first line that starts with a letter
    let domSection =
      (yaml.match(/dom:\n([\s\S]*?)(?=\n[a-zA-Z])/m) || [])[0] || "";
    const afterDomSection = yaml.replace(domSection, "");
    const keyLines = [...yaml.matchAll(/^(\s+)[\w.]+:/gm)]
      .flatMap((a) => a)
      .filter((a) => !a.startsWith("\n"))
      .filter((a) => a.trim().length);
    for (const keyLine of keyLines) {
      const key = keyLine.replace(":", "");
      if (isAttributeName([], key.trim())) continue;
      const keyRegex = new RegExp(keyLine, "gm");
      const matches = [...domSection.matchAll(keyRegex)];
      if (matches.length > 1) {
        for (let i = 0; i < matches.length; i++) {
          const match = matches[i];
          domSection = domSection.replace(match[0], `${key}#${i + 1}:`);
        }
      }
    }
    yaml = `${domSection}${afterDomSection}`;
    return yaml;
  };

  const postProcessYaml = (yaml: string) => {
    // Replace on_ with @
    yaml = yaml.replace(/\bon_/g, "@");
    // Add "# js" after method keys (  onLayerImageLoad: |)
    // Regex is two whitespaces, then a key, then a colon, then a space, then a pipe
    yaml = yaml.replace(/  (\w+): \|/g, "  $1: | #js");
    // Also replace:
    // mounted: |
    yaml = yaml.replace(/mounted: \|/g, "mounted: | #js");
    // Remove #1, #2, etc from the end of keys (div#1: -> div:)
    yaml = yaml.replace(/(\w+)#\d+:/g, "$1: ");
    return yaml;
  };

  const isLocalFolder = (url: string) => {
    const localPath = path.join(process.cwd(), url);
    return fs.existsSync(localPath);
  };

  const staticFileFolders = [
    process.cwd(),
    config.project.folder,
    config.webscript.folder,
    config.website?.folder,
  ].filter((s) => s);

  console.log("staticFileFolders", staticFileFolders);

  const httpServer = await HttpServer.new(
    config.title,
    config.server.port,
    config.server.host,
    async (req, res, data) => {
      if (req.url.startsWith("/img/") && !isLocalFolder(req.url)) {
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
      if (req.url == "/changed/components") {
        const comps = await getChangedComponents();
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
          preProcessYaml(fs.readFileSync(compPath, "utf8"))
        );
        if (!existingComp) throw new Error(`Component ${comp.name} not found`);
        if (!("editable" in existingComp) || existingComp.editable) {
          let yaml = Objects.yamlify(comp.source);
          yaml = postProcessYaml(yaml);
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
          const filePath = path.join(
            folder,
            req.url.split("?")[0].replace(".js", ".ts")
          );
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
            if (Http.isVideoFile(filePath)) {
              res.setHeader("Content-Type", "video/mp4");
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
