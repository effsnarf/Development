import fs from "fs";
import "colors";
import path from "path";
import { Configuration } from "@shared/Configuration";
import { Objects } from "@shared/Extensions.Objects";
import { Files } from "@shared/Files";
import Handlebars from "handlebars";

(async () => {
  const config = (await Configuration.new({ log: false })).data;

  const inputPath = process.argv[2];
  const inputFolder = path.resolve(process.argv[3]);
  // Get all the file paths, recursively
  const componentFilePaths = Files.getFiles(inputFolder, { recursive: true });
  const componentNames = componentFilePaths.map((s) =>
    s
      .replace(inputFolder, "")
      .replace("base\\", "")
      .replace(".ws.yaml", "")
      .replace(/\\/g, ".")
      .substring(1)
  );
  const wsToVue = fs.readFileSync("ws.to.vue.hbs", "utf8");
  let yaml = fs.readFileSync(inputPath, "utf8");
  yaml = yaml.replace(/\@/g, "on_");
  const source = Objects.parseYaml(yaml);

  const helpers = {} as any;

  for (const [key, value] of Object.entries(config.handlebars.helpers)) {
    helpers[key] = eval(value as string);
  }

  const context = {
    helpers,
    isAttributeName: (name: string) => {
      if (["div", "component"].includes(name)) return false;
      if (componentNames.find((c) => c == name)) return false;
      // if (name == "id") return true;
      // if (name.startsWith("v-")) return true;
      // if (name.startsWith(":")) return true;
      // if (name.startsWith("on_")) return true;
      // if ("type, value".split(", ").includes(name)) return true;
      return true;
    },
    includeAttribute: (name: string) => {
      return true;
    },
    toTemplate: (dom: any, indent?: number) => {
      const s = [] as string[];
      if (!indent) indent = 0;
      const domNode = (tag: string, attrs: any, indent: number) => {
        const indentStr = "  ".repeat(indent);
        return `${indentStr}${tag}(${(
          Object.entries(attrs)
            .map((a) => {
              return { key: a[0], value: a[1] };
            })
            .filter((a) => a.value)
            .map((attr: any) => `"${attr.key}"="${attr.value}"`) as string[]
        ).join(", ")})`;
      };
      if (Array.isArray(dom)) {
        s.push(domNode("div", {}, indent));
        for (const child of dom) {
          s.push(...context.toTemplate(child, indent + 2));
        }
        return s;
      }
      for (let child of Object.entries(dom)) {
        const tag = child[0];
        if (!child[1]) {
          s.push(domNode(tag, {}, indent));
          continue;
        }
        if (typeof child[1] == "string") {
          child = [tag, { ":value": child[1] }];
        }
        const attrs = Object.fromEntries(
          Object.entries(child[1] as any)
            .filter((a) => context.isAttributeName(a[0]))
            .filter((a) => context.includeAttribute(a[0]))
            .map((a) => [a[0].replace(/on_/g, "@"), a[1]])
        );
        const children = Object.fromEntries(
          Object.entries(child[1] as any).filter(
            (a) => !context.isAttributeName(a[0])
          )
        );
        s.push(domNode(tag, attrs, indent));
        for (const child of Object.entries(children)) {
          let dom = {} as any;
          dom[child[0]] = child[1];
          s.push(...context.toTemplate(dom, indent + 1));
        }
      }
      return s;
    },
  };

  for (const helper of Object.entries(helpers)) {
    Handlebars.registerHelper(helper[0], (...args) =>
      eval(helper[1] as string)(context, ...args)
    );
  }

  const vueComp = Handlebars.compile(wsToVue)(source);

  console.log(vueComp);
})();
