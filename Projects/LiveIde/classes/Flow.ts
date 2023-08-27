import { Graph } from "../../../Shared/Database/Graph";
import { VueManager } from "./VueManager";

const Vue = (window as any).Vue;

namespace Flow {
  class Runtime {
    nodeDatas = Vue.reactive({});
  }

  export class UserApp {
    runtime: Runtime = new Runtime();

    constructor(private gdb: Graph.Database) {
      this.gdb.events.on("nodes.change", this.onNodesChange.bind(this));
    }

    private async onNodesChange(nodes: Graph.Node[]) {
      for (const node of nodes) {
        if (node.type == "flow.data.fetch") {
          const fetchResponse = await fetch(node.data.url.value);
          const fetchText = await fetchResponse.text();
          let fetchData = JSON.parse(fetchText);
          if (fetchData.result) fetchData = fetchData.result;
          this.runtime.nodeDatas[node.id] = fetchData;
        }
      }
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
        .distinct((vue) => vue._uid);

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

  export class Manager {
    ui: UI;
    user = {
      app: null as UserApp | null,
    };

    constructor(private vm: VueManager, private gdb: Graph.Database) {
      this.ui = new UI(vm, gdb);
      this.user.app = new UserApp(gdb);
    }
  }
}

export { Flow };
