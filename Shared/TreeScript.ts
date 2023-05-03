import "./Extensions";
import * as yaml from "js-yaml";

class TreeScript {
  public tree: any;
  public yaml: string;

  private constructor(private source: string) {
    this.tree = this.compile(source);
    this.yaml = yaml.dump(this.tree);
  }

  static new(source: string) {
    return new TreeScript(source);
  }

  private compile(source: string) {
    let tree = yaml.load(source) as any;
    // Traverse the tree, if any value is a TreeScript (compilable YAML), compile it.
    tree.traverse((node: any, key: string, value: any) => {
      if (!value) return;
      if (value.is(String)) {
        try {
          // Compile the sub TreeScript branch
          const branch = yaml.load(value) as any;
          // If the YAML compiled branch is still a string, it's not a TreeScript.
          if (branch.is(String)) return;
          // Replace the string with the compiled branch.
          node[key] = new TreeScript(value).tree;
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
}

export { TreeScript };
