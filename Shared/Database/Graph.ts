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
      for (const node of nodes) {
        this.events.emit("node.change", node);
      }
    }
    // #endregion

    addTemplate(name: string) {
      const template = this.data.templates[name];
      const node = this.addNode(template.type, template.data);
      for (const child of template.children) {
        this.addChildNode(node, child.type, child.data, child.children);
      }
      return node;
    }

    addNode(type: string, data: any, links: any[] = []) {
      data = JSON.parse(JSON.stringify(data || {}));

      const newData = {} as any;

      const types = type.split(".");
      const commonData = Objects.clone(
        this.data.schema[types[0]][types[1]]._all.data
      );
      Object.assign(newData, commonData);
      let defaultData = this.data.schema[types[0]][types[1]];
      defaultData = defaultData[types[2]] ? defaultData[types[2]].data : {};
      defaultData = Objects.clone(defaultData);
      Object.assign(newData, defaultData);

      Object.assign(newData, data);

      let node = {
        id: this.getNextID(),
        type,
        data: newData,
      };

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

      let defaultChildren = this.data.schema[types[0]][types[1]];
      defaultChildren = defaultChildren[types[2]]
        ? defaultChildren[types[2]].children || []
        : [];
      for (const child of defaultChildren) {
        const childNode = this.addChildNode(
          node,
          child.type,
          child.data,
          child.children
        );
      }

      return node;
    }

    updateNodeField(node: Node, field: string, value: any) {
      node = this.getNode(node.id) || node;
      Objects.deepSet((node as any).data, field, value);
      this.onNodesChange([node]);
    }

    replaceNode(oldNode: Node, newNode: Node) {
      this.replaceNodeLinks(oldNode, newNode);
      this.deleteNode(oldNode);
      this.onNodesChange([newNode]);
      return newNode;
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

    addChildNode(
      parent: Node,
      typeOrNode: string | Node,
      data: any,
      children: any[] = []
    ) {
      const child =
        typeof typeOrNode == "object"
          ? (typeOrNode as Node)
          : this.addNode(typeOrNode, data);

      this.addLink(child, "child.of", parent);

      for (const subChild of children) {
        this.addChildNode(
          child,
          subChild.type,
          subChild.data,
          subChild.children
        );
      }

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

    getLinkedNodes(node: Node) {
      if (!node) return [];

      const links = this.links.filter(
        (l) => l.from == node.id || l.to == node.id
      );

      const nodeIds = links.flatMap((l) => [l.from, l.to]).except(node.id);

      const nodes = nodeIds.map((id) => this.getNode(id));

      return nodes;
    }

    getLinkedNodes2(linkType: string, fromOrTo: string, node: Node) {
      const links = this.links.filter(
        (l: any) => l.type == linkType && l[fromOrTo] == node.id
      );
      const nodes = links.map((l) =>
        this.getNode(l[this.getOppositeFromOrTo(fromOrTo)])
      );
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

    getNode(idOrPath: Number | string, fromNode?: Node) {
      if (typeof idOrPath == "number") {
        const id = idOrPath as number;
        const node = this.nodes.find((n) => n.id == id);
        return node;
      } else {
        const path = idOrPath as string;
        const paths = path.split(".");
        const findPathPart = (parent: Node | null, part: string) => {
          const children = !parent
            ? [...this.nodes]
            : this.getLinkedNodes2("child.of", "to", parent);
          const child = part.startsWith("[")
            ? children[0]
            : children.find(
                (c: any) => c.data.name?.value == part || c.type == part
              );
          return child || null;
        };
        let node = fromNode as unknown as Node | null;
        for (const pathPart of paths) {
          node = findPathPart(node, pathPart);
        }
        return node;
      }
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

    deleteNode(node: Node) {
      this.deleteLinks(this.getNodeLinks(node));
      this.nodes.removeBy((n) => n.id == node.id);
    }

    deleteLinks(links: Link[]) {
      for (const link of links) {
        this.links.removeBy((l) => l.id == link.id);
      }
    }

    private getNextID() {
      return this.nextID++;
    }
  }
}

export { Graph };
