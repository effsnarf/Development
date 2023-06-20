import { Component } from "../../classes/Component";
import { DataWatcher } from "../../../../Shared/DataWatcher";
import { ClientContext } from "../../classes/ClientContext";
import { Params } from "../../classes/Params";
import { DatabaseProxy } from "../../../../Apps/DatabaseProxy/Client/Client";

const helpers = {
  url: {
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

  await client.compileAll();

  let ideVueApp: any = null;

  const dbp = (await DatabaseProxy.new(
    "https://db.memegenerator.net/MemeGenerator"
  )) as any;

  const params = (await Params.new(
    () => ideVueApp,
    client.config.params,
    window.location.pathname
  )) as unknown as MgParams;

  ideVueApp = new client.Vue({
    el: "#app",
    data: {
      dbp,
      params: null as any,
      url: helpers.url,
      comps: client.Vue.ref(client.comps),
      templates: client.templates,
      key1: 1,
      generator: null,
      generators: null,
      instances: null,
    },
    async mounted() {},
    methods: {
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
      refresh() {
        (this as any).key1++;
      },
    },
  });

  ideVueApp.params = params;

  if (params.urlName) {
    dbp.generators.select.one(null, params.urlName, {
      $set: [ideVueApp, "generator"],
    });

    dbp.generators.select.related(params.urlName, {
      $set: [ideVueApp, "generators"],
    });
  }

  (window as any).ideVueApp = ideVueApp;
})();
