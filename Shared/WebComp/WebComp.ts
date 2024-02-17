import path from "path";
import fs from "fs";
import pug from "pug";
const jsyaml = require("js-yaml");
const Handlebars = require("Handlebars");

class WebComp {
  /// Converts a web component script to React JSX
  /// @param webCompScript - The web component script to convert (either file path or yaml string or object)
  static to = {
    jsx: (comp: any, outputPath?: string) => {
      comp = WebComp.load.comp(comp);

      const reactTemplate = fs.readFileSync(
        path.join(__dirname, "./Templates/React/jsx.handlebars"),
        "utf8"
      );
      const template = Handlebars.compile(reactTemplate)(comp);

      const now = new Date().toLocaleTimeString();

      if (outputPath?.length) {
        outputPath = path.join(outputPath, `${comp.name}.jsx`);
        fs.writeFileSync(outputPath, template);
        console.log(`${now.gray} ${`modified`.gray} ${outputPath.green}`);
        const cssPath = path.join(outputPath, `../${comp.name}.css`);
        if (!fs.existsSync(cssPath)) {
          fs.writeFileSync(cssPath, comp.css || "");
          console.log(`${now.gray} ${`modified`.gray} ${cssPath.green}`);
        }
      }

      return template;
    },
  };

  static load = {
    comp: (comp: any) => {
      if (typeof comp === "object") return comp;

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

      //console.log(comp.name?.yellow);
      //console.log(comp);

      comp.html = pug.render(comp.dom);
      comp.props = Object.keys(comp.props || {});

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

  static transpile = (filePath: string, outputPath: string) => {
    const comp = WebComp.load.comp(filePath);
    const type = this.getFileType(filePath);
    (WebComp.to as any)[type](comp, outputPath);
  };

  static getFileType = (filePath: string) => {
    const parts = filePath.split(".");
    return parts[parts.length - 2] as string;
  };
}

export { WebComp };
