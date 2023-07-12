import "../../../../Shared/Extensions";
import { Component } from "../../classes/Component";
import { AnalyticsTracker } from "../../classes/AnalyticsTracker";
import { ClientContext } from "../../classes/ClientContext";
import { Params } from "../../classes/Params";
import { DatabaseProxy } from "../../../../Apps/DatabaseProxy/Client/DbpClient";

const helpers = {
  url: {
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
    image: (imageID: number, full: boolean = false) => {
      if (!imageID) return null;
      return helpers.url.full(
        `https://img.memegenerator.net/images/${imageID}.jpg`,
        full
      );
    },
    full: (path: string, full: boolean = false) => {
      if (!path) return null;
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
      dbp,
      analytics: await AnalyticsTracker.new(),
      params: params,
      url: helpers.url,
      comps: client.Vue.ref(client.comps),
      templates: client.templates,
      key1: 1,
    },
    async mounted() {},
    methods: {
      async navigateTo(url: string) {
        window.history.pushState({}, "", url);
        await this.refresh();
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
      getInstanceText(instance: any) {
        if (!instance) return null;
        return [instance.text0, instance.text1].filter((a) => a).join(", ");
      },
      setDocumentTitle(title: string) {
        document.title = [title, "Meme Generator"].filter((a) => a).join(" - ");
      },
      getKey(item: any) {
        if (!item) return null;
        if (item.instanceID) return item.instanceID;
        if (item.generatorID) return item.generatorID;
        return null;
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
    },
  });

  window.addEventListener("popstate", async function (event) {
    await ideVueApp.refresh();
  });

  (window as any).ideVueApp = ideVueApp;
})();
