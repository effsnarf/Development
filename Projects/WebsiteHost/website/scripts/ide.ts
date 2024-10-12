import "../../../../Shared/Extensions";
import { HtmlHelper } from "../../Classes/HtmlHelper";
import { StateTracker } from "../../Classes/StateTracker";
import { TaskQueue } from "../../../../Shared/TaskQueue";
import { ClientContext } from "../../Classes/ClientContext";
import { VueHelper } from "../../Classes/VueHelper";
import { VueManager } from "../../Classes/VueManager";
import { Component } from "../../Classes/Component";
import { Performance } from "@shared/Performance";

(window as any).Component = Component;

const taskQueue = new TaskQueue();

let vueApp: any;
let vueIdeApp: any;

const waitUntilInit = async () => {
  while (!vueApp) {
    vueApp = (window as any).vueApp;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
};

const vueIdeCompMixin = {
  matchComp: (c: any) => c.name.startsWith("ide."),
  created() {
    const self = this as any;

    const compName = self.$options.name;

    self._vueIde = {
      methodDatas: {},
    };

    const trackState = false;

    if (trackState) {
      // Watch all events
      Object.keys(self.$listeners).forEach((eventName) => {
        self.$on(eventName, async (...args: any[]) => {
          await waitUntilInit();
          const change = vueIdeApp.state.track(self, "e", eventName, args);
          vueIdeApp.$emit("state-changed", change);
        });
      });

      // Watch all data properties
      Object.keys(self.$data).forEach((key) => {
        self.$watch(key, {
          handler: async (newVal: any, oldVal: any) => {
            await waitUntilInit();
            const change = vueIdeApp.state.track(
              self,
              "d",
              key,
              newVal,
              oldVal
            );
            vueIdeApp.$emit("state-changed", change);
          },
          immediate: true,
          deep: true,
        });
      });

      // Watch all props
      Object.keys(self.$props).forEach((key) => {
        self.$watch(key, {
          handler: async (newVal: any, oldVal: any) => {
            await waitUntilInit();
            const change = vueIdeApp.state.track(
              self,
              "p",
              key,
              newVal,
              oldVal
            );
            vueIdeApp.$emit("state-changed", change);
          },
          immediate: true,
          deep: true,
        });
      });

      // Watch all computed properties
      Object.keys(self.$options.computed).forEach((key) => {
        self.$watch(key, {
          handler: async (newVal: any, oldVal: any) => {
            await waitUntilInit();
            const change = vueIdeApp.state.track(
              self,
              "c",
              key,
              newVal,
              oldVal
            );
            vueIdeApp.$emit("state-changed", change);
          },
          immediate: true,
          deep: true,
        });
      });

      // Watch all methods
      Object.keys(self.$options.methods).forEach((methodName) => {
        const originalMethod = self.$options.methods[methodName];
        const isAsync = originalMethod.constructor.name == "AsyncFunction";

        const methodKey = `${methodName}`;
        const methodDatas = self._vueIde.methodDatas;
        const methodData = (methodDatas[methodKey] = methodDatas[methodKey] || {
          invokes: 0,
          track: true,
          originalMethod: {
            args: originalMethod.getArgumentNames(),
            code: originalMethod.toString(),
          },
        });

        const trackInvokes = () => {
          methodData.invokes++;
          if (methodData.invokes > 100) {
            methodData.track = false;
            console.warn(
              `Method ${compName}.${methodName} invoked more than 100 times. Tracking disabled.`
            );
          }
        };

        if (isAsync) {
          self[methodName] = async function (...args: any[]) {
            if (!methodData.track) return originalMethod.apply(self, args);
            trackInvokes();
            await waitUntilInit();
            const result = await originalMethod.apply(self, args);
            const change = vueIdeApp.state.track(
              self,
              "m",
              methodName,
              null,
              null,
              args
            );
            //vueIdeApp.$emit("state-changed", change);
            return result;
          };
        } else {
          self[methodName] = function (...args: any[]) {
            if (!methodData.track) return originalMethod.apply(self, args);
            trackInvokes();
            const result = originalMethod.apply(self, args);
            if (vueIdeApp) {
              const change = vueIdeApp.state.track(
                self,
                "m",
                methodName,
                null,
                null,
                args
              );
              //vueIdeApp.$emit("state-changed", change);
            }
            return result;
          };
        }
      });
    }
  },
  mounted() {
    vueIdeApp?.vm.registerVue(this);
  },
  unmounted() {
    vueIdeApp?.vm.unregisterVue(this);
  },
};

(window as any).vueIdeCompMixin = vueIdeCompMixin;

(async () => {
  await ClientContext.waitUntilLoaded();
  const client = ClientContext.context!;

  await waitUntilInit();

  await client.compileAll((c) => c.name.startsWith("ide."), [vueIdeCompMixin]);

  const vueManager = VueManager.new(client);

  const state = StateTracker.new(vueManager, client);

  const performanceTracker = Performance.Tracker.new();

  vueIdeApp = new client.Vue({
    data: {
      vm: vueManager,
      html: new HtmlHelper(),
      comps: client.Vue.ref(client.comps),
      templates: client.templates,
      perf: performanceTracker,
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
        //await this.init();
        //await this.refreshComponents();
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
        const self = this as any;
        const uid = typeof uidOrName == "number" ? uidOrName : null;
        let name = typeof uidOrName == "string" ? uidOrName : null;
        if (name) name = name.replace(/-/g, ".");
        if (!uid && !name) return null;
        if (uid) {
          const vue = vueManager.getVue(uid);
          if (!vue) return null;
          const compName = vue.$options.name.replace(/-/g, ".");
          const comp = self.comps.find((c: any) => c.name == compName);
          return VueHelper.toIdeComponent(vue, comp);
        }
        if (name) {
          const comp = (this as any).compsDic[name.hashCode()];
          return comp;
        }
      },
      isPauseOnMethod(compName: string, methodName: string) {
        compName = compName.replace(/-/g, ".");
        const comp = vueIdeApp.comps.find((c: any) => c.name == compName);
        if (!comp) return false;
        const debugMethod = comp.debug?.methods?.[methodName];
        if (debugMethod?.pause) return true;
        return false;
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
        if (typeof item == "string") return stateItemIcons[item] || "❔";
        if (item.type) return stateItemIcons[item.type] || "❔";
        return "❔";
      },
      getIconHint(item: any) {
        const hints = {
          // method
          m: "🔴 method",
          // event
          e: "⚡ event",
          // prop
          p: "🔗 prop",
          // data
          d: "🧊 data",
          // computed
          c: "💡 computed",
        } as any;
        if (typeof item == "string") return hints[item] || "❔";
        if (item.type) return hints[item.type] || "❔";
        return "❔";
      },
      getUniqueClientID() {
        const self = this as any;
        return self.$data._uniqueClientID++;
      },
      async wait(condition: () => boolean, timeout = 3000) {
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

  vueIdeApp.state = state;

  await vueIdeApp.wait(4000);

  // Create an element to host the Vue IDE app
  const el = document.createElement("div");
  el.id = `vue-ide-app-${Date.now()}`;
  document.body.appendChild(el);
  vueIdeApp.$mount(`#${el.id}`);

  (window as any).vueIdeApp = vueIdeApp;
})();
