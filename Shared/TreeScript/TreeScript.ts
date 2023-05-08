import * as yaml from "js-yaml";
import "../Extensions";
import { Configuration } from "../Configuration";

enum NodeType {
  CodeBlock,
  CodeTemplate,
}

interface TreeScriptSource {
  data: any;
  templates: any;
}

interface CodeTemplate {
  name: string;
  template: string;
}

class TreeScript {
  public source: TreeScriptSource;
  public yaml: string;

  private static handlebarsOptions = {
    // Prevents handlebars from escaping HTML
    noEscape: true,
  };

  private constructor(source: string, private config: any) {
    this.source = yaml.load(source) as TreeScriptSource;
    this.yaml = yaml.dump(this.source);
  }

  static new(source: string, config: any) {
    return new TreeScript(source, config);
  }

  compile() {
    const handlebars = require("handlebars");
    // Register the code templates (helpers)
    Object.entries(this.source.templates).forEach((entry) => {
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
      this.source.templates.main,
      TreeScript.handlebarsOptions
    )(this.source.data);
    return output;
    //return this.compileNode(this.source).join("\n");
  }

  private compileNode(handlebars: any, node: any) {
    if (node.is(Array))
      return node.map((item: any) => this.compileNode(handlebars, item));
    // Detect the node type
    const nodeType = this.getNodeType(node);
    switch (nodeType) {
      case NodeType.CodeTemplate:
        return this.compileCodeTemplate(handlebars, node);
    }
  }

  private compileCodeTemplate(handlebars: any, node: any) {
    const nodeKey = Object.keys(node)[0];
    const nodeValue = node[nodeKey];
    const codeTemplate = this.getCodeTemplate(node);
    if (!codeTemplate) return null;
    console.log(nodeValue);
    return handlebars.compile(codeTemplate.template)(nodeValue);
  }

  private getNodeType(node: any) {
    // Check config.code-templates for a match
    const codeTemplate = this.getCodeTemplate(node);
    if (codeTemplate) return NodeType.CodeTemplate;
    throw new Error(`Unknown node type: ${Object.keys(node)[0]}`);
  }

  private getCodeTemplate(node: any) {
    const nodeKey = Object.keys(node)[0];
    const codeTemplates = Object.entries(this.config["code-templates"]);
    const codeTemplate = codeTemplates.find(
      ([key, value]) => key === nodeKey
    )?.[1];
    if (!codeTemplate) return null;
    return { name: nodeKey, template: codeTemplate } as CodeTemplate;
  }

  private parse(source: string) {
    let tree = yaml.load(source) as any;
    // Traverse the tree, if any value is a TreeScript (compilable YAML), compile it.
    tree.traverse((node: any, key: string, value: any) => {
      if (!value) return;
      if (value.is(Array)) {
        node[key] = value.map((item: any) =>
          TreeScript.tryParse(item, this.config)
        );
      }
      if (value.is(String)) {
        try {
          // Compile the sub TreeScript branch
          const branch = yaml.load(value) as any;
          // If the YAML compiled branch is still a string, it's not a TreeScript.
          if (branch.is(String)) return;
          // Replace the string with the compiled branch.
          node[key] = new TreeScript(value, this.config).source;
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

  private static tryParse(value: any, config: Configuration) {
    if (!value?.is(String)) return value;
    try {
      return new TreeScript(value, config).source;
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
