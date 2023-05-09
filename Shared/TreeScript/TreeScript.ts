import * as yaml from "js-yaml";
import "../Extensions";
import { Configuration } from "../Configuration";

enum NodeType {
  CodeBlock,
}

interface TreeScriptSource {
  data: any;
  templates: any;
}

class TreeScript {
  source: TreeScriptSource;
  yaml: string;
  output: string;

  private static handlebarsOptions = {
    // Prevents handlebars from escaping HTML
    noEscape: true,
  };

  private constructor(source: string) {
    this.source = yaml.load(source) as TreeScriptSource;
    this.yaml = yaml.dump(this.source);
    this.output = TreeScript.compile(this.source);
  }

  static new(source: string) {
    return new TreeScript(source);
  }

  private static compile(source: TreeScriptSource) {
    const handlebars = require("handlebars");
    // Register the templates as helpers
    Object.entries(source.templates).forEach((entry) => {
      const templateName = entry[0];
      const code = entry[1] as any;
      if (code.is(String)) {
        handlebars.registerHelper(templateName, (context: any) => {
          return handlebars.compile(
            code,
            TreeScript.handlebarsOptions
          )(context);
        });
        return;
      }
      if (code.args)
        handlebars.registerHelper(templateName, (...argValues: any[]) => {
          const args = {} as any;
          code.args.forEach((argName: string, index: number) => {
            args[argName] = argValues[index];
          });
          //console.log(args);
          return handlebars.compile(
            code.code,
            TreeScript.handlebarsOptions
          )(args) as string;
        });
    });

    const output = handlebars.compile(
      source.templates.main,
      TreeScript.handlebarsOptions
    )(source.data);
    return output;
  }

  private parse(source: string) {
    let tree = yaml.load(source) as any;
    // Traverse the tree, if any value is a TreeScript (compilable YAML), compile it.
    tree.traverse((node: any, key: string, value: any) => {
      if (!value) return;
      if (value.is(Array)) {
        node[key] = value.map((item: any) => TreeScript.tryParse(item));
      }
      if (value.is(String)) {
        try {
          // Compile the sub TreeScript branch
          const branch = yaml.load(value) as any;
          // If the YAML compiled branch is still a string, it's not a TreeScript.
          if (branch.is(String)) return;
          // Replace the string with the compiled branch.
          node[key] = new TreeScript(value).source;
        } catch (ex) {
          if (ex instanceof yaml.YAMLException) {
            // Ignore this error, it's probably not a TreeScript.
          } else {
            throw ex;
          }
        }
      }
    });
    return tree;
  }

  private static tryParse(value: any) {
    if (!value?.is(String)) return value;
    try {
      return new TreeScript(value).source;
    } catch (ex) {
      if (ex instanceof yaml.YAMLException) {
        // Ignore this error, it's probably not a TreeScript.
      } else {
        throw ex;
      }
    }
  }
}

export { TreeScript };
