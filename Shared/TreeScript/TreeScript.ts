import * as yaml from "js-yaml";
import "../Extensions";
import { Configuration } from "../Configuration";
import Handlebars from "handlebars";

enum NodeType {
  CodeBlock,
  CodeTemplate,
}

interface CodeTemplate {
  name: string;
  template: string;
}

class TreeScript {
  public tree: any;
  public yaml: string;

  private constructor(private source: string, private config: any) {
    this.tree = this.parse(source);
    this.yaml = yaml.dump(this.tree);
  }

  static new(source: string, config: any) {
    return new TreeScript(source, config);
  }

  compile() {
    return this.compileNode(this.tree).join("\n");
  }

  private compileNode(node: any) {
    if (node.is(Array)) return node.map((item: any) => this.compileNode(item));
    // Detect the node type
    const nodeType = this.getNodeType(node);
    switch (nodeType) {
      case NodeType.CodeTemplate:
        return this.compileCodeTemplate(node);
    }
  }

  private compileCodeTemplate(node: any) {
    const nodeKey = Object.keys(node)[0];
    const nodeValue = node[nodeKey];
    const codeTemplate = this.getCodeTemplate(node);
    if (!codeTemplate) return null;
    console.log(nodeValue);
    return Handlebars.compile(codeTemplate.template)(nodeValue);
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
          node[key] = new TreeScript(value, this.config).tree;
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
      return new TreeScript(value, config).tree;
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
