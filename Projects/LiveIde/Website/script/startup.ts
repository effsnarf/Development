import "../../../../Shared/Extensions";
import { Component } from "../../classes/Component";
import { Objects } from "../../../../Shared/Extensions.Objects.Client";
import { TaskQueue } from "../../../../Shared/TaskQueue";
import { StateTracker } from "../../classes/StateTracker";
import { AnalyticsTracker } from "../../classes/AnalyticsTracker";
import { ClientContext } from "../../classes/ClientContext";
import { Params } from "../../classes/Params";
import { DatabaseProxy } from "../../../../Apps/DatabaseProxy/Client/DbpClient";
import { VueManager } from "../../classes/VueManager";
import addPaths from "../../../../Shared/WebScript/add.paths";
import { resolve } from "path";

// To make it accessible to client code
const win = window as any;
win.Objects = Objects;
win.TaskQueue = TaskQueue;

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
    builder: (builder: any, full: boolean = false) => {
      if (!builder) return null;
      return helpers.url.full(`/b/${builder.urlName}`, full);
    },
    media: (media: any, full: boolean = false) => {
      if (!media) return null;
      return helpers.url.full(`/m/${media._id}`, full);
    },
    generator: (generator: any, full: boolean = false) => {
      if (!generator) return null;
      return helpers.url.full(`/${generator.urlName}`, full);
    },
    instance: (instance: any, full: boolean = false) => {
      if (!instance?.instanceID) return null;
      return helpers.url.full(`/instance/${instance.instanceID}`, full);
    },
    itemImage: (item: any) => {
      if (!item) return null;
      if ("text0" in item) {
        if (!item._id) return `/img/empty.png`;
        return `https://img.memegenerator.net/instances/600x600/${item._id}.jpg`;
      }
      if (item.builderID) return null;
      console.log(item);
      throw new Error("Unknown item type");
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
    item: (item: any, full: boolean = false) => {
      if (!item) return null;
      if (item.builderID) return helpers.url.media(item, full);
      if ("text0" in item) return helpers.url.instance(item, full);
      if (item.format) return helpers.url.builder(item, full);
      if (item.displayName) return helpers.url.generator(item, full);
      throw new Error("Unknown item type");
    },
    full: (path: string, full: boolean = false) => {
      if (!path) return null;
      if (path.startsWith("http")) return path;
      if (full) return `https://memegenerator.net${path}`;
      return path;
    },
  },
  html: {
    getAppliedStyle: (element: HTMLElement) => {
      // Create a temporary element to get default styles
      const tempElement = document.createElement(element.tagName);

      // Add the temporary element off-screen
      tempElement.style.position = "absolute";
      tempElement.style.left = "-9999px";
      document.body.appendChild(tempElement);

      // Get computed styles of the temporary element
      const defaultStyles = window.getComputedStyle(tempElement) as any;

      // Get computed styles of the target element
      const computedStyles = window.getComputedStyle(element);

      // Object to store non-default styles
      const nonDefaultStyles = {} as any;

      // Compare styles to find non-default properties
      for (const prop of defaultStyles) {
        if (defaultStyles[prop] !== computedStyles[prop]) {
          nonDefaultStyles[prop] = computedStyles[prop];
        }
      }

      // Clean up - remove the temporary element
      document.body.removeChild(tempElement);

      return Object.entries(nonDefaultStyles)
        .filter((e) => !e[0].startsWith("border-"))
        .map((e) => {
          return { name: e[0], value: e[1] };
        });
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

  client.Vue.directive("dim", {
    bind(el: HTMLElement, binding: any) {
      // Set the opacity to 0.4 if the value is true
      if (binding.value) {
        el.style.opacity = "0.4";
      }
    },
    update(el: HTMLElement, binding: any) {
      // Update the opacity whenever the value changes
      if (binding.value) {
        el.style.opacity = "0.4";
      } else {
        el.style.opacity = "";
      }
    },
  });

  client.Vue.directive("disable", {
    bind(el: HTMLElement, binding: any) {
      // Set the opacity to 0.4 if the value is true
      if (binding.value) {
        el.style.opacity = "0.4";
        el.style.pointerEvents = "none";
      }
    },
    update(el: HTMLElement, binding: any) {
      // Update the opacity whenever the value changes
      if (binding.value) {
        el.style.opacity = "0.4";
        el.style.pointerEvents = "none";
      } else {
        el.style.filter = "";
        el.style.opacity = "";
        el.style.pointerEvents = "";
      }
    },
  });

  await client.compileAll();

  let ideVueApp: any = null;

  const isLocalHost = window.location.hostname == "localhost";
  const dbpHost = `https://db.memegenerator.net`;

  const dbp = (await DatabaseProxy.new(`${dbpHost}/MemeGenerator`)) as any;

  const getNewParams = async () => {
    return (await Params.new(
      () => ideVueApp,
      client.config.params,
      window.location.pathname
    )) as unknown as MgParams;
  };

  const params = await getNewParams();

  const vueManager = await VueManager.new(client);

  ideVueApp = new client.Vue({
    data: {
      // MemeGenerator
      builders: {
        all: {} as any,
        mainMenu: {} as any,
      },
      // General
      state: null as unknown as StateTracker,
      vm: vueManager,
      client,
      dbp,
      analytics: await AnalyticsTracker.new(),
      params: params,
      url: helpers.url,
      html: helpers.html,
      comps: client.Vue.ref(client.comps),
      compsDic: {},
      compNames: [],
      templates: client.templates,
      isLoading: 0,
      error: null,
      loadingImageUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/lightbox2/2.11.3/images/loading.gif",
      key1: 1,
      _uniqueClientID: 1,
      isAdmin: false,
    },
    computed: {
      isDevEnv() {
        return window.location.hostname == "localhost";
      },
    },
    async mounted() {
      await this.init();
    },
    methods: {
      async init() {
        const self = this as any;
        self.compsDic = client.comps.toMap((c: Component) => c.name.hashCode());
        self.compNames = client.comps.map((c: Component) => c.name);
        await self.ensureBuilders();
        self.isAdmin = window.location.hostname == "localhost";
        document.addEventListener("scroll", () => {
          self.$emit("scroll");
        });
      },
      async getBuilder(urlNameOrID: string | number) {
        const self = this as any;
        await self.ensureBuilders();
        if (typeof urlNameOrID == "string") {
          return Object.values(ideVueApp.builders.all).find(
            (b: any) => b.urlName == urlNameOrID
          );
        }
        if (typeof urlNameOrID == "number") {
          return self.builders.all[urlNameOrID];
        }
        throw new Error("Invalid builder ID");
      },
      async ensureBuilders() {
        const self = this as any;
        if (!self.builders?.length) {
          const allBuilders = await self.dbp.builders.select.all();
          self.builders.mainMenu = allBuilders.filter(
            (b: any) => b.visible?.mainMenu
          );
          self.builders.all = allBuilders.toMap((b: any) => b._id);
        }
      },
      getBuilderComponentName(builder: any) {
        if (!builder) return null;
        return `e-format-${builder.format.replace(/\./g, "-")}`;
      },
      getComponent(uidOrName: number | string) {
        const uid = typeof uidOrName == "number" ? uidOrName : null;
        let name = typeof uidOrName == "string" ? uidOrName : null;
        if (name) name = name.replace(/-/g, ".");
        if (!uid && !name) return null;
        if (uid) {
          const vue = vueManager.getVue(uid);
          if (!vue) return null;
          const compName = vue.$data._.comp.name;
          if (!compName) return null;
          const comp = (this as any).compsDic[compName.hashCode()];
          return comp;
        }
        if (name) {
          const comp = (this as any).compsDic[name.hashCode()];
          return comp;
        }
      },
      isComponentName(name: string) {
        if (!name) return false;
        const self = this as any;
        return !!self.compsDic[name.hashCode()];
      },
      getElementsFromViewNode(node: [string, any]) {
        if (!node) return [];
        return document.querySelectorAll(`[path="${node[1].path}"]`);
      },
      getViewChildNodes(node: [string, any]) {
        if (!node[1]) return [];
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
        const url = typeof item == "string" ? item : this.itemToUrl(item);
        const self = this as any;
        self.error = null;
        window.history.pushState({}, "", url);
        await this.refresh();
      },
      itemToUrl(item: any) {
        if (typeof item == "string") return item;
        if (item.threadID) return helpers.url.thread({ _id: item.threadID });
        if (item.builderID && item.content) return helpers.url.media(item);
        throw new Error("Unknown item type");
      },
      async compileApp() {
        await client.compileApp();
        this.refresh();
      },
      async reloadComponentsFromServer() {
        await client.reloadComponentsFromServer();
        await this.init();
        await this.refreshComponents();
      },
      async getMoreInstances(pageIndex: number) {
        const self = this as any;
        return await self.dbp.instances.select.popular(
          "en",
          pageIndex,
          self.params.urlName
        );
      },
      textToHtml(text: string, options: any = {}) {
        if (!text) return null;
        var s = text;
        // HTML encode
        s = htmlEncode(s) || "";
        // >greentext
        s = s.replace(/^&gt;(.*)$/gm, "<span class='greentext'>&gt;$1</span>");
        // "text" to <strong>text</strong>
        s = s.replace(/"(.*?)"(?!\w)/g, "<strong>$1</strong>");
        // line breaks
        s = s.replace(/\n/g, "<br />");
        // First line title
        if (options.firstLine) {
          // Convert the first line (ending with <br />) to <div class="title">..</div>
          s = s.replace(
            /^(.*?<br \/>)/g,
            `<div class='${options.firstLine}'>$1</div>`
          );
        }
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
      async refreshComponents() {
        const self = this as any;
        self.key1++;
        await self.$nextTick();
        await self.state.restoreState();
      },
      instanceToGenerator(instance: any) {
        let gen = Objects.json.parse(JSON.stringify(instance));
        gen._id = gen.generatorID;
        return gen;
      },
      getInstanceText(instance: any) {
        if (!instance) return null;
        return [instance.text0, instance.text1].filter((a) => a).join(", ");
      },
      getMediaText(media: any) {
        return null;
      },
      setDocumentTitle(title: string) {
        document.title = [title, "Meme Generator"].filter((a) => a).join(" - ");
      },
      getKey(item: any) {
        if (!item) return null;
        if (item._uid) return item._uid;
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
      isDevEnv() {
        return window.location.hostname == "localhost";
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
      async uploadFile(file: any) {
        const self = this as any;
        const imageUrl = await this.getImageUrlFromDataTransferFile(file);
        const s = [] as string[];
        s.push(`<img src='${imageUrl}' />`);
        s.push("<h3 class='text-center'>uploading..</h3>");
        s.push(
          `<div class='text-center'><img src='${self.$data.loadingImageUrl}'></img></div>`
        );
        const msg = client.alertify.message(s.join("")).delay(0);

        return new Promise(async (resolve, reject) => {
          let url = "https://img.memegenerator.net/upload";

          var xhr = new XMLHttpRequest();
          var formData = new FormData();
          xhr.open("POST", url, true);

          xhr.addEventListener("readystatechange", async function (e: any) {
            if (xhr.readyState == 4 && xhr.status == 200) {
              const image = Objects.json.parse(xhr.responseText);
              // Download the image from the server
              // this also takes some time, and we should hold the loading indicator
              await self.downloadImage(image._id);
              msg.dismiss();
              resolve(image);
            } else if (xhr.readyState == 4 && xhr.status != 200) {
              msg.dismiss();
              reject(xhr.responseText);
            }
          });

          formData.append("image", file);
          xhr.send(formData);
        });
      },
      async getImageUrlFromDataTransferFile(file: any) {
        // fileDropEvent.preventDefault();
        // const files = fileDropEvent.dataTransfer.files;
        // const imageUrls = [];

        function readFileAsDataURL(file: any) {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function (event: any) {
              resolve(event.target.result);
            };
            reader.onerror = function (event: any) {
              reject(event.error);
            };
            reader.readAsDataURL(file);
          });
        }

        const imageUrl = await readFileAsDataURL(file);
        return imageUrl;

        // for (let i = 0; i < files.length; i++) {
        //   const file = files[i];
        //   if (file.type.startsWith("image/")) {
        //     const imageUrl = await readFileAsDataURL(file);
        //     imageUrls.push(imageUrl);
        //   }
        // }

        // return imageUrls;
      },
      async downloadImage(imageIdOrUrl: any) {
        const self = this as any;
        const imageUrl =
          typeof imageIdOrUrl === "string"
            ? imageIdOrUrl
            : self.url.image(imageIdOrUrl, true);

        return new Promise((resolve, reject) => {
          const imageObj = new Image();
          imageObj.onload = () => {
            resolve(imageObj);
          };
          imageObj.onerror = () => {
            reject(imageObj);
          };
          imageObj.src = imageUrl;
        });
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
          c: "🧮",
        } as any;
        if (item.type) return stateItemIcons[item.type] || "❔";
        return "❔";
      },
      getUniqueClientID() {
        const self = this as any;
        return self.$data._uniqueClientID++;
      },
      getRandomUniqueID() {
        // Fallback for browsers without crypto.getRandomValues support
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
          /[xy]/g,
          (char) => {
            const random = (Math.random() * 16) | 0;
            const value = char === "x" ? random : (random & 0x3) | 0x8;
            return value.toString(16);
          }
        );
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
      scrollIntoView(element: any) {
        const elementRect = element.getBoundingClientRect();
        const bodyRect = document.body.getBoundingClientRect();
        const offset = elementRect.top - bodyRect.top;
        window.scroll({
          top: offset - 200,
          behavior: "smooth",
        });
      },
    },
  });

  ideVueApp.state = await StateTracker.new(() => ideVueApp, vueManager, client);

  ideVueApp.$mount("#app");

  window.addEventListener("popstate", async function (event) {
    await ideVueApp.refresh();
  });

  (window as any).ideVueApp = ideVueApp;
})();
