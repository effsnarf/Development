import "../../../../Shared/Extensions";
import { Component } from "../../classes/Component";
import { AnalyticsTracker } from "../../classes/AnalyticsTracker";
import { ClientContext } from "../../classes/ClientContext";
import { Params } from "../../classes/Params";
import { DatabaseProxy } from "../../../../Apps/DatabaseProxy/Client/DbpClient";

const helpers = {
  url: {
    generator: (generator: any) => {
      if (!generator) return null;
      return `/${generator.urlName}`;
    },
    instance: (instance: any) => {
      if (!instance) return null;
      return `/instance/${instance.instanceID}`;
    },
    image: (imageID: number) => {
      if (!imageID) return null;
      return `https://img.memegenerator.net/images/${imageID}.jpg`;
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
        self.params = await getNewParams();
        (this as any).key1++;
      },
      getKey(item: any) {
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