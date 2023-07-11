import "../../../../Shared/Extensions";
import { Component } from "../../classes/Component";
import { Objects } from "../../../../Shared/Extensions.Objects.Client";
import { StateTracker } from "../../classes/StateTracker";
import { AnalyticsTracker } from "../../classes/AnalyticsTracker";
import { ClientContext } from "../../classes/ClientContext";
import { Params } from "../../classes/Params";
import { DatabaseProxy } from "../../../../Apps/DatabaseProxy/Client/DbpClient";
import { VueManager } from "../../classes/VueManager";
import addPaths from "../../../../Shared/WebScript/add.paths";

// To make it accessible to client code
const win = window as any;
win.Objects = Objects;

const htmlEncode = (s: string) => {
  if (!s) return null;
  // HTML encode
  s = s.replace(/&/g, "&amp;");
  s = s.replace(/</g, "&lt;");
  s = s.replace(/>/g, "&gt;");
  s = s.replace(/"/g, "&quot;");
  s = s.replace(/'/g, "&#39;");
  return s;
};

const helpers = {
  url: {
    thread: (thread: any, full: boolean = false) => {
      if (!thread) return null;
      return helpers.url.full(`/t/${thread._id}`, full);
    },
    generator: (generator: any, full: boolean = false) => {
      if (!generator) return null;
      return helpers.url.full(`/${generator.urlName}`, full);
    },
    instance: (instance: any, full: boolean = false) => {
      if (!instance) return null;
      return helpers.url.full(`/instance/${instance.instanceID}`, full);
    },
    instanceImage: (instance: any) => {
      if (!instance) return null;
      return `https://img.memegenerator.net/instances/${instance.instanceID}.jpg`;
    },
    image: (
      imageID: number,
      full: boolean = false,
      removeBackground: boolean = false
    ) => {
      if (!imageID) return null;
      const noBg = removeBackground ? ".nobg" : "";
      return helpers.url.full(
        `https://img.memegenerator.net/images/${imageID}${noBg}.jpg`,
        full
      );
    },
    full: (path: string, full: boolean = false) => {
      if (!path) return null;
      if (path.startsWith("http")) return path;
      if (full) return `https://memegenerator.net${path}`;
      return path;
    },
  },
};

interface MgParams {
  urlName: string;
}

(async () => {
  const client = await ClientContext.get();

  client.Vue.directive("html-raw", {
    bind(el: HTMLElement, binding: any) {
      el.innerHTML = binding.value;
    },
  });

  await client.compileAll();

  let ideVueApp: any = null;

  const dbp = (await DatabaseProxy.new(
    "https://db.memegenerator.net/MemeGenerator"
  )) as any;

  const getNewParams = async () => {
    return (await Params.new(
      () => ideVueApp,
      client.config.params,
      window.location.pathname
    )) as unknown as MgParams;
  };

  const params = await getNewParams();

  const vueManager = await VueManager.new(client);

  ideVueApp = new client.Vue({
    data: {
      state: null as unknown as StateTracker,
      vm: vueManager,
      client,
      dbp,
      analytics: await AnalyticsTracker.new(),
      params: params,
      url: helpers.url,
      comps: client.Vue.ref(client.comps),
      compsDic: {},
      compNames: [],
      templates: client.templates,
      isLoading: false,
      error: null,
      key1: 1,
    },
    async mounted() {
      await this.init();
    },
    methods: {
      async init() {
        const self = this as any;
        self.compsDic = client.comps.toMap((c: Component) => c.name.hashCode());
        self.compNames = client.comps.map((c: Component) => c.name);
      },
      getComponent(uidOrName: number | string) {
        const uid = typeof uidOrName == "number" ? uidOrName : null;
        let name = typeof uidOrName == "string" ? uidOrName : null;
        if (name) name = name.replace(/-/g, ".");
        if (!uid && !name) return null;
        if (uid) {
          const vue = vueManager.getVue(uid);
          if (!vue) return null;
          const compName = vue.$data._.comp.name;
          if (!compName) return null;
          const comp = (this as any).compsDic[compName.hashCode()];
          return comp;
        }
        if (name) {
          const comp = (this as any).compsDic[name.hashCode()];
          return comp;
        }
      },
      isComponentName(name: string) {
        if (!name) return false;
        const self = this as any;
        return !!self.compsDic[name.hashCode()];
      },
      getElementsFromViewNode(node: [string, any]) {
        return document.querySelectorAll(`[path="${node[1].path}"]`);
      },
      getViewChildNodes(node: [string, any]) {
        if (!node[1]) return [];
        if (typeof node[1] != "object") return [];
        let children = Object.entries(node[1]);
        children = children.filter((c) => !this.isAttributeName(c[0]));
        return children;
      },
      addPaths(compName: string, dom: any) {
        return addPaths(this, compName, dom);
      },
      ideWatch(uid: number, name: string) {
        const ideWatches = (this as any).ideWatches;
        const key = `${uid}-${name}`;
        if (ideWatches[key]) return;
        ideWatches[key] = { uid, name };
      },
      isAttributeName(name: string) {
        const self = this as any;
        return client.isAttributeName(self.compNames, name);
      },
      getDescendants(vue: any, filter: any): any[] {
        if (typeof filter == "string") {
          const compName = filter;
          filter = (vue: any) => vue.$data._?.comp.name == compName;
        }
        const vues = [];
        for (const child of vue.$children) {
          if (filter(child)) vues.push(child);
          vues.push(...this.getDescendants(child, filter));
        }
        return vues;
      },
      async navigateTo(item: any) {
        const url = this.itemToUrl(item);
        const self = this as any;
        self.error = null;
        window.history.pushState({}, "", url);
        await this.refresh();
      },
      itemToUrl(item: any) {
        if (typeof item == "string") return item;
        if (item.threadID) return helpers.url.thread({ _id: item.threadID });
        throw new Error("Unknown item type");
      },
      async compileApp() {
        await client.compileApp();
        this.refresh();
      },
      async reloadComponentsFromServer() {
        await client.reloadComponentsFromServer();
        await this.init();
        await this.refreshComponents();
      },
      async getMoreInstances(pageIndex: number) {
        const self = this as any;
        return await self.dbp.instances.select.popular(
          "en",
          pageIndex,
          self.params.urlName
        );
      },
      textToHtml(text: string) {
        if (!text) return null;
        var s = text;
        // HTML encode
        s = htmlEncode(s) || "";
        // >greentext
        s = s.replace(/^&gt;(.*)$/gm, "<span class='greentext'>&gt;$1</span>");
        // line breaks
        s = s.replace(/\n/g, "<br />");
        return s;
      },
      async refresh() {
        const self = this as any;
        const newParams = (await getNewParams()) as any;
        for (const key in newParams) {
          if ("value" in newParams[key])
            self.params[key] = newParams[key].value;
        }
        //(this as any).key1++;
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      async refreshComponents() {
        const self = this as any;
        self.key1++;
        await self.$nextTick();
        await self.state.restoreState();
      },
      instanceToGenerator(instance: any) {
        let gen = JSON.parse(JSON.stringify(instance));
        gen._id = gen.generatorID;
        return gen;
      },
      getInstanceText(instance: any) {
        if (!instance) return null;
        return [instance.text0, instance.text1].filter((a) => a).join(", ");
      },
      setDocumentTitle(title: string) {
        document.title = [title, "Meme Generator"].filter((a) => a).join(" - ");
      },
      getKey(item: any) {
        if (!item) return null;
        if (item._id) return item._id;
        return item;
      },
      getRandomStanza(poem: any) {
        if (!poem?.length) return null;
        const count = poem.length;
        const index = Math.floor(Math.random() * count);
        return poem[index];
      },
      getWorkspaceStyle() {
        const style = {} as any;
        if (!this.isDevEnv()) {
          style.display = "none";
        }
        return style;
      },
      isDevEnv() {
        return window.location.hostname == "localhost";
      },
      visualizedYaml(obj: any) {
        let yaml = (window as any).jsyaml.dump(obj) as string;
        yaml = yaml.replace(/: true$/gm, ": ✔️");
        yaml = yaml.replace(/: false$/gm, ": ❌");
        // Replace colors with colored squares:
        // '#ff0000\n' -> '🟥' (<span class="color"></span>)
        // Works with 3, 6 and 8 digit hex colors
        yaml = yaml.replace(/'#\w{3,8}\b'/g, (match) => {
          let color = match.slice(1); // Remove the '#' symbol
          color = color.substring(0, color.length - 1);
          return `<span class="color" style="background-color:${color}"></span>`;
        });
        // Replace "null" and "undefined" with <span class="opacity-50">null/undefined</span>
        yaml = yaml.replace(/\b(null|undefined)\b/g, (match) => {
          return `<span class="opacity-30">${match}</span>`;
        });
        // Replace numbers (: [number]) with <span class="green">[number]</span>
        yaml = yaml.replace(/: (\d+)/g, (match, p1) => {
          return `: <span class="green">${p1}</span>`;
        });
        // Replace strings (: [string]) with <span class="yellow">[string]</span>
        yaml = yaml.replace(/: (\w.*)/g, (match, p1) => {
          return `: <span class="yellow">${p1}</span>`;
        });
        // Replace keys ([key]: ) with <span class="opacity-50">[key]: </span>
        yaml = yaml.replace(/^(\s*)(\w+):/gm, (match, p1, p2) => {
          return `${p1}<span class="opacity-50">${p2}:</span>`;
        });
        return yaml;
      },
      getIcon(item: any) {
        const stateItemIcons = {
          // method
          m: "🔴",
          // event
          e: "⚡",
          // prop
          p: "🔒",
          // data
          d: "🧊",
          // computed
          c: "✨",
        } as any;
        if (item.type) return stateItemIcons[item.type] || "❔";
        return "❔";
      },
    },
  });

  ideVueApp.state = await StateTracker.new(() => ideVueApp, vueManager, client);

  ideVueApp.$mount("#app");

  window.addEventListener("popstate", async function (event) {
    await ideVueApp.refresh();
  });

  (window as any).ideVueApp = ideVueApp;
})();
