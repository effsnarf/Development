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

(async () => {
  const client = await ClientContext.get();

  await client.compileAll();

  const ideVueApp = new client.Vue({
    el: "#app",
    data: {
      dbp: await DatabaseProxy.new(
        "https://db.memegenerator.net/MemeGenerator"
      ),
      params: null as any,
      url: helpers.url,
      comps: client.Vue.ref(client.comps),
      templates: client.templates,
      key1: 1,
      generator: null,
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
    computed: {
      app() {
        return (this as any).$refs.app;
      },
    },
  });

  ideVueApp.params = await Params.new(
    ideVueApp,
    client.config.params,
    window.location.href
  );

  (window as any).ideVueApp = ideVueApp;
})();
