import "../../../../Shared/Extensions";
import { HtmlHelper } from "../../classes/HtmlHelper";
import { StateTracker } from "../../classes/StateTracker";
import { ClientContext } from "../../classes/ClientContext";
import { VueHelper } from "../../classes/VueHelper";
import { VueManager } from "../../classes/VueManager";

(async () => {
  const client = await ClientContext.get();

  await client.compileAll();

  const vueManager = await VueManager.new(client);

  const ideApp = new client.Vue({
    data: {
      vm: vueManager,
      html: new HtmlHelper(),
    },
    async mounted() {
      await this.init();
    },
    methods: {
      async init() {
        const self = this as any;
        self.newCssRules = await (await fetch(`/css-tool`)).json();
      },
      async reloadComponentsFromServer() {
        await client.reloadComponentsFromServer();
        await this.init();
        await this.refreshComponents();
      },
      async refreshComponents() {
        const self = this as any;
        self.key1++;
        await self.$nextTick();
        await self.state.restoreState();
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
      getComponent(uidOrName: number | string) {
        const uid = typeof uidOrName == "number" ? uidOrName : null;
        let name = typeof uidOrName == "string" ? uidOrName : null;
        if (name) name = name.replace(/-/g, ".");
        if (!uid && !name) return null;
        if (uid) {
          const vue = vueManager.getVue(uid);
          return VueHelper.toIdeComponent(vue);
        }
        if (name) {
          const comp = (this as any).compsDic[name.hashCode()];
          return comp;
        }
      },
      getIcon(item: any) {
        const stateItemIcons = {
          // method
          m: "🔴",
          // event
          e: "⚡",
          // prop
          p: "🔗",
          // data
          d: "🧊",
          // computed
          c: "💡",
        } as any;
        if (item.type) return stateItemIcons[item.type] || "❔";
        return "❔";
      },
      getUniqueClientID() {
        const self = this as any;
        return self.$data._uniqueClientID++;
      },
      async wait(condition: () => boolean, timeout = 10000) {
        // If no condition is provided, just wait the timeout
        if (typeof condition == "number") {
          return new Promise((resolve: any, reject: any) => {
            setTimeout(resolve, condition as number);
          });
        }
        // Wait for a condition to be true
        const startedAt = Date.now();
        const tryInterval = 100;
        return new Promise(async (resolve: any, reject: any) => {
          const tryAgain = async () => {
            if (Date.now() - startedAt > timeout) return reject();
            if (await condition()) {
              resolve();
            } else {
              setTimeout(tryAgain, tryInterval);
            }
          };
          tryAgain();
        });
      },
    },
    watch: {
      newCssRules: {
        handler: async function (newCssRules: any) {
          const self = this as any;
          // POST to /css-tool with { css: newCssRules }
          const response = await fetch("/css-tool", {
            method: "POST",
            body: JSON.stringify({ css: newCssRules }),
          });
        },
      },
    },
    template: `<ide-workspace></ide-workspace>`,
  });

  ideApp.state = await StateTracker.new(() => ideApp, vueManager, client);

  // Create an element to host the Vue IDE app
  const el = document.createElement("div");
  el.id = `vue-ide-app-${Date.now()}`;
  document.body.appendChild(el);

  ideApp.$mount(`#${el.id}`);
})();
