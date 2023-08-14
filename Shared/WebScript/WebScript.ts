import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { Objects } from "../Extensions.Objects";
import toTemplate from "./to.template";
import isAttributeName from "../../Shared/WebScript/is.attribute.name";

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

  // #endregion

  static transpile(inputs: any[]) {
    const helpers = WebScript.getHelpers();

    const context = {
      helpers,
      isAttributeName: (name: string) =>
        WebScript.isAttributeName(
          inputs.map((c) => c.name),
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
    return isAttributeName(componentNames, name);
  }
}

export { WebScript };
