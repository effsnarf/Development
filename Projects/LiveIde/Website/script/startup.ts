import { Component } from "../../classes/Component";
import { DataWatcher } from "../../../../Shared/DataWatcher";
import { ClientContext } from "../../classes/ClientContext";
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
      $dbp: await DatabaseProxy.new(
        "https://db.memegenerator.net/MemeGenerator"
      ),
      url: helpers.url,
      comps: client.Vue.ref(client.comps),
      templates: client.templates,
      key1: 1,
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

  (window as any).ideVueApp = ideVueApp;
})();
