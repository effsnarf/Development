// Encapsulates the app source tree, exposes its structure in a usable manner
// (getLinks, getPages, getComponents, etc).

import { Logger } from "~/code/util/logger";
import { Utility } from "~/code/util/utility";
import { NodePath, Node } from "~/code/persisted/persisted-tree";
import { PersistedTree } from "~/code/persisted/persisted-tree";
import { AppTreeNodeTypeChecker } from "./app-tree-node-type-checker";

class AppSource {
  private structCacheDt: number = 0;
  private struct: any;

  private is: AppTreeNodeTypeChecker = new AppTreeNodeTypeChecker();

  public tree: PersistedTree;

  constructor(tree: PersistedTree) {
    this.tree = tree;
  }

  static async construct(tree: PersistedTree) {
    let appSource = new AppSource(tree);
    return appSource;
  }

  // TODO: WARNING: Slow. Once AppSource is refactored, links will update in realtime as the source tree changes.
  get links() {
    return this.getStruct().links;
  }

  // TODO: WARNING: Slow
  get methods() {
    return this.getStruct().methods;
  }

  // TODO: WARNING: Slow
  get methodArgs() {
    return this.getStruct().methodArgs;
  }

  getNodeInfo(nodeID: number) {
    let node = this.tree.getNode(nodeID) as Node;

    return {
      _id: nodeID,
      icon: Utility.getNodeIcon(node.type),
      desc: Utility.getNodeDesc(this.tree, node),
    };
  }

  private getStruct() {
    // TODO: WARNING: Cache
    if (Date.now() - this.structCacheDt > 400) {
      this.struct = null;
    }
    this.structCacheDt = Date.now();
    if (this.struct) return this.struct;

    let pages = this.tree.findNodePath((n) => n.name == `pages`);

    let methods: Map<string, any> = new Map();
    let methodArgs: Map<string, Map<string, any>> = new Map();
    let links: Map<string, string[]> = new Map();

    this.findRuntimeLinks(pages.getIds(), pages, (link: any) =>
      this.createLink(links, methods, methodArgs, link)
    );

    // TODO: WARNING: Cache
    this.struct = { links, methods, methodArgs };
    return this.struct;
  }

  private createLink(
    links: Map<string, string[]>,
    methods: Map<string, any>,
    methodArgs: Map<string, Map<string, any>>,
    link: any
  ) {
    let from1 = link.from.path.join(`.`).toNodePathDescs(this.tree);
    let to1 = link.to.path.join(`.`).toNodePathDescs(this.tree);

    let desc = `${from1.last()} -> ${to1.last()}`;

    //Logger.log(`🔗`, `app-switchboard`, `createLink`, desc, { _id: link._id, from: from1, to: to1 });

    let from = link.from.path.join(`.`);
    let to = link.to.path.join(`.`);

    links.set(from, [...(links.get(from) || []), to]);
    //console.log(`${from} -> ${to}`);

    if (link.to.node.type == `code.method`) {
      methods.set(to, link.to.node);
      methodArgs.set(to, new Map());
      //console.log(`${to} -> method ${link.to.node.name}`);
    }
  }

  // Traverse the app source tree, find all the links and construct their full path
  // In runtime, components can be nested inside component instances, inside other components, etc.
  // We need to identify the link data nodes in the context of the app runtime
  private findRuntimeLinks(
    context: number[],
    comp: NodePath,
    cb: Function,
    alreadyFound: Map<string, boolean> = new Map()
  ) {
    // Make sure we don't create the same link twice
    let callCb = (link: any) => {
      let key = JSON.stringify({ from: link.from.path, to: link.to.path });
      if (alreadyFound.has(key)) {
        //Logger.log(`🚫🔗`, `link`, `findRuntimeLinks`, `(duplicate)`, link);
        return;
      }
      alreadyFound.set(key, true);
      cb(link);
    };

    // In this component, find all component instances
    let layoutPs = comp.find((n: any) => n.name == `layout`);
    let compInsts = this.tree
      .getNodePaths(layoutPs)
      .filter(this.is.componentInstance);

    // Find the links in the current component
    let linkPs = comp.find((n: any) => n.name == `links`);
    let links = this.tree
      .getNodePaths(linkPs)
      .filter(this.is.link)
      .map((l) => l.last);

    let toLink = (_id: number | null, from: number[], to: number[]) => {
      return {
        _id,
        from: {
          path: from,
          node: this.tree.getNode(from.last()),
        },
        to: {
          path: to,
          node: this.tree.getNode(to.last()),
        },
      };
    };

    // For each component instance refernce in this component
    // 1. Create a runtime link from its comp inst variables to the component variables
    // 2. Create links from the component's links
    for (let compInst of compInsts) {
      let path = [...context, compInst.last._id];
      // 1. Component instance variables
      let compInstVars = compInst.findAll(
        (n: any) => n.type == `component.instance.variable`
      );
      for (let compInstVar of compInstVars) {
        // Link from the internal component to the component instance variable
        let from = [...path, compInst.last.comp._id, compInstVar.last.var._id];
        let to = [...path, compInstVar.last._id];
        callCb(toLink(null, from, to));
        // And in the other direction, to allow passing data from outside into components
        callCb(toLink(null, to, from));
      }
      // 2. Component links
      // Find the component
      let compInstComp = this.tree.findNodePath(
        (n: any) => n._id == compInst.last.comp._id
      );
      //console.group(compInstComp.last.name);
      // Build more links recursively
      this.findRuntimeLinks(
        [...path, compInstComp.last._id],
        compInstComp,
        cb,
        alreadyFound
      );
      //console.groupEnd();
    }

    // Check if the id is a component instance variable, and if so, adds the component instance id to the path
    let getPath = (context: number[], id: number | string) => {
      let path = [...context];
      // In case of deep links, the id is a string (e.g. `1.2.3`), and we add it to the context
      if (typeof id == `string`) {
        let ids = id.split(`.`).map((i) => parseInt(i));
        id = ids.pop() || 0;
        path.push(...ids);
      }
      let nodePath = comp.find((n: Node) => n._id == id);
      if (nodePath?.last.type == `component.instance.variable`) {
        path.push(nodePath.beforeLast._id);
      }
      path.push(id);
      return path;
    };

    for (let link of links) {
      let from = getPath(context, link.from);
      let to = getPath(context, link.to);
      callCb(toLink(link._id, from, to));
    }
  }

  private onlyStructureNodes(nodePath: NodePath): NodePath {
    return NodePath.fromNodes(
      nodePath.tree,
      nodePath.nodes.filter(this.is.structure)
    );
  }
}

export { AppSource };
