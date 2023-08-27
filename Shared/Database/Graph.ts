import { Objects } from "../Extensions.Objects.Client";
import { Events } from "../Events";

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
  export type Node = {
    id: number;
    type: string;
    data: any;
  };

  export type Link = {
    id: number;
    from: number;
    to: number;
    type: string;
  };

  export class Database {
    // #region nextID
    // Property that maps to this.data.nextID
    get nextID() {
      return this.data.nextID as number;
    }
    set nextID(value: number) {
      this.data.nextID = value;
    }
    // #endregion

    get nodes() {
      return this.data.nodes as Node[];
    }

    get links() {
      return this.data.links as Link[];
    }

    events = new Events();

    // #region Constructor

    private constructor(private data: any) {}

    static async new(data: any) {
      return new Database(data);
    }

    // #endregion

    // #region Events
    private onNodesChange(nodes: Node[]) {
      this.events.emit("nodes.change", nodes);
    }
    // #endregion

    addNode(type: string, data: any, links: any[] = []) {
      data = data || ({} as any);

      let node = {
        id: this.getNextID(),
        type,
        data,
      };

      const types = type.split(".");
      const commonData = Objects.clone(
        this.data.schema[types[0]][types[1]]._all.data
      );
      Object.assign(node.data, commonData);
      let defaultData = this.data.schema[types[0]][types[1]];
      defaultData = defaultData[types[2]] ? defaultData[types[2]].data : {};
      defaultData = Objects.clone(defaultData);
      Object.assign(node.data, defaultData);

      const affectedNodes = [] as any[];

      for (const link of links) {
        if (link.from) {
          affectedNodes.push(this.getNode(link.from));
          link.to = node.id;
        } else {
          if (link.to) {
            affectedNodes.push(this.getNode(link.to));
            link.from = node.id;
          }
        }
      }

      this.nodes.push(node);
      this.links.push(...links);

      this.onNodesChange([node, ...affectedNodes]);

      return node;
    }

    updateNodeField(node: Node, field: string, value: any) {
      node = this.getNode(node.id) || node;
      Objects.deepSet((node as any).data, field, value);
      this.onNodesChange([node]);
    }

    replaceNode(oldNode: Node, newNode: Node) {
      const node = this.getNode(oldNode.id);
      if (!node) throw new Error(`Node not found: ${oldNode.id}`);
      this.replaceNodeLinks(oldNode, newNode);
      Object.assign(node, newNode);
      this.onNodesChange([node]);
      return node;
    }

    private replaceNodeLinks(oldNode: Node, newNode: Node) {
      const oldLinks = this.getNodeLinks(oldNode);
      for (const link of oldLinks) {
        this.replaceLinkNode(link, oldNode, newNode);
      }
    }

    private replaceLinkNode(link: Link, oldNode: Node, newNode: Node) {
      if (link.from == oldNode.id) link.from = newNode.id;
      if (link.to == oldNode.id) link.to = newNode.id;
    }

    addLink(from: Node, type: string, to: Node) {
      const link = {
        id: this.getNextID(),
        from: from.id,
        to: to.id,
        type,
      };

      this.links.push(link);

      const affectedNodes = [from, to].map((n) => this.getNode(n.id)) as any[];
      this.onNodesChange(affectedNodes);

      return link;
    }

    addChildNode(parent: Node, typeOrNode: string | Node, data: any) {
      const child =
        typeof typeOrNode == "object"
          ? (typeOrNode as Node)
          : this.addNode(typeOrNode, data);
      this.addLink(child, "child.of", parent);
      return child;
    }

    addChildNodes(
      parent: Node,
      typeOrNode: string | Node,
      data: any,
      count: number
    ) {
      for (let i = 0; i < count; i++) {
        this.addChildNode(parent, typeOrNode, data);
      }
    }

    getNodes(a: string | Node, b: string | Node) {
      const fromOrTo = this.fromOrTo(a, b);
      const oppFromOrTo = this.getOppositeFromOrTo(fromOrTo);
      const links = this.getLinks(a, b);
      const nodes = links.map((l: any) => this.getNode(l[oppFromOrTo]));
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
      const node = this.nodes.find((n) => n.id == id);
      return node;
    }

    private getNodeLinks(node: Node) {
      const links = this.links.filter(
        (l) => l.from == node.id || l.to == node.id
      );
      return links;
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

    private getNextID() {
      return this.nextID++;
    }
  }
}

export { Graph };
