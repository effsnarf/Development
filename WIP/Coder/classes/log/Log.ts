import "@shared/Extensions";
import colors from "colors";
import jsyaml from "js-yaml";
import { StringBuilder } from "@shared/StringBuilder";

type LogItem = {
  parent?: LogItem;
  type?: string;
  name?: string;
  args?: any[];
  code?: string;
  value?: any;
  subs?: LogItem[];
};

class Log {
  root: LogItem;
  currentNode: LogItem;

  constructor() {
    this.root = {
      type: "root",
      subs: [],
    };
    this.currentNode = this.root;
  }

  private traverse(node: any, callback: (node: any) => void): void {
    callback(node);

    const children = node.subs;

    if (children) {
      for (const child of children) {
        this.traverse(child, callback);
      }
    }
  }

  stringifyYaml() {
    return jsyaml.dump(this.root);
  }

  stringify() {
    return this.stringifyNode(this.root).join("\n");
  }

  stringifyNode(node: LogItem, indentation: number = 0) {
    const sb = new StringBuilder(indentation);

    sb.addLines(this.stringifyItem(sb, node));
    sb.indent();
    for (let sub of node.subs || [])
      sb.addLines(this.stringifyNode(sub, sb.indentation));
    // for (let sub of (node.subs || []).filter((s) => s.type == "expression"))
    //   sb.addLines(this.stringifyNode(sub, sb.indentation));
    // for (let sub of (node.subs || []).filter((s) => s.type == "statement"))
    //   sb.addLines(this.stringifyNode(sub, sb.indentation));
    // for (let sub of (node.subs || []).filter((s) => s.type == "method"))
    //   sb.addLines(this.stringifyNode(sub, sb.indentation));
    sb.unindent();
    return sb.getLines();
  }

  private stringifyItem(sb: StringBuilder, item: LogItem) {
    if (item.type === "root") return [colors.gray("root")];

    if (item.type === "method") {
      const args = item.args?.map((arg) => JSON.stringify(arg)).join(", ");
      return [
        `${colors.green(item.name || "")}(${args}) ${colors.gray(
          "returned"
        )} ${colors.black(colors.bgGreen(JSON.stringify(item.value)))}`,
      ];
    }

    if (item.type === "statement") {
      if (!item.code) throw new Error("statement without code");
      return (
        item.code
          ?.split("\n")
          //.slice(0, 2)
          .map((s) => colors.gray(s))
      );
    }

    if (item.type === "expression") {
      return [
        `${colors.cyan(item.code || "")} ${"->".gray} ${colors.black(
          colors.bgCyan(JSON.stringify(item.value))
        )}`,
      ];
    }

    return [`type: ${item.type} (stringify not implemented)`];
  }

  method = {
    entered: (name: string, args: any[]) => {
      //console.log("enter", name, args);
      return this.add("method", { name, args }, true);
    },
    returned: (name: string, returnValue: any) => {
      //console.log("return", name, returnValue);
      this.currentNode.value = returnValue;
    },
    exited: (name: string) => {
      //console.log("exit", name);
      this.go.up();
    },
  };

  statement = {
    before: (code: string) => {
      return this.add("statement", { code } as LogItem, true);
    },
    after: (code: string) => {
      this.go.up();
    },
  };

  expression = (code: string, value: any) => {
    this.add("expression", { code, value } as LogItem);
    return value;
  };

  private add(type: string, item: LogItem, goIn: boolean = false) {
    item.type = type;
    item.parent = this.currentNode;
    item.subs = item.subs || [];

    if (!this.currentNode.subs) this.currentNode.subs = [];
    this.currentNode.subs.push(item);

    if (goIn) this.currentNode = item;

    return item;
  }

  go = {
    up: () => {
      if (!this.currentNode.parent) throw new Error("Can't go up from root.");
      this.currentNode = this.currentNode.parent;
    },
    to: (node: LogItem) => {
      this.currentNode = node;
    },
  };
}

export { Log };
