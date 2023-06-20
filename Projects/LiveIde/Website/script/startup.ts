import { Component } from "../../classes/Component";
import { DataWatcher } from "../../../../Shared/DataWatcher";
import { ClientContext } from "../../classes/ClientContext";
import { Params } from "../../classes/Params";
import { DatabaseProxy } from "../../../../Apps/DatabaseProxy/Client/Client";

const helpers = {
  url: {
    image: (imageID: number) => {
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
    window.location.href
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
      instances: null,
    },
    async mounted() {},
    methods: {
      async compileApp() {
        await client.compileApp();
        this.refresh();
      },
      refresh() {
        (this as any).key1++;
      },
    },
  });

  ideVueApp.params = params;

  await dbp.generators.select.one(null, params.urlName, {
    $set: [ideVueApp, "generator"],
  });

  await dbp.instances.select.popular("en", 0, ideVueApp.generator.urlName, {
    $set: [ideVueApp, "instances"],
  });

  (window as any).ideVueApp = ideVueApp;
})();
