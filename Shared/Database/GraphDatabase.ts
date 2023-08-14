const findArg = (condition: Function | string, ...args: any[]) => {
  if (typeof condition == "string") {
    const type = condition;
    condition = (arg: any) => typeof arg == type;
  }
  const predicate = condition as Function;
  const arg = args.find((a) => predicate(a));
  return arg;
};

namespace Graph {
  type Node = {
    id: Number;
    type: String;
  };

  type Link = {
    id: Number;
    from: Number;
    to: Number;
    type: String;
  };

  export class Database {
    private nodes: Node[];
    private links: Link[];

    // #region nextID
    // Property that maps to this.data.nextID
    get nextID() {
      return this.data.nextID as Number;
    }
    set nextID(value: Number) {
      this.data.nextID = value;
    }
    // #endregion

    // #region Constructor

    private constructor(private data: any) {
      this.nodes = data.nodes as Node[];
      this.links = data.links as Link[];

      const Vue = (window as any)?.Vue as any;

      if (Vue) {
        for (const node of this.nodes) {
          if ("value" in node) {
            Vue.watch(
              () => node.value,
              (value: any) => this.onNodeChange(node, "value", value)
            );
          }
        }
      }
    }

    static async new(data: any) {
      return new Database(data);
    }

    // #endregion

    onNodeChange(node: Node, key: string, value: any) {
      const targetNodes = this.getNodes(node, "data.bind") as any[];
      for (const targetNode of targetNodes) {
        targetNode[key] = value;
      }
    }

    getAllNodes() {
      return [...this.nodes];
    }

    getNodes(a: string | Node, b: string | Node) {
      const fromOrTo = this.fromOrTo(a, b);
      const oppFromOrTo = this.getOppositeFromOrTo(fromOrTo);
      const links = this.getLinks(a, b);
      const nodes = links.map((l) => this.getNode(l[oppFromOrTo]));
      return nodes;
    }

    private getLinks(a: string | Node, b: string | Node) {
      const fromOrTo = this.fromOrTo(a, b);
      const type = findArg("string", a, b);
      const node = findArg("object", a, b);
      if (!node) return [];
      const links = this.links.filter(
        (l) => l.type == type && l[fromOrTo] == node.id
      );
      return links;
    }

    private getNode(id: Number) {
      if (!id) return null;
      const node = this.nodes.find((n) => n.id == id);
      return node;
    }

    private fromOrTo(a: string | Node, b: string | Node) {
      if (typeof a !== "string") {
        return "from";
      } else {
        return "to";
      }
    }

    private getOppositeFromOrTo(fromOrTo: string) {
      if (fromOrTo == "from") {
        return "to";
      } else {
        return "from";
      }
    }

    private getTypeArg(a: string | Node, b: string | Node) {
      if (typeof a !== "string") {
        return a.type;
      } else {
        return b;
      }
    }
  }
}

const GraphDatabase = Graph.Database;

export { GraphDatabase };
