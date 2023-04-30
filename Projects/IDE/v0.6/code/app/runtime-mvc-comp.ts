// TODO: This needs to be refactored
// TODO: Nodes/NodePaths need to be standardized across the app, possible using jsonpath
// TODO: Strongly typed classes for app structure (Components, Links, etc)

import { Utility } from "~/code/util/utility";
import { PersistedTree, Node, NodePath } from "../persisted/persisted-tree";
const util = Utility;

declare global {
  interface Array<T> {
    stringifyIds(): string;
    toNodePath(tree: PersistedTree): NodePath;
  }

  interface String {
    toNodePathDescs(tree: PersistedTree): string[];
  }
}

Array.prototype.stringifyIds = function () {
  return this.map((item: any) => item._id).join(`.`);
};

Array.prototype.toNodePath = function (tree: PersistedTree) {
  return NodePath.fromNodes(tree, this);
};

String.prototype.toNodePathDescs = function (tree: PersistedTree): string[] {
  let nodes = this.split(`.`)
    .map((id) => parseInt(id))
    .map((id) => {
      return { id, desc: Utility.getNodeIconDesc(tree.getNode(id), tree) };
    })
    .map((item) => `${item.desc} (${item.id})`);
  return nodes;
};

// Maintains a list of node paths -> runtime mvc components
class RuntimeMvcComps {
  private byPaths: Map<string, RuntimeMvcComp[]> = new Map();
  private byCompIds: Map<number, string> = new Map();

  get compCount() {
    return this.byCompIds.size;
  }

  get(path: string) {
    return this.byPaths.get(path) || [];
  }

  add(path: string, comp: RuntimeMvcComp) {
    this.byPaths.set(path, [...(this.byPaths.get(path) || []), comp]);
    this.byCompIds.set(comp.uid, path);
  }

  delete(uid: number) {
    let path = this.byCompIds.get(uid);
    if (path) {
      this.byPaths.set(
        path,
        (this.byPaths.get(path) || []).filter((c) => c.uid != uid)
      );
      this.byCompIds.delete(uid);
    }
  }
}

// The switchboard will use this interface to communicate with the MVC runtime
class RuntimeMvcComp {
  public getVue: () => any;
  // The unique id of the component in the MVC runtime
  public uid: number;
  // The path to the application node in the context of our architecture
  public nodePath: any[];
  // The application node in the context of our architecture
  public node: any;

  constructor(vue: any) {
    this.getVue = () => vue;
    this.uid = vue._.uid;
    this.nodePath = vue.nodePath;
    this.node = vue.node;
  }

  static async fromVue(vue: any) {
    let mvcComp = new RuntimeMvcComp(vue);
    return mvcComp;
  }
}

export { RuntimeMvcComp, RuntimeMvcComps };
