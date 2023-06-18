import { Component } from "../../classes/Component";
import { DataWatcher } from "../../../../Shared/DataWatcher";
import { ClientContext } from "../../classes/ClientContext";

(async () => {
  const client = await ClientContext.get();

  await client.compileAll();

  const ideVueApp = new client.Vue({
    el: "#app",
    data: {
      comps: client.Vue.ref(client.comps),
      client: client,
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
