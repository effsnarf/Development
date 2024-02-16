import path from "path";
import fs from "fs";
import pug from "pug";
const jsyaml = require("js-yaml");
const Handlebars = require("Handlebars");

class WebComp {
  /// Converts a web component script to React JSX
  /// @param webCompScript - The web component script to convert (either file path or yaml string or object)
  static to = {
    react: {
      jsx: (comp: any, outputPath?: string) => {
        comp = WebComp.load.comp(comp);

        const reactTemplate = fs.readFileSync(
          path.join(__dirname, "./Templates/React/jsx.handlebars"),
          "utf8"
        );
        const template = Handlebars.compile(reactTemplate)(comp);

        if (outputPath?.length) {
          outputPath = path.join(outputPath, `${comp.name}.jsx`);
          fs.writeFileSync(outputPath, template);
          console.log(`${outputPath.green} ${` saved`.gray}`);
          const cssPath = path.join(outputPath, `../${comp.name}.css`);
          if (!fs.existsSync(cssPath)) {
            fs.writeFileSync(cssPath, comp.css || "");
            console.log(`${cssPath.green} ${` saved`.gray}`);
          }
        }

        return template;
      },
    },
  };

  static load = {
    comp: (comp: any) => {
      let name = "";

      // if webCompScript is a file path, read the file
      if (fs.existsSync(comp)) {
        const filePath = comp;
        const fileName = path.basename(filePath);
        name = fileName.split(".")[0];
        comp = fs.readFileSync(filePath, "utf8");
      }
      // if webCompScript is a string, parse it (yaml)
      if (typeof comp === "string") {
        comp = jsyaml.load(comp);
      }

      if (!comp.name?.length) comp.name = name;

      comp.html = pug.render(comp.dom);

      const referencedComponents = comp.html
        .match(/<([A-Z][a-zA-Z0-9]*)/g)
        ?.map((c: string) => c.replace("<", ""));

      comp.imports = referencedComponents?.map(
        (c: string) => `import ${c} from './${c}';`
      );

      comp.imports = comp.imports?.join("\n");

      return comp;
    },
  };
}

export { WebComp };
