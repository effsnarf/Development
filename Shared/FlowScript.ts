const Handlebars = require("handlebars");
import { Objects } from "./Extensions.Objects";
import { WebScript } from "./WebScript/WebScript";

class FlowScript {
  private source: any;

  constructor(source: any) {
    this.source = source;
    this.registerHelpers();
  }

  private registerHelpers() {
    Handlebars.registerHelper("vueOptions", (name: string, source: any) => {
      const input = { name, source };
      const inputs = JSON.parse(JSON.stringify([input]));
      WebScript.transpile(inputs);
      const vueComp = inputs[0].vueComp;
      // Take everything between <script> and </script>
      const script = vueComp.match(/<script>([\s\S]*)<\/script>/m)[1];
      // Remove export default
      const script2 = script.replace("export default ", "");
      const vueOptions = Objects.eval(`(${script2})`);
      // Take everything between <template lang="pug"> and </template>
      const pugTemplate = vueComp.match(
        /<template lang="pug">([\s\S]*)<\/template>/m
      )[1];
      const html = Objects.pugToHtml(pugTemplate);
      vueOptions.template = html;
      return JSON.stringify(vueOptions, null, 2);
    });
    for (const [helperName, helperCode] of Object.entries(
      this.source.helpers
    )) {
      const code = helperCode as string; // Type assertion

      if (code.includes("{{")) {
        // Register Handlebars helpers directly
        const template = Handlebars.compile(code);
        Handlebars.registerHelper(
          helperName,
          function (argNames: string | string[], ...args: any[]) {
            if (typeof argNames === "string")
              argNames = argNames.split(",").map((s) => s.trim());
            const argsObj: any = {};
            for (let i = 0; i < argNames.length; i++) {
              argsObj[argNames[i]] = args[i];
            }
            return template(argsObj);
          }
        );
      } else {
        // Register TypeScript helpers using new Function
        try {
          const func = eval(`(${code})`);
          Handlebars.registerHelper(helperName, func);
        } catch (ex: any) {
          throw new Error(
            `Error registering helper ${helperName}: ${ex.message}`
          );
        }
      }
    }
  }

  public transpile(): string {
    const template = Handlebars.compile(this.source.transpile);
    return template({ schema: this.source.schema });
  }
}

export { FlowScript };
