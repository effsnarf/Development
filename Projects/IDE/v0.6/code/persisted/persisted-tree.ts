// PersistedTree class

import { Action } from "~/code/action-stack/action-stack";
import { PersistedSomething } from "~/code/persisted/persisted-something";
import { Database } from "~/code/database/database";
import { TreeModel } from "~/code/util/tree-model";
import { Utility } from "../util/utility";
import { msg } from "../util/msg";

class Node {
  _id!: number;
  type!: string;
  children: Node[] = [];

  name!: string;
  comp!: any;
  from!: any;
  to!: any;
  var!: any;

  args!: string;
  body!: string;
}

class NodePath {
  tree: PersistedTree;
  nodes: Node[] = [];

  constructor(tree: PersistedTree) {
    this.tree = tree;
  }

  static fromNode(tree: PersistedTree, node: Node) {
    let path = new NodePath(tree);
    path.nodes.push(node);
    return path;
  }

  static fromNodes(tree: PersistedTree, nodes: Node[]) {
    let path = new NodePath(tree);
    path.nodes = [...nodes];
    return path;
  }

  // Returns the last node in the path
  get last(): Node {
    return this.nodes[this.nodes.length - 1];
  }

  // Returns the second last node in the path
  get beforeLast(): Node {
    return this.nodes[this.nodes.length - 2];
  }

  add(node: Node): NodePath {
    let clone = this.clone();
    clone.nodes.push(node);
    return clone;
  }

  find(predicate: Function): NodePath | undefined {
    for (let child of this.last.children || []) {
      if (predicate(child)) return this.add(child);
      let depthResult = this.add(child).find(predicate);
      if (depthResult) return depthResult;
    }
  }

  findAll(predicate: Function, results: NodePath[] = []): NodePath[] {
    for (let child of this.last.children || []) {
      if (predicate(child)) results.push(this.add(child));
      results.push(...this.add(child).findAll(predicate));
    }
    return results;
  }

  clone(): NodePath {
    let clone = new NodePath(this.tree);
    clone.nodes = this.nodes.slice();
    return clone;
  }

  getIds(): number[] {
    return this.nodes.map((node) => node._id);
  }

  toString() {
    let s = this.nodes
      .map((node) => Utility.getNodeIconDesc(node, this.tree))
      .join(`   `);

    return s;
  }

  get readable() {
    return this.toString();
  }
}

class PersistedTree extends PersistedSomething {
  public icon: string = `🌲`;
  private tree = new TreeModel();
  private root: any;

  constructor(db: Database, _id: string, defaultValue: any) {
    super(db, _id, defaultValue);
  }

  static async construct(db: Database, _id: string) {
    let persisted = new PersistedTree(db, _id, {});
    await persisted.load();
    await persisted.copyTreePojoToTreeModel();
    return persisted;
  }

  getNode(_id: any): Node | null {
    if (!_id) return null;
    if (typeof _id == `string`) _id = parseInt(_id.split(`.`).last());
    return this.root.first((node: any) => node.model._id === _id).model;
  }

  // This is used to get the path to a node
  // Warning: inefficient, need to create a map of _id to node
  getNodePath(_id: any): Node[] {
    if (typeof _id != `number`)
      throw new Error(`getNodePath: _id must be a number`);

    let treeNode = this.root.first((node: any) => node.model._id === _id);
    return treeNode.getPath().map((n: any) => n.model);
  }

  getNodePaths(currentPath?: NodePath): NodePath[] {
    if (!currentPath)
      return this.getNodePaths(NodePath.fromNode(this, this.root.model));

    let paths = [] as NodePath[];

    // Only leaf nodes
    // if (!currentPath.last.children?.length) {
    //     return [currentPath];
    // }
    paths.push(currentPath);

    if (currentPath.last.children?.length) {
      for (let child of currentPath.last.children) {
        let childPath = currentPath.add(child);
        paths.push(...this.getNodePaths(childPath));
      }
    }

    return paths;
  }

  findNode(predicate: (node: any) => boolean): Node {
    return this.root.first((node: any) => predicate(node.model)).model;
  }

  findNodePath(predicate: (node: any) => boolean): NodePath {
    let node = this.findNode(predicate);
    return NodePath.fromNodes(this, this.getNodePath(node._id));
  }

  // This also applies to dragging a node to a new parent
  async createNode(parentID: number, node: any) {
    // If dragging a component node to a new parent, create a component.reference node
    // Get the next ID
    node._id = await this.db.identProv?.getNextID();
    // If node has subnodes, for example when dragging from another leaf to copy, give them new IDs
    await this.setChildNodesNewIds(node);
    // Add to the root or to a parent
    let parent = this.root;
    // If the doc has a parent._id, find the parent
    if (parentID) {
      parent = this.root.first((n: any) => n.model._id === parentID);
    }
    // Add the node
    parent.addChild(this.tree.parse(node));
    // Save the new tree to the database
    let action = await this.set(`➕`, `➖`, this.root.model);
    // Set the action description
    action.redo.desc = `Create node ${node._id}`;
    // Set the action result
    action.redo.result = node;
    // Return the action
    return action;
  }

  // If node has subnodes, for example when dragging from another leaf to copy, give them new IDs
  async setChildNodesNewIds(node: any) {
    if (!node.children) return;
    for (let child of node.children) {
      child._id = await this.db.identProv?.getNextID();
      await this.setChildNodesNewIds(child);
    }
  }

  async deleteNode(_id: any) {
    return await this.deleteNodes((n: any) => n._id === _id);
  }

  async deleteNodes(predicate: (node: any) => boolean) {
    // Find the nodes
    let nodes = this.root.all((n: any) => predicate(n.model));
    // Delete the nodes
    for (let node of nodes) {
      node.drop();
    }
    // Return the modified tree
    let action = await this.set(`❌`, `➕`, this.root.model);
    // Set the action description
    action.redo.desc = `Delete nodes (${nodes.map((n: any) => n.model._id)})`;
    // Return the action
    return action;
  }

  async updateNode(_id: any, propName: string, newValue: any) {
    // Find the node
    let node = this.root.first((node: any) => node.model._id === _id);
    // Update the node
    Utility.setObjProperty(node.model, propName, newValue);
    // Save the updated tree to the database (Persisted base class' set())
    let action = await this.set(`✏️`, `✏️`, this.root.model);
    // Set the action description
    action.redo.desc = `Node ${_id} - ${propName} = ${newValue}`;
    // Return the action
    return action;
  }

  // Overriding PersistedSomething.set() because we need to update the root (TreeModel library object)
  async set(
    redoIcon: string,
    undoIcon: string | null,
    newValue: any
  ): Promise<Action> {
    let action = await super.set(redoIcon, undoIcon, newValue);

    await this.copyTreePojoToTreeModel();

    return action;
  }

  private async copyTreePojoToTreeModel() {
    this.root = this.tree.parse(
      Objects.json.parse(JSON.stringify(this.get() || {}))
    );
  }
}

export { PersistedTree, Node, NodePath };
