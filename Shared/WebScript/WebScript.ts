import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { Objects } from "../Extensions.Objects";
import toTemplate from "./to.template";
import isAttributeName from "../../Shared/WebScript/is.attribute.name";
import { Files } from "../Files";
import { preProcessYaml } from "./preprocess";

class WebScript {
  // #region Globals

  private static _helpers: any;

  static getHelpers() {
    return Objects.parseYaml(
      fs.readFileSync(path.join(__dirname, "handlebars.helpers.yaml"), "utf8")
    ).helpers;
  }

  private static getVueTemplate() {
    return fs.readFileSync(path.join(__dirname, "vue.template.hbs"), "utf8");
  }

  private static getVueSfcTemplate() {
    return fs.readFileSync(
      path.join(__dirname, "vue.sfc.template.hbs"),
      "utf8"
    );
  }

  // #endregion

  static getCompName(baseFolder: string, filePath: string) {
    return filePath
      .replace(baseFolder, "")
      .replace(/^\//, "")
      .replace(/\.ws\.yaml$/, "")
      .replace(/\//g, ".")
      .substring(1)
      .replace(/\\/g, ".")
      .replace(/\._/g, "");
  }

  static capitalizeCompName(compName: string) {
    return compName
      .split(".")
      .map((s) => s.capitalize())
      .join("");
  }

  static load(baseFolder: string, filePath: string) {
    // Normalize baseFolder and path
    baseFolder = path.normalize(path.resolve(baseFolder));
    filePath = path.normalize(path.resolve(filePath));
    const fileName = filePath.split("/").pop() as string;
    // If the base folder is /comps and the path is /comps/input/text/box.ws.yaml,
    // then the component name is input.text.box
    const compName = WebScript.getCompName(baseFolder, filePath);
    const capitalizedName = WebScript.capitalizeCompName(compName);

    const allCompFiles = Files.getFiles(baseFolder, { recursive: true }).filter(
      (f) => f.endsWith(".ws.yaml")
    );

    const allCompNames = allCompFiles.map((f) => ({
      path: f,
      name: WebScript.getCompName(baseFolder, f),
    }));

    const allComps = allCompNames
      .map((cn) => ({
        name: cn.name,
        capitalized: WebScript.capitalizeCompName(cn.name),
      }))
      .map((cn) => ({
        ...cn,
        path: {
          relative:
            compName == "app"
              ? `./components/${cn.capitalized}.vue`
              : `./${cn.capitalized}.vue`,
        },
      }));

    const compYaml = preProcessYaml(fs.readFileSync(filePath, "utf8"));
    const source = Objects.parseYaml(compYaml);
    const sourceDomStr = JSON.stringify(source.dom, null, 2);

    const refdComps = allComps
      .filter((c) => c.name != "app")
      .filter((c) => c.name != compName)
      .filter((c) => sourceDomStr.includesWholeWord(c.name));

    source.name = compName;
    source.capitalizedName = capitalizedName;
    source.refdComps = refdComps;
    const input = {
      name: compName,
      capitalizedName: capitalizedName,
      source: source,
      vueComp: "",
      vueSfcComp: "",
    };
    return input;
  }

  static transpile(inputs: any | any[]) {
    if (!Array.isArray(inputs)) inputs = [inputs];

    const helpers = WebScript.getHelpers();

    const context = {
      helpers,
      isAttributeName: (name: string) =>
        WebScript.isAttributeName(
          inputs.map((c: any) => c.name),
          name
        ),
      postProcessAttribute: (attr: any[]) => {
        attr = [...attr];
        attr[0] = attr[0].replace(/\bon_/g, "@");
        return attr;
      },
      toTemplate: WebScript.toTemplate,
    };

    for (const helper of Object.entries(helpers)) {
      try {
        const code = helper[1] as string; // Type assertion
        const func = eval(`(${code})`);
        Handlebars.registerHelper(helper[0], (...args) => {
          try {
            return func(context, ...args);
          } catch (ex: any) {
            throw new Error(
              `Error executing helper ${helper[0]}: ${ex.message}\n\n${args
                .map((a) => JSON.stringify(a))
                .join("\n\n")}\n\n${helper[1]}}`
            );
          }
        });
      } catch (ex: any) {
        throw new Error(
          `Error registering helper ${helper[0]}: ${ex.message}\n\n${helper[1]}`
        );
      }
    }

    WebScript.transpileAllComponents(inputs);
  }

  private static transpileAllComponents(inputs: any[]) {
    for (const input of inputs) {
      WebScript.transpileComponent(input);
    }
  }

  private static transpileComponent(input: any, logLevel: number = 0) {
    try {
      const now = new Date();
      const time = now.toLocaleTimeString();

      if (logLevel > 0) console.log();

      console.log(`${time.gray} ${input.name.padEnd(20).cyan}`);

      const source = input.source;

      const vueComp = Handlebars.compile(WebScript.getVueTemplate())(source);
      const vueSfcComp = Handlebars.compile(WebScript.getVueSfcTemplate())(
        source
      );

      input.vueComp = vueComp;
      input.vueSfcComp = vueSfcComp;
    } catch (ex: any) {
      console.log(`Error: ${input.path}`.bgRed);
      console.log(ex.stack);
    }
  }

  private static toTemplate(
    context: any,
    dom: any,
    indent?: number,
    compName?: string,
    compType?: string
  ) {
    return toTemplate(context, dom, indent, compName, compType);
  }

  private static isAttributeName(componentNames: string[], name: string) {
    return isAttributeName(componentNames, name);
  }
}

export { WebScript };
