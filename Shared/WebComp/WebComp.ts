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
          console.log(`${outputPath.green} ${` saved`.gray}`);
          fs.writeFileSync(outputPath, template);
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

      return comp;
    },
  };
}

export { WebComp };
