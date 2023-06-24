import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { Objects } from "../Extensions.Objects";
import toTemplate from "./to.template";

class WebScript {
  // #region Globals

  private static _helpers: any;

  static async getHelpers() {
    return Objects.parseYaml(
      fs.readFileSync(path.join(__dirname, "handlebars.helpers.yaml"), "utf8")
    ).helpers;
  }

  private static getVueTemplate() {
    return fs.readFileSync(path.join(__dirname, "vue.template.hbs"), "utf8");
  }

  // #endregion

  static async transpile(inputs: any[]) {
    const helpers = await WebScript.getHelpers();

    const context = {
      helpers,
      isAttributeName: (name: string) =>
        WebScript.isAttributeName(
          inputs.map((c) => c.name),
          name
        ),
      includeAttribute: (name: string) => {
        return true;
      },
      postProcessAttribute: (attr: any[]) => {
        attr = [...attr];
        attr[0] = attr[0].replace("on_", "@");
        return attr;
      },
      toTemplate: WebScript.toTemplate,
    };

    for (const helper of Object.entries(helpers)) {
      Handlebars.registerHelper(helper[0], (...args) =>
        eval(helper[1] as string)(context, ...args)
      );
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

      //console.log(vueComp);

      input.vueComp = vueComp;
    } catch (ex: any) {
      console.log(`Error: ${input.path}`.bgRed);
      console.log(ex.stack);
    }
  }

  private static toTemplate(
    context: any,
    dom: any,
    indent?: number,
    compName?: string
  ) {
    return toTemplate(context, dom, indent, compName);
  }

  private static isAttributeName(componentNames: string[], name: string) {
    if (name.startsWith(":")) return true;
    if (name.includes("#")) return false;
    if (name.startsWith("template")) return false;
    if (name == "slot") return false;
    if (
      [
        "a",
        "style",
        ...[1, 2, 3, 4, 5, 6].map((i) => `h${i}`),
        "pre",
        "p",
        "img",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "div",
        "span",
        "ul",
        "li",
        "input",
        "canvas",
        "textarea",
        "component",
      ].includes(name)
    )
      return false;
    if (name.startsWith(".")) return false;
    if (componentNames.find((c) => c == name.replace(":", ""))) return false;
    return true;
  }
}

export { WebScript };
