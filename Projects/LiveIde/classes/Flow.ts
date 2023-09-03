import { Objects } from "../../../Shared/Extensions.Objects.Client";
import { Data } from "../../../Shared/Data";
import { Events } from "../../../Shared/Events";
import { Graph } from "../../../Shared/Database/Graph";
import { VueManager } from "./VueManager";
import { Actionable } from "../../../Shared/Actionable";

const Vue = (window as any).Vue;

namespace Flow {
  interface Persisters {
    memory: Data.Persister.Base;
    localStorage: Data.Persister.Base;
  }

  class RuntimeData {
    events = new Events();
    private nodeDatas = Vue.reactive({});

    constructor(private gdb: Graph.Database) {
      this.gdb.events.on("node.change", this.onNodeChange.bind(this));
    }

    private async onNodeChange(node: Graph.Node) {
      this.computeNodeData(node);
    }

    async computeNodeData(node: Graph.Node) {
      if (!node) return;

      if (node.type == "flow.data.fetch") {
        if (false) {
          const catalogUrl = `/fetch?url=https://a.4cdn.org/fit/catalog.json`;
          const catalog = (await (await fetch(catalogUrl)).json()) as any[];
          const threadID = catalog[0].threads.sortBy((t: any) => -t.replies)[0]
            .no;
          const threadUrl = `/fetch?url=https://a.4cdn.org/fit/thread/${threadID}.json`;
          const thread = (await (await fetch(threadUrl)).json()) as any;
          const posts = thread.posts
            .filter((p: any) => p.ext)
            .map((p: any) => ({
              id: p.no,
              text: p.com,
              imageUrl: `https://i.4cdn.org/fit/${p.tim}s${p.ext}`,
            }));
          this.setNodeData(node, posts);

          return;
        }

        const imageUrls = [
          "https://cdn.pixabay.com/photo/2016/03/28/12/35/cat-1285634_640.png",
          "https://cdn.pixabay.com/photo/2015/11/16/14/43/cat-1045782_640.jpg",
          "https://cdn.pixabay.com/photo/2016/07/10/21/47/cat-1508613_640.jpg",
          "https://cdn.pixabay.com/photo/2013/05/30/18/21/cat-114782_640.jpg",
          "https://cdn.pixabay.com/photo/2016/06/14/00/14/cat-1455468_640.jpg",
          "https://cdn.pixabay.com/photo/2018/05/04/16/50/cat-3374422_640.jpg",
          "https://cdn.pixabay.com/photo/2020/10/05/10/51/cat-5628953_640.jpg",
          "https://cdn.pixabay.com/photo/2016/09/07/22/38/cat-1652822_640.jpg",
          "https://cdn.pixabay.com/photo/2020/06/24/19/41/cat-5337501_640.jpg",
          "https://cdn.pixabay.com/photo/2015/06/07/19/42/animal-800760_640.jpg",
        ];
        const texts = [
          "Fluffo the Frog",
          "Giggly Garry",
          "MemeMaster Mike",
          "Chillax Charlie",
          "Dank Dave",
          "Lolita Llama",
          "Pepe's Peculiar Pal",
          "Roflcopter Rick",
          "Sassy Sally",
          "Woke Wendy",
        ];

        const exampleData = imageUrls.map((url, index) => ({
          id: index,
          text: texts[index],
          imageUrl: url,
        }));

        this.setNodeData(node, exampleData);

        return;

        const fetchResponse = await fetch(node.data.url.value);
        const fetchText = await fetchResponse.text();
        let fetchData = JSON.parse(fetchText);
        if (fetchData.result) fetchData = fetchData.result;
        this.setNodeData(node, fetchData);
      }
    }

    onNodeClick(node: Graph.Node, contextData: any) {
      const nodeLinks = this.gdb
        .getNodeLinks(node)
        .filter((l) => l.type == "data.send")
        .filter((l) => l.data.event == "click");

      for (const link of nodeLinks) {
        this.events.emit("link.data.send", link);
      }

      const nodes = nodeLinks
        .map((l) => this.gdb.getNode(l.to))
        .filter((n) => n);

      for (let node of nodes) {
        node = node as Graph.Node;
        const data = contextData || this.nodeDatas[node.id];
        this.setNodeData(node, contextData);
      }
    }

