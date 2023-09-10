import { Objects } from "../Extensions.Objects.Client";
import { Events } from "../Events";
import { Diff } from "../Diff";
import { Data } from "../Data";
import { Actionable } from "../Actionable";

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
    data: any;
  };

  interface IDatabase {
    nextID: number;
    nodes: Node[];
    links: Link[];
    events: Events;

    addTemplate(name: string): Promise<Node>;
    addNode(type: string, data: any, links?: any[]): Node;
    updateNodeField(node: Node, field: string, value: any): void;
    replaceNode(oldNode: Node, newNode: Node): Node;
    addLink(from: Node, type: string, to: Node, data?: any): Link;
    addChildNode(
      parent: Node,
      typeOrNode: string | Node,
      data: any,
      children?: any[]
    ): Node;
    addChildNodes(
      parent: Node,
      typeOrNode: string | Node,
      data: any,
      count: number
    ): void;
    getNodes(a: string | Node | number[], b: string | Node): Node[];
    getLinkedNodes(node: Node, linkFilter?: (link: Link) => boolean): Node[];
    getLinkedNodes2(linkType: string, fromOrTo: string, node: Node): Node[];
    getLinks(a: string | Node, b: string | Node): Link[];
    getNode(idOrPath: Number | string, fromNode?: Node): Node | null;
    getNodeLinks(node: Node): Link[];
    deleteNode(node: Node): void;
    deleteLinks(links: Link[]): void;
  }

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

    protected constructor(protected data: any) {}

    static async new(data: any = { nextID: 1, nodes: [], links: [] }) {
      return new Database(data);
    }

    // #endregion

    // #region Events
    protected onNodesChange(nodes: Node[]) {
      if (!nodes?.length) {
        this.events.emit("node.change", null);
        return;
      }

      for (const node of nodes) {
        this.events.emit("node.change", node);
      }
    }
    // #endregion

    async addTemplate(name: string) {
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
      if (this.data.schema) {
        const typeSchema = this.data.schema[types[0]][types[1]];
        const commonData = Objects.clone((typeSchema?._all?.data || {}) as any);
        Object.assign(newData, commonData);
        let defaultData = (this.data.schema[types[0]][types[1]] || {}) as any;
        defaultData = defaultData[types[2]] ? defaultData[types[2]].data : {};
        defaultData = Objects.clone(defaultData);
        Object.assign(newData, defaultData);
      }

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

      if (this.data.schema) {
        let defaultChildren = (this.data.schema[types[0]][types[1]] ||
          {}) as any;
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

    addLink(from: Node, type: string, to: Node, data: any = {}) {
      const link = {
        id: this.getNextID(),
        from: from.id,
        to: to.id,
        type,
        data,
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

    getNodes(a: string | Node | number[], b: string | Node) {
      if (Array.isArray(a)) {
        const ids = a as number[];
        const nodes = ids.map((id) => this.getNode(id));
        return nodes;
      }
      const fromOrTo = this.fromOrTo(a, b);
      const oppFromOrTo = this.getOppositeFromOrTo(fromOrTo);
      const links = this.getLinks(a, b);
      const nodes = links.map((l: any) => this.getNode(l[oppFromOrTo]));
      return nodes;
    }

    getLinkedNodes(
      node: Node,
      linkFilter: (link: Link) => boolean = (link) => true
    ): Node[] {
      if (!node) return [];

      const links = this.links
        .filter((l) => l.from == node.id || l.to == node.id)
        .filter(linkFilter);

      const nodeIds = links.flatMap((l) => [l.from, l.to]).except(node.id);

      const nodes = nodeIds
        .map((id) => this.getNode(id))
        .filter((n) => n != null);

      return nodes as Node[];
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

    getLinks(a: string | Node, b: string | Node) {
      if (typeof a == "object" && typeof b == "object") {
        const links = this.links.filter(
          (link) => this.linkIncludes(link, a) && this.linkIncludes(link, b)
        );
        return links;
      }
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

    getNodeLinks(node: Node) {
      if (!node) return [];
      const links = this.links.filter(
        (l) => l.from == node.id || l.to == node.id
      );
      return links;
    }

    linkIncludes(link: Link, node: Node) {
      if (!link || !node) return false;
      return link.from == node.id || link.to == node.id;
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
      const affectedNodes = this.getLinkedNodes(node);
      this.deleteLinks(this.getNodeLinks(node));
      this.nodes.removeBy((n) => n.id == node.id);
      this.onNodesChange(affectedNodes);
    }

    deleteLinks(links: Link[]) {
      const affectedNodes = links
        .flatMap((l) => [this.getNode(l.from), this.getNode(l.to)])
        .filter((l) => l)
        .distinct((l) => l?.id)
        .map((l) => l as Node);

      for (const link of links) {
        this.links.removeBy((l) => l.id == link.id);
      }

      this.onNodesChange(affectedNodes);
    }

    private getNextID() {
      return this.nextID++;
    }
  }

  export class ActionableDatabase extends Graph.Database {
    actionStack!: Actionable.ActionStack;
    private addNewActions = false;

    private constructor(actionStack: Actionable.ActionStack, data: any) {
      super(data);
      this.actionStack = actionStack;
      this.actionStack.executeAction = this.executeAction.bind(this);
    }

    static async new(data: any): Promise<ActionableDatabase> {
      throw new Error("Use new2 to create an ActionableDatabase");
    }

    static async new2(
      persister: Data.Persister.Base,
      varName: string,
      data: any
    ) {
      const actionStack = await Actionable.ActionStack.new(persister, varName);
      const gdb = new ActionableDatabase(actionStack, data);
      return gdb;
    }

    async addTemplate(name: string) {
      const redo = {
        method: "add.template",
        args: [name],
      };

      const oldData = Objects.clone(this.data);

      this.addNewActions = false;

      const node = await super.addTemplate(name);

      this.addNewActions = true;

      const newData = Objects.clone(this.data);

      const undoDataChanges = Diff.getChanges(newData, oldData);

      const undo = {
        method: "apply.data.changes",
        args: [undoDataChanges],
      };

      const action = { redo, undo } as Actionable.Action;

      this.addAction(action);

      return node;
    }

    addNode(type: string, data: any, links?: any[]) {
      const redo = {
        method: "add.node",
        args: [type, data, links],
      };

      const node = super.addNode(type, data, links);

      const undo = {
        method: "delete.node",
        args: [node],
      };

      const action = { redo, undo } as Actionable.Action;

      this.addAction(action);

      return node;
    }

    addLink(from: Node, type: string, to: Node, data?: any) {
      const redo = {
        method: "add.link",
        args: [from, type, to, data],
      };

      const link = super.addLink(from, type, to, data);

      const undo = {
        method: "delete.links",
        args: [[link]],
      };

      const action = { redo, undo } as Actionable.Action;

      this.addAction(action);

      return link;
    }

    replaceNode(oldNode: Node, newNode: Node) {
      const redo = {
        method: "replace.node",
        args: [oldNode, newNode],
      };

      const oldData = Objects.clone(this.data);

      const result = super.replaceNode(oldNode, newNode);

      const newData = Objects.clone(this.data);
      const dataChanges = Diff.getChanges(oldData, newData);

      const undo = {
        method: "apply.data.changes",
        args: [dataChanges],
      };

      const action = { redo, undo } as Actionable.Action;

      this.addAction(action);

      return result;
    }

    async clear() {
      this.actionStack.clear();

      this.nextID = 1;
      this.nodes.clear();
      this.links.clear();
    }

    private async executeAction(action: Actionable.Action) {
      this.addNewActions = false;
      try {
        const redo = action.redo as any;
        const method = this.toMethodName(redo.method);
        const args = redo.args;
        const result = await (this as any)[method](...args);
        return result;
      } finally {
        this.addNewActions = true;
      }
    }

    private async goToAction(pointer: number) {
      await this.actionStack.goToAction(pointer);
    }

    private addAction(action: Actionable.Action) {
      if (!this.addNewActions) return;
      this.actionStack.add(action);
    }

    private async applyDataChanges(dataChanges: any) {
      const oldData = Objects.clone(this.data);
      const newData = Diff.applyChanges(oldData, dataChanges);
      this.data = newData;
      const changedNodes = this.nodes.filter((newNode) => {
        const oldNode = oldData.nodes.find((on: any) => on.id == newNode.id);
        return !Objects.areEqual(oldNode, newNode);
      });
      this.onNodesChange(changedNodes);
    }

    private toMethodName(method: string) {
      const parts = method
        .split(".")
        .map((p) => p[0].toUpperCase() + p.substring(1));
      parts[0] = parts[0].toLowerCase();
      return parts.join("");
    }
  }
}

export { Graph };
