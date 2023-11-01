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
import { ChatOpenAI, Roles } from "../../../Apis/OpenAI/classes/ChatOpenAI";
import { text } from "stream/consumers";

Configuration.log = false;

console.clear();

const isDevEnv = Configuration.getEnvironment() == "dev";

const memoryCache = new MemoryCache();

const _fetchAsJson = async (url: string) => {
  const res = await axios.get(url);
  return res.data;
};

const _cache = new Map<string, any>();

const sheakspearize = async (text: string) => {
  if (_cache.has(text)) return _cache.get(text);
  const chat = await ChatOpenAI.new(Roles.ChatGPT);
  const reply = await chat.send(`Rewrite this in Sheakspearean:\n\n${text}`);
  _cache.set(text, reply);
  return reply;
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

  const analytics = await Analytics.new(config.analytics);

  const getScriptUrlCacheInvalidator = async () => {
    return await memoryCache.get("scriptUrlCacheInvalidator", () => {
      return fs
        .readFileSync(
          path.join(__dirname, "/script/startup.precompiled.js"),
          "utf-8"
        )
        .hashCode();
    });
  };

  const moduleFolders = [
    path.join(config.liveIde.folder, "Modules"),
    path.join(config.project.folder, "Modules"),
  ];

  const componentFolders = [
    path.join(config.liveIde.folder, "Components"),
    path.join(config.project.folder, "Components"),
  ];

  const getCompFilePath = (compPath: string) => {
    for (const folder of componentFolders) {
      const filePath = path.join(folder, compPath);
      if (fs.existsSync(filePath)) return filePath;
    }
    throw new Error(
      `Component file not found: ${compPath} (${componentFolders})`
    );
  };

  const toExampleCompFilePath = (compFilePath: string, index = 0) => {
    const compFolder = path.dirname(compFilePath);
    const compFileNameWoExt = path
      .basename(compFilePath)
      .replace(".ws.yaml", "");

    const exampleCompFilePath = path.join(
      compFolder,
      `${compFileNameWoExt}.example${index}.ws.yaml`
    );

    return exampleCompFilePath;
  };

  const compInfos = new Map<string, any>();
  const compIsModified = (comp: any) => {
    if (comp.name.endsWith(".example")) return false;
    const info = compInfos.get(comp.name);
    if (!info) return true;
    const lastModified = fs.statSync(getCompFilePath(comp.path)).mtimeMs;
    return lastModified > info.last.served;
  };

  const getModules = async (modulesFolder?: string): Promise<any[]> => {
    if (!modulesFolder) {
      const modules = [];
      for (const folder of moduleFolders) {
        modules.push(...((await getModules(folder)) as any[]));
      }
      return modules;
    }

    const now = Date.now();

    const moduleScriptToModule = (
      moduleFilePath: string,
      moduleScriptOrYaml: any
    ) => {
      let moduleScript = moduleScriptOrYaml;
      if (typeof moduleScript == "string")
        moduleScript = Objects.parseYaml(moduleScript);
      const module = {
        name: getModuleName(modulesFolder, moduleFilePath),
        path: moduleFilePath.replace(modulesFolder, ""),
        source: moduleScript,
      } as any;

      return module;
    };

    const modules = Files.getFiles(modulesFolder, {
      recursive: true,
    })
      .filter((moduleFilePath) => moduleFilePath.endsWith(".yaml"))
      .map((moduleFilePath) => {
        const module = moduleScriptToModule(
          moduleFilePath,
          fs.readFileSync(moduleFilePath, "utf8")
        );
        return module;
      })
      .flatMap((modules) => modules);

    return modules;
  };

  const getComponents = async (componentsFolder?: string): Promise<any[]> => {
    if (!componentsFolder) {
      const comps = [];
      for (const folder of componentFolders) {
        comps.push(...((await getComponents(folder)) as any[]));
      }
      return comps;
    }

    const now = Date.now();

    const webScriptToComp = (
      compFilePath: string,
      compWebScriptOrYaml: any
    ) => {
      let compWebScript = compWebScriptOrYaml;
      const options = { addSuffixToDuplicateKeysUnder: ["dom"] };
      if (typeof compWebScript == "string")
        compWebScript = Objects.parseYaml(preProcessYaml(compWebScript));
      compWebScript = Objects.parseYaml(
        preProcessYaml(Objects.yamlify(compWebScript))
      );
      const comp = {
        name: getCompName(componentsFolder, compFilePath),
        path: compFilePath.replace(componentsFolder, ""),
        source: compWebScript,
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
    };

    const comps = Files.getFiles(componentsFolder, {
      recursive: true,
    })
      .filter((compFilePath) => compFilePath.endsWith(".ws.yaml"))
      .map((compFilePath) => {
        const comps = [] as any[];
        let yaml = fs.readFileSync(compFilePath, "utf8");
        const comp = webScriptToComp(compFilePath, yaml);
        try {
          if (comp.source.examples && "count" in comp.source.examples)
            delete comp.source.examples;
          const compExamples = [
            ...[comp.source.example],
            ...(comp.source.examples || []),
          ]
            .filter((ce) => ce)
            .map((ce, i) =>
              webScriptToComp(toExampleCompFilePath(compFilePath, i), ce)
            );
          comps.push(...compExamples);
          comp.source._ = comp.source._ || {};
          comp.source._.examples = {
            count: compExamples.length,
          };
          comps.push(comp);
          return comps;
        } catch (ex: any) {
          console.log(comp);
          throw new Error(`Error in ${compFilePath}: ${ex.message}`); // ${ex.stack}
        }
      })
      .flatMap((comps) => comps);

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
      module: fs.readFileSync(
        path.join(config.webscript.folder, "module.template.hbs"),
        "utf8"
      ),
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
      let scriptUrlCacheInvalidator = await getScriptUrlCacheInvalidator();

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

  if (!projectConfig.databaseProxy) {
    const projectConfigPath = path.join(config.project.folder, "config.yaml");
    console.warn(
      `${
        `DatabaseProxy is not configured`.yellow
      } (${projectConfigPath.toShortPath()}: ${
        `databaseProxy.url is missing`.gray
      })`
    );
  }

  const dbp = !projectConfig.databaseProxy
    ? null
    : await DatabaseProxy.new(projectConfig.databaseProxy.url, _fetchAsJson);

  const getCompName = (componentsFolder: string, path: string) => {
    let name = path
      .replace(componentsFolder, "")
      .replace(".ws.yaml", "")
      .replace(/\\/g, ".")
      .substring(1);

    if (name.endsWith("_")) name = name.substring(0, name.length - 2);

    return name;
  };

  const getModuleName = (modulesFolder: string, path: string) => {
    let name = path
      .replace(modulesFolder, "")
      .replace(".yaml", "")
      .replace(/\\/g, ".")
      .substring(1);

    if (name.endsWith("_")) name = name.substring(0, name.length - 2);

    return name;
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

  const isLocalFile = (url: string) => {
    const localPath = path.join(__dirname, url);
    return fs.existsSync(localPath);
  };

  const staticFileFolders = [
    __dirname,
    config.project.folder,
    config.webscript.folder,
    config.website?.folder,
    config.static.folder,
  ].filter((s) => s);

  //console.log("staticFileFolders", staticFileFolders);

  const handler = !config.handler
    ? null
    : eval(`(${config.handler})`)({ Objects, process, path, fs });

  const httpServer = await HttpServer.new(
    config.title,
    config.server.port,
    config.server.host,
    async (req, res, data) => {
      if (handler) {
        const result = await handler(req, res, data);
        if (result) return result;
      }

      // This is mainly used to proxy images, to bypass NotSameOrigin
      if (req.url.startsWith("/fetch")) {
        const url = req.url.replace("/fetch?url=", "");
        const host = url.split("/")[2];
        const refererHeader = `https://${host}`;
        const res2 = await axios.get(url, {
          headers: {
            Referer: refererHeader,
          },
          responseType: "stream",
        });
        const contentType = res2.headers["content-type"];
        res.setHeader("Content-Type", contentType);
        res2.data.pipe(res);
        return true;
      }

      if (req.url.startsWith("/write/function")) {
        const chat = await ChatOpenAI.new(Roles.ChatGPT);
        const { name, argNames, desc } = data;
        for (const arg of ["name", "desc"])
          if (!data[arg]) throw new Error(`${arg} is required`);

        const reply = await chat.send(
          `write a javascript function called ${name}: ${desc}.
          the function should take ${
            argNames.length
          } arguments: ${argNames.join(", ")}
          `
        );

        // Cut everything between "function ${name}([argNames...]) {" and "}\n```"
        const code = reply
          .replace(
            new RegExp(`function ${name}\\(.*\\) {`, "s"),
            `function ${name}(${argNames.join(", ")}) {`
          )
          .replace(/\}\n```/s, "}");

        return res.end(JSON.stringify({ code }));
      }

      if (req.url.startsWith("/sheakspearize")) {
        const { text } = data;
        const reply = await sheakspearize(text);
        return res.end(JSON.stringify({ reply }));
      }

      if (req.url.startsWith("/execute/code")) {
        let { argNames, argValues, code } = data;

        if (!Array.isArray(argNames)) argNames = Object.values(argNames);

        const func = eval(
          `(async function(sheakspearize, ${argNames.join(", ")}) { ${code} })`
        );

        const result = await func(sheakspearize, ...argValues);

        return res.end(JSON.stringify(result));
      }

      if (req.url.startsWith("/img/") && !isLocalFile(req.url)) {
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

      if (req.url == "/analytics") {
        return res.end(JSON.stringify(null));
      }

      if (req.url == "/css-tool") {
        const folder = path.join(__dirname, "css-tool");
        const backupFolder = path.join(folder, "backup");
        if (!fs.existsSync(backupFolder))
          fs.mkdirSync(backupFolder, { recursive: true });
        const backupFilePath = path.join(backupFolder, `${Date.now()}.css`);
        const backupFiles = fs.readdirSync(backupFolder);
        const latestBackupFile = [...backupFiles]
          .sortBy((a) => parseInt(a))
          .last();
        const latestBackupFilePath = !latestBackupFile
          ? ""
          : path.join(backupFolder, latestBackupFile);
        const cssToolFilePath = path.join(folder, "style.css");
        if (!fs.existsSync(cssToolFilePath))
          fs.writeFileSync(cssToolFilePath, "{}");
        switch (req.method) {
          case "GET":
            const css = JSON.parse(fs.readFileSync(cssToolFilePath, "utf8"));
            return res.end(JSON.stringify(css));
          case "POST":
            const css1 = fs.readFileSync(cssToolFilePath, "utf8");
            const latestBackupJson = !latestBackupFile
              ? null
              : fs.readFileSync(latestBackupFilePath, "utf8");
            if (css1 != latestBackupJson)
              fs.writeFileSync(backupFilePath, css1);
            fs.writeFileSync(cssToolFilePath, JSON.stringify(data.css));
            return res.end("ok");
        }
      }

      if (req.url == "/modules") {
        const modules = await getModules();
        return res.end(JSON.stringify(modules));
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
        const comp = data;

        if (
          comp.name.includes(".example") ||
          Configuration.getEnvironment() != "dev"
        )
          return res.end("ok");

        const compPath = getCompFilePath(comp.path);
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
        html = html.replace(/\bon_/g, "@");
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
    },
    async (req: any) => await getProjectPageTemplateObject(req),
    path.join(config.liveIde.folder, "Website", "index.haml"),
    staticFileFolders,
    {
      log: {
        exclude: ["/component/update", "/pug"],
      },
    }
  );
})();