    setNodeData(node: Graph.Node, data: any, depth = 0) {
      if (depth > 10) {
        (window as any).alertify.error("setNodeData: max depth reached");
        return;
      }

      this.nodeDatas[node.id] = data;
      this.events.emit("node.data.change", node, data);

      const sendToNodes = this.gdb.getNodes(node, "data.send") as Graph.Node[];

      for (const sendToNode of sendToNodes) {
        const links = this.gdb.getLinks(node, sendToNode);
        for (const link of links) {
          this.events.emit("link.data.send", link);
        }

        this.setNodeData(sendToNode, data, depth + 1);
      }
    }
  }

  export class UserApp {
    events = new Events();
    runtimeData: RuntimeData;

    constructor(private gdb: Graph.Database) {
      this.runtimeData = new RuntimeData(gdb);
      this.events.forward(this.runtimeData.events, "runtime.data");
    }

    onNodeClick(node: Graph.Node, contextData: any) {
      this.runtimeData.onNodeClick(node, contextData);
    }

    isNodeClickable(node: Graph.Node) {
      const nodeLinks = this.gdb
        .getNodeLinks(node)
        .filter((l) => l.from == node.id)
        .filter((l) => l.data.event == "click");

      return nodeLinks.length > 0;
    }
  }

  export class UI {
    nodeIdsToVueUids = new Map<number, number[]>();

    constructor(private vm: VueManager, private gdb: Graph.Database) {}

    getNodeVues(node: any, options: any = {}) {
      if (!node) return [];
      const vueUids = this.nodeIdsToVueUids.get(node.id) || [];
      return this.uidsToVues(vueUids, options);
    }

    getLinkedVues(node: any, options: any = {}) {
      const linkedNodes = this.gdb.getLinkedNodes(node);

      const vues = linkedNodes
        .flatMap(this.getNodeVues.bind(this))
        .distinct((vue: any) => vue._uid);

      return vues;
    }

    uidsToVues(vueUids: number[], options: any = {}) {
      let vues = vueUids.map((uid) => this.vm.getVue(uid)).filter((vue) => vue);
      vues = vues.except(options.except);
      return vues;
    }

    registerVue(vue: any) {
      if (!vue.node) return;
      const node = vue.node;
      const vueUids = this.nodeIdsToVueUids.get(node.id) || [];
      vueUids.push(vue._uid);
      this.nodeIdsToVueUids.set(node.id, vueUids);
    }

    unregisterVue(vue: any) {
      if (!vue.node) return;
      const node = vue.node;
      const vueUids = this.nodeIdsToVueUids.get(node.id) || [];
      vueUids.removeBy((uid) => uid == vue._uid);
      this.nodeIdsToVueUids.set(node.id, vueUids);
    }
  }

  export class Interface {
    private constructor(
      private userAppGdb: Graph.ActionableDatabase,
      public userActions: Actionable.ActionStack
    ) {
      userActions.executeAction = this.executeAction.bind(this);
    }

    static async new(
      vueApp: any,
      userAppGdb: Graph.ActionableDatabase,
      persisters: Persisters
    ) {
      const userActions = await Actionable.ActionStack.new(
        persisters.localStorage,
        "user.actions"
      );

      vueApp.$on("user.action", (redo: any) => userActions.do({ redo }));

      const interface1 = new Interface(userAppGdb, userActions);

      if (userActions.actions.count == 1) {
        userActions.do({
          redo: {
            method: "init.user.app.source",
            args: [],
          },
        });
      }

      return interface1;
    }

    async executeAction(action: any) {
      const self = this as any;
      const { redo } = action;

      if (redo.method) {
        const methodName =
          "on" +
          redo.method
            .split(".")
            .map((s: string) => s.capitalize())
            .join("");

        if (!self[methodName])
          throw new Error("Unknown method: " + redo.method);

        return await self[methodName](action);
      }

      if (redo.type) {
        const methodName =
          "on" +
          redo.type
            .split(".")
            .map((s: string) => s.capitalize())
            .join("");

        if (!self[methodName]) throw new Error("Unknown type: " + redo.type);

        return await self[methodName](action);
      }

      throw new Error("Unknown action type: " + redo.type);
    }

    private async onInitUserAppSource(action: any) {
      await this.userActions.clear();

      await this.userAppGdb.clear();

      await this.userAppGdb.addTemplate("app");

      action.undo = { method: "gdb.undo" };

      return action;
    }

