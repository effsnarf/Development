import "../../../../Shared/Extensions";
import { HtmlHelper } from "../../Classes/HtmlHelper";
import { Component } from "../../Classes/Component";
import { Objects } from "../../../../Shared/Extensions.Objects.Client";
import { AnalyticsTracker } from "../../Classes/AnalyticsTracker";
import { ClientContext } from "../../Classes/ClientContext";
import { Params } from "../../Classes/Params";
import { DatabaseProxy } from "../../../../Apps/DatabaseProxy/Client/DbpClient";
import { VueManager } from "../../Classes/VueManager";
import { GraphDatabase } from "../../../../Shared/Database/GraphDatabase";

// To make it accessible to client code
const win = window as any;
win.Objects = Objects;

const mgHelpers = {
  url: {
    thread: (thread: any, full: boolean = false) => {
      if (!thread) return null;
      return mgHelpers.url.full(`/t/${thread._id}`, full);
    },
    builder: (builder: any, full: boolean = false) => {
      if (!builder) return null;
      return mgHelpers.url.full(`/b/${builder.urlName}`, full);
    },
    media: (media: any, full: boolean = false) => {
      if (!media) return null;
      return mgHelpers.url.full(`/m/${media._id}`, full);
    },
    generator: (generator: any, full: boolean = false) => {
      if (!generator) return null;
      return mgHelpers.url.full(`/${generator.urlName}`, full);
    },
    instance: (instance: any, full: boolean = false) => {
      if (!instance?.instanceID) return null;
      return mgHelpers.url.full(`/instance/${instance.instanceID}`, full);
    },
    itemImage: (item: any) => {
      if (!item) return null;
      if ("text0" in item) {
        if (!item._id) return `/img/empty.png`;
        return `https://img.memegenerator.net/instances/600x600/${item._id}.jpg`;
      }
      if (item.type == "builder" && item.content?.item) {
        const getImageID = (item: any) => {
          const imageIDs = [] as number[];
          Objects.traverse(item, (node: any, key: string, value: any) => {
            if (key == "imageID") imageIDs.push(value);
          });
          return imageIDs[0];
        };
        const imageID = getImageID(item.content.item);
        return mgHelpers.url.image(imageID);
      }

      const imageNode = Objects.traverseMap(item).find(
        (a) => a.key == "imageID"
      );
      if (imageNode) return mgHelpers.url.image(imageNode.value);

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
      return mgHelpers.url.full(
        `https://img.memegenerator.net/images/${imageID}${noBg}.jpg`,
        full
      );
    },
    item: (item: any, full: boolean = false) => {
      if (!item) return null;
      if (item.builderID) return mgHelpers.url.media(item, full);
      if ("text0" in item) return mgHelpers.url.instance(item, full);
      if (item.format) return mgHelpers.url.builder(item, full);
      if (item.displayName) return mgHelpers.url.generator(item, full);
      throw new Error("Unknown item type");
    },
    full: (path: string, full: boolean = false) => {
      if (!path) return null;
      if (path.startsWith("http")) return path;
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

  let vueApp: any = null;

  const isLocalHost = window.location.hostname == "localhost";
  const dbpHost = `https://db.memegenerator.net`;

  const dbp = (await DatabaseProxy.new(`${dbpHost}/MemeGenerator`)) as any;

  const gdbData = await (await fetch(`/gdb.yaml`)).json();
  const gdb = await GraphDatabase.new(gdbData);

  const getNewParams = async () => {
    return (await Params.new(
      () => vueApp,
      client.config.params,
      window.location.pathname
    )) as unknown as MgParams;
  };

  const params = await getNewParams();

  const vueManager = await VueManager.new(client);

  vueApp = new client.Vue({
    data: {
      // MemeGenerator
      builders: {
        all: {} as any,
        mainMenu: {} as any,
      },
      // General
      vm: vueManager,
      client,
      dbp,
      gdb,
      analytics: await AnalyticsTracker.new(),
      params: params,
      url: mgHelpers.url,
      html: new HtmlHelper(),
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
      newCssRules: {},
    },
    async mounted() {
      await this.init();
    },
    methods: {
      async init() {
        const self = this as any;
        self.newCssRules = await (await fetch(`/css-tool`)).json();
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
          return Object.values(vueApp.builders.all).find(
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
      async mediaToTemp(media: any) {
        const self = this as any;
        const builder = await self.getBuilder(media.builderID);
        let temp = self.builderSourceToTemplate(builder.format, builder.source);
        temp = self.applyMediaToTemplate(media, temp);
        return temp;
      },
      builderSourceToTemplate(format: string, source: any) {
        const self = this as any;

        if (!source) return null;

        if (format == "image.grid") {
          const temp = {
            id: self.getUniqueClientID(),
            type: "grid",
            visible: true,
            aspectRatio: null,
            gap: 0.02,
            caption: !source.title
              ? null
              : {
                  visible: true,
                  editable: source.title.editable,
                  text: source.title.text,
                  font: "Arial",
                  color: "white",
                  align: {
                    h: "center",
                    v: "top",
                  },
                  uppercase: false,
                  scale: 0.6,
                },
            items: [],
            gridItems: {
              width: source.gridItems?.width || 3,
            },
            join: JSON.parse(JSON.stringify(source.join)),
          } as any;

          const hasSubgrid = true || source.subgrid.items > 1;

          const textColor = hasSubgrid ? "white" : "yellow";

          const captionItems = source.captions.items || source.captions;
          const editable = source.captions.editable || false;

          if (Array.isArray(captionItems)) {
            for (let i = 0; i < captionItems.length; i++) {
              const caption = {
                visible: true,
                editable: editable,
                text: captionItems[i],
                font: "Arial",
                color: "white",
                align: {
                  h: "center",
                  v: "bottom",
                },
                uppercase: false,
              };

              let subgrid = temp;

              if (hasSubgrid) {
                subgrid = {
                  id: self.getUniqueClientID(),
                  type: "grid",
                  visible: true,
                  aspectRatio: "1/1",
                  caption,
                  rotation: 0,
                  items: [],
                } as any;

                temp.items.push(subgrid);
              }

              for (let j = 0; j < source.subgrid.items; j++) {
                subgrid.items.add({
                  id: self.getUniqueClientID(),
                  type: "image",
                  visible: true,
                  imageID: null,
                  removeBackground: false,
                  caption: hasSubgrid ? null : caption,
                  trans: {
                    pos: {
                      x: 0.5,
                      y: 0.5,
                    },
                    scale: 1,
                  },
                  shadow: {
                    x: 0,
                    y: 0,
                    blur: 0,
                    color: "#000000",
                    opacity: 1,
                  },
                });
              }
            }
          } else {
            // { default: ?, min: ?, max: ? }
            for (let i = 0; i < captionItems.default; i++) {
              temp.items.push({
                id: self.getUniqueClientID(),
                type: "image",
                visible: true,
                imageID: null,
                removeBackground: false,
                caption: {
                  visible: true,
                  editable: editable,
                  text: "",
                  font: "Arial",
                  color: textColor,
                  align: {
                    h: "center",
                    v: "bottom",
                  },
                  uppercase: false,
                },
                trans: {
                  pos: {
                    x: 0.5,
                    y: 0.5,
                  },
                  scale: 1,
                },
                shadow: {
                  x: 0,
                  y: 0,
                  blur: 0,
                  color: "#000000",
                  opacity: 1,
                },
              });
            }

            for (let i = 0; i < (source.defaults || []).length; i++) {
              Object.assign(temp.items[i], source.defaults[i]);
            }
          }

          return temp;
        }

        if (format == "layers") {
          const getNewItem = (sourceItem: any) => {
            let item = {
              id: self.getUniqueClientID(),
              type: sourceItem.type,
              visible: true,
              editable: sourceItem.editable || true,
            } as any;

            if (item.type == "caption") {
              Object.assign(item, sourceItem);
            }

            if (item.type == "image") {
              item.imageID = sourceItem.imageID || null;
              item.removeBackground = sourceItem.removeBackground || true;
              item.trans = sourceItem.trans || {
                pos: {
                  x: 0.5,
                  y: 0.5,
                },
                scale: 1,
              };
              item.shadow = sourceItem.shadow || {
                x: 0,
                y: 0,
                blur: 0,
                color: "#000000",
                opacity: 1,
              };
            }

            if (item.type == "rainbow") {
              item.colors = sourceItem.colors || [
                "#000000",
                "#ffffff",
                "#000000",
                "#ffffff",
                "#000000",
                "#ffffff",
              ];
              item.colorsCount = sourceItem.colorsCount || 2;
              item.pattern = sourceItem.pattern || "pizza";
              item.slices = sourceItem.slices || 6;
            }

            item.rect = sourceItem.rect;

            item = JSON.parse(JSON.stringify(item));

            return item;
          };

          const temp = {
            id: self.getUniqueClientID(),
            type: "grid",
            layers: true,
            visible: true,
            aspectRatio: source.aspectRatio,
            gap: 0.02,
            items: [],
            gridItems: {
              width: 1,
            },
            can: {
              remove: {
                background: true,
              },
            },
          } as any;

          for (const item of source.items) {
            temp.items.push(getNewItem(item));
          }

          return temp;
        }

        throw new Error("Unknown builder source type");
      },
      applyMediaToTemplate(media: any, temp: any) {
        if (!media || !temp) return null;
        if (media.mediaGenerator)
          temp = Objects.deepMerge(temp, media.mediaGenerator.content.item);
        temp = Objects.deepMerge(temp, media.content.item);
        return temp;
      },
      isComponentName(name: string) {
        if (!name) return false;
        const self = this as any;
        return !!self.compsDic[name.hashCode()];
      },
      ideWatch(uid: number, name: string) {
        const ideWatches = (this as any).ideWatches;
        const key = `${uid}-${name}`;
        if (ideWatches[key]) return;
        ideWatches[key] = { uid, name };
      },
      async navigateTo(item: any) {
        const url = typeof item == "string" ? item : this.itemToUrl(item);
        const self = this as any;
        self.error = null;
        window.history.pushState({}, "", url);
        await this.refresh();
      },
      async notifyNavigateTo(item: any) {
        const self = this as any;
        const url = this.itemToUrl(item);
        const item2 = url?.startsWith("/m/")
          ? await self.mediaToTemp(item)
          : item;
        const imageUrl = mgHelpers.url.itemImage(item2);
        (window as any).alertify
          .message(
            `<a href="${url}" onclick="vueApp.navigateTo(this.href); return false;" class="clickable"><img src="${imageUrl}" /></a><div class="opacity-50 text-center"></div>`
          )
          .delay(0);
      },
      itemToUrl(item: any) {
        if (typeof item == "string") return item;
        if (item.instanceID) return mgHelpers.url.instance(item);
        if (item.threadID) return mgHelpers.url.thread({ _id: item.threadID });
        if (item.builderID && item.content) return mgHelpers.url.media(item);
        throw new Error("Unknown item type");
      },
      notify(componentName: string, item: any) {
        const self = this as any;
        self.$emit("notify", { componentName, item });
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
      textToHtml(text: string, options: any = {}) {
        if (!text) return null;
        var s = text;
        // HTML encode
        s = vueApp.html.encode(s) || "";
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
        if (item._id) return item._id;
        if (item._uid) return item._uid;
        return item;
      },
      getRandomStanza(poem: any) {
        if (!poem?.length) return null;
        const count = poem.length;
        const index = Math.floor(Math.random() * count);
        return poem[index];
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
          c: "💡",
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
      getGdbCompName(node: any) {
        if (!node) return null;
        return `${node.type.kebabize()}`;
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
  });

  vueApp.$mount("#app");

  window.addEventListener("popstate", async function (event) {
    await vueApp.refresh();
  });

  (window as any).vueApp = vueApp;
})();