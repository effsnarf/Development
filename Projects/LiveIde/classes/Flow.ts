import { Events } from "../../../Shared/Events";
import { Graph } from "../../../Shared/Database/Graph";
import { VueManager } from "./VueManager";

const Vue = (window as any).Vue;

namespace Flow {
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

    initialize() {
      const app = this.gdb.addTemplate("app");
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

  export class Manager {
    events = new Events();
    ui: UI;
    user = {
      app: null as UserApp | null,
    };

    constructor(private vm: VueManager, private gdb: Graph.Database) {
      this.ui = new UI(vm, gdb);
      this.user.app = new UserApp(gdb);
      this.events.forward(this.user.app.events, "user.app");
    }
  }
}

export { Flow };