    private async onDndDrop(action: any) {
      const { dragItem, dropItem } = action.redo;

      if (dragItem.type == "flow.app.compInst") {
        if (dropItem.type == "flow.app.compInst") {
          await this.userAppGdb.addLink(dragItem, "data.send", dropItem, {
            event: "click",
          });
          return;
        }
      }

      if (dropItem == "trash") {
        await this.userAppGdb.deleteNode(dragItem);
        return;
      }

      if (typeof dragItem == "string")
        return await this.onDndDrop_newNode(action);
      else return await this.onDndDrop_nodeToNode(action);
    }

    private async onDndDrop_newNode(action: any) {
      const { dragItem, dropItem } = action.redo;
      const newNodeType = dragItem;

      if (dropItem.type == "flow.layout.empty") {
        const oldPointer = this.userAppGdb.actionStack.pointer.value;
        const newNode = await this.createNewNode(newNodeType);
        this.userAppGdb.replaceNode(dropItem, newNode);
        const newPointer = this.userAppGdb.actionStack.pointer.value;
        const newActionsCount = newPointer - oldPointer + 1;

        action.undo = { method: "gdb.undo", args: [newActionsCount] };

        return action;
      } else {
        throw new Error("Not implemented");
      }
    }

    private async onDndDrop_nodeToNode(action: any) {
      const { dragItem, dropItem } = action;

      if (action.dropItem.type == "flow.layout.empty") {
        if (action.dragItem.type == "flow.app.comp") {
          const compInst = this.userAppGdb.addNode("flow.app.compInst", {
            compID: {
              type: "noderef",
              value: {
                type: "flow.app.comp",
                value: action.dragItem.id,
              },
            },
          });
          this.userAppGdb.replaceNode(action.dropItem, compInst);
          return;
        }
        // Move node to empty layout node
        if (action.dragItem.type.startsWith("flow.layout")) {
          this.userAppGdb.replaceNode(action.dropItem, action.dragItem);
          return;
        }
        throw new Error("Not implemented");
      }
      this.userAppGdb.addLink(action.dragItem, "data.send", action.dropItem);
    }

    private async createNewNode(newNodeType: string) {
      const data = {};

      const newNode = this.userAppGdb.addNode(newNodeType, data);

      return newNode;
    }

    private async onGdbUndo(action: any) {
      const args = action.redo.args || [];
      const count = args[0];
      await this.userAppGdb.actionStack.undo(count);
    }

    private toPersistableAction(action: any) {
      return Objects.clone({
        redo: this.toPersistableDoable(action.redo),
        undo: this.toPersistableDoable(action.undo),
      });
    }

    private fromPersistableAction(action: any) {
      return Objects.clone({
        redo: this.fromPersistableDoable(action.redo),
        undo: this.fromPersistableDoable(action.undo),
      });
    }

    private toPersistableDoable(doable: any) {
      if (!doable) return null;
      return Object.fromEntries(
        Object.entries(doable).map(([key, value]: [string, any]) => {
          if (value?.id) value = { id: value.id };
          return [key, value];
        })
      );
    }

    private fromPersistableDoable(doable: any) {
      if (!doable) return null;
      return Object.fromEntries(
        Object.entries(doable).map(([key, value]: [string, any]) => {
          if (value?.id) value = this.userAppGdb.getNode(value.id);
          return [key, value];
        })
      );
    }
  }

  export class Manager {
    events = new Events();
    ui: UI;
    interface!: Interface;
    user = {
      app: null as UserApp | null,
    };

    private constructor(private vm: VueManager, private gdb: Graph.Database) {
      this.ui = new UI(vm, gdb);
      this.user.app = new UserApp(gdb);
      this.events.forward(gdb.events, "gdb");
      this.events.forward(this.user.app.events, "user.app");
    }

    static async new(vueApp: any, vm: VueManager, gdbData: any) {
      const persisters = {
        memory: Data.Persister.Memory.new(),
        localStorage: Data.Persister.LocalStorage.new("flow"),
      } as Persisters;

      const userAppGdb = await Graph.ActionableDatabase.new2(
        persisters.memory,
        "gdb",
        gdbData
      );

      const manager = new Manager(vm, userAppGdb);

      manager.interface = await Interface.new(vueApp, userAppGdb, persisters);

      return manager;
    }
  }
}

export { Flow };
