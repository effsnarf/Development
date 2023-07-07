import "../../../../Shared/Extensions";
import { Component } from "../../classes/Component";
import { Objects } from "../../../../Shared/Extensions.Objects.Client";
import { StateTracker } from "../../classes/StateTracker";
import { AnalyticsTracker } from "../../classes/AnalyticsTracker";
import { ClientContext } from "../../classes/ClientContext";
import { Params } from "../../classes/Params";
import { DatabaseProxy } from "../../../../Apps/DatabaseProxy/Client/DbpClient";
import addPaths from "../../../../Shared/WebScript/add.paths";

// To make it accessible to client code
const win = window as any;
win.StateTracker = StateTracker;
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

  ideVueApp = new client.Vue({
    el: "#app",
    data: {
      vues: {},
      vuesCount: 0,
      ideWatches: {},
      client,
      dbp,
      analytics: await AnalyticsTracker.new(),
      params: params,
      url: helpers.url,
      comps: client.Vue.ref(client.comps),
      compsDic: client.comps.toMap((c: Component) => c.name.hashCode()),
      compNames: client.comps.map((c: Component) => c.name),
      templates: client.templates,
      isLoading: false,
      error: null,
      key1: 1,
    },
    async mounted() {},
    methods: {
      getVue(uid: number) {
        if (!uid) return null;
        const vue = (this as any).vues[uid];
        if (!vue) return null;
        return vue();
      },
      getComponent(uid: number) {
        const vue = this.getVue(uid);
        if (!vue) return null;
        const compName = vue.$data._.comp.name;
        if (!compName) return null;
        const comp = (this as any).compsDic[compName.hashCode()];
        return comp;
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
      onVueMounted(vue: any) {
        const self = this as any;
        const uid = vue._uid;
        self.vues[uid] = () => vue;
        self.vuesCount++;
      },
      onVueUnMounted(vue: any) {
        const self = this as any;
        const uid = vue._uid;
        delete self.vues[uid];
        self.vuesCount--;
      },
      isDevEnv() {
        return window.location.hostname == "localhost";
      },
    },
  });

  window.addEventListener("popstate", async function (event) {
    await ideVueApp.refresh();
  });

  (window as any).ideVueApp = ideVueApp;
})();
