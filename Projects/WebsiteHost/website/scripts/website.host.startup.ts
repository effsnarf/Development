import "../../../../Shared/Extensions";
import { fetchWithProgress } from "../../../../Shared/Extensions.Network";
import { HtmlHelper } from "../../Classes/HtmlHelper";
import { Events } from "../../../../Shared/Events";
import { Component } from "../../Classes/Component";
import {
  Objects,
  TreeObject,
} from "../../../../Shared/Extensions.Objects.Client";
import { Reflection } from "../../../../Shared/Reflection";
import { Diff } from "../../../../Shared/Diff";
import { TaskQueue } from "../../../../Shared/TaskQueue";
import { Actionable } from "../../../../Shared/Actionable";
import { AnalyticsTracker } from "../../Classes/AnalyticsTracker";
import { ClientContext } from "../../Classes/ClientContext";
import { Params } from "../../Classes/Params";
import { DatabaseProxy } from "../../../../Apps/DatabaseProxy/Client/DbpClient";
import { Timer } from "../../../../Shared/Timer";
import { VueManager } from "../../Classes/VueManager";
import { Data } from "../../../../Shared/Data";
import { Graph } from "../../../../Shared/Database/Graph";
import { StateTracker, StateValue } from "../../Classes/StateTracker";
import { Mixins } from "../../../../Shared/Mvc/Vue/Mixins";
import { MovingPositionSmoother } from "../../../../Shared/MovingPositionSmoother";

const window1 = window as any;

const Vue = (window1 as any).Vue;

let vueApp: any;

// To make it accessible to client code
window1.fetchWithProgress = fetchWithProgress;
window1.Mixins = Mixins;
window1.Objects = Objects;
window1.TreeObject = TreeObject;
window1.Reflection = Reflection;
window1.Diff = Diff;
window1.TaskQueue = TaskQueue;
window1.Data = Data;
window1.Timer = Timer;
window1.DatabaseProxy = DatabaseProxy;
window1.Actionable = Actionable;
window1.Graph = Graph;
window1.StateTracker = StateTracker;
window1.StateValue = StateValue;
window1.MovingPositionSmoother = MovingPositionSmoother;

const generalMixin = {
  matchComp: (c: Component) => true,
  data() {
    return {
      ui: {
        is: {
          hovered: false,
          mounted: false,
        },
      },
      handlers: {
        mouseover: null as any,
        mouseout: null as any,
      },
    };
  },
  mounted() {
    const self = this as any;
    self.ui.is.mounted = true;
    self.handlers.mouseover = (e: Event) => {
      self.ui.is.hovered = true;
    };
    self.handlers.mouseout = (e: Event) => {
      self.ui.is.hovered = false;
    };
    self.$el.addEventListener("mouseover", self.handlers.mouseover);
    self.$el.addEventListener("mouseout", self.handlers.mouseout);

    vueApp?.vm.registerVue(this);
  },
  unmounted() {
    const self = this as any;
    self.ui.is.mounted = false;
    self.$el.removeEventListener("mouseover", self.handlers.mouseover);
    self.$el.removeEventListener("mouseout", self.handlers.mouseout);

    vueApp?.vm.registerVue(this);
  },
  computed: {
    $store(): any {
      return (this as any).$root.store;
    },
  },
};

interface AppLogItem {
  _id: number;
  icon: string;
  names: string[];
  data: any;
  started: number;
  elapsed: number | null;
}

class AppLog {
  private _nextID = 1;
  items = Vue.ref([]);
  events = new Events();

  start(icon: string, names: string[], data: any) {
    if (!Array.isArray(names)) names = [names];
    const logItem = Vue.ref({}) as AppLogItem;
    logItem.icon = icon;
    logItem.names = names;
    logItem.data = data;
    logItem._id = this._nextID++;
    logItem.started = Date.now();
    this.items.value.push(logItem);
    return logItem;
  }

  stop(logItem: AppLogItem) {
    logItem.elapsed = Date.now() - logItem.started;
    this.events.emit("item.elapsed", logItem);
  }

  item(icon: string, names: string[], data: any) {
    const logItem = this.start(icon, names, data);
    logItem.elapsed = null;
    return logItem;
  }

  on = {
    item: {
      elapsed: (callback: (logItem: AppLogItem) => void) => {
        this.events.on("item.elapsed", callback);
      },
    },
  };
}

const gridAppMixin = {
  created() {
    const store = (this as any).store;
    store.boxes = Vue.ref([]);
    store.links = Vue.ref([]);
    store.runtime = {
      log: new AppLog(),
    };
  },
};

const gridAppCompMixin = {
  matchComp: (c: Component) => c.name.startsWith("grid."),
  computed: {
    $boxes() {
      return (this as any).$store.boxes.value;
    },
    $links() {
      return (this as any).$store.links.value;
    },
    $runtime() {
      return {
        log: (this as any).$store.runtime.log,
      };
    },
    $store() {
      return (this as any).$root.store;
    },
  },
};

const flowAppMixin = {
  data() {
    return {
      global: {
        active: {
          node: null,
          related: {
            nodes: [],
          },
        },
        highlighted: {
          nodes: {},
        },
      },
    };
  },
  methods: {
    highlightNodes(...nodes: any[]) {
      nodes = nodes.filter((n) => n);
      const self = this as any;
      for (const node of nodes) {
        self.global.highlighted.nodes[node.id] =
          (self.global.highlighted.nodes[node.id] || 0) + 1;
      }
      self.events.emit(
        "highlighted.nodes.change",
        self.global.highlighted.nodes
      );
    },
    unhighlightNodes(...nodes: any[]) {
      nodes = nodes.filter((n) => n);
      const self = this as any;
      for (const node of nodes) {
        self.global.highlighted.nodes[node.id] =
          (self.global.highlighted.nodes[node.id] || 0) - 1;
      }
      self.events.emit(
        "highlighted.nodes.change",
        self.global.highlighted.nodes
      );
    },
  },
};

const flowAppCompMixin = {
  matchComp: (c: Component) => c.name.startsWith("flow."),
  computed: {
    $global() {
      return (this as any).$root.global;
    },
    $gdb() {
      return (this as any).$root.grid.gdb;
    },
    $nodeDatas() {
      return (this as any).$root.grid.user.app.runtimeData.nodeDatas;
    },
  },
};

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

const mgAppMixin = {
  data() {
    return {
      dbp: null as any,
    };
  },
  async created() {
    const self = this as any;
    try {
      // self.dbp = await DatabaseProxy.new(
      //   `https://db.memegenerator.net/MemeGenerator`
      // );
    } catch (ex: any) {
      console.warn(`Failed to connect to DBP`);
      console.warn(ex);
    }
  },
};

const mgCompMixin = {
  matchComp: (c: Component) => c.name.startsWith("mg."),
  data() {
    return {
      url: mgHelpers.url,
      builders: {
        all: {} as any,
        mainMenu: {} as any,
      },
    };
  },
};

const vueAppMixins = [gridAppMixin, mgAppMixin];

const webScriptMixins = [generalMixin, gridAppCompMixin, mgCompMixin];

interface MgParams {
  urlName: string;
}

(async () => {
  await ClientContext.waitUntilLoaded();
  const client = ClientContext.context!;

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

  client.Vue.directive("show-parent-hover", {
    inserted(el: HTMLElement) {
      // Initially hide the element
      el.style.opacity = "0";
      el.style.transition = "opacity 0.1s ease";

      // Define the mouseover and mouseout handlers
      const mouseoverHandler = () => {
        el.style.opacity = "1";
      };
      const mouseoutHandler = () => {
        el.style.opacity = "0";
      };

      // Get a reference to the parent element
      const parent = el.parentElement;

      // Attach the handlers to the parent element
      parent?.addEventListener("mouseover", mouseoverHandler);
      parent?.addEventListener("mouseout", mouseoutHandler);

      // Store the handlers and parent on the element so they can be removed later
      (el as any)._mouseoverHandler = mouseoverHandler;
      (el as any)._mouseoutHandler = mouseoutHandler;
      (el as any)._parentElement = parent;
    },
    unbind(el: HTMLElement) {
      // Retrieve the handlers and parent from the element
      const mouseoverHandler = (el as any)._mouseoverHandler;
      const mouseoutHandler = (el as any)._mouseoutHandler;
      const parent = (el as any)._parentElement;

      // Remove the handlers
      parent?.removeEventListener("mouseover", mouseoverHandler);
      parent?.removeEventListener("mouseout", mouseoutHandler);
    },
  });

  client.Vue.directive("drag", {
    bind(el: HTMLElement, binding: any) {
      let isDragging = false;
      let startX = 0;
      let startY = 0;

      const handleMouseDown = (event: MouseEvent) => {
        isDragging = true;
        startX = event.clientX;
        startY = event.clientY;
      };

      const handleMouseMove = (event: MouseEvent) => {
        if (!isDragging) return;

        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;

        // Call the provided handler with the deltas
        if (typeof binding.value === "function") {
          binding.value({ deltaX: deltaX, deltaY: deltaY });
        }

        startX = event.clientX;
        startY = event.clientY;
      };

      const handleMouseUp = () => {
        isDragging = false;
      };

      el.addEventListener("mousedown", handleMouseDown);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      // Store the handlers on the element so they can be removed later
      (el as any)._handleMouseDown = handleMouseDown;
      (el as any)._handleMouseMove = handleMouseMove;
      (el as any)._handleMouseUp = handleMouseUp;
    },
    unbind(el: HTMLElement) {
      // Remove the handlers when the directive is unbound
      el.removeEventListener("mousedown", (el as any)._handleMouseDown);
      document.removeEventListener("mousemove", (el as any)._handleMouseMove);
      document.removeEventListener("mouseup", (el as any)._handleMouseUp);
    },
  });

  client.Vue.directive("hover", {
    bind(el: HTMLElement, binding: any) {
      // Handler for mouseover event
      const handleMouseOver = () => {
        if (typeof binding.value === "function") {
          binding.value(true); // Call the provided function with true
        }
      };

      // Handler for mouseout event
      const handleMouseOut = () => {
        if (typeof binding.value === "function") {
          binding.value(false); // Call the provided function with false
        }
      };

      // Add the event listeners
      el.addEventListener("mouseover", handleMouseOver);
      el.addEventListener("mouseout", handleMouseOut);

      // Store the handlers on the element so they can be removed later
      (el as any)._handleMouseOver = handleMouseOver;
      (el as any)._handleMouseOut = handleMouseOut;
    },
    unbind(el: HTMLElement) {
      // Remove the event listeners when the directive is unbound
      el.removeEventListener("mouseover", (el as any)._handleMouseOver);
      el.removeEventListener("mouseout", (el as any)._handleMouseOut);
    },
  });

  client.Vue.directive("follow-mouse", {
    bind(el: HTMLElement, binding: any) {
      const isEnabled = binding.value === true || binding.value === "true";
      if (!isEnabled) return;

      el.style.transition = "none";

      // Function to update the position of the element
      const updatePosition = (event: MouseEvent) => {
        const rect = el.offsetParent?.getBoundingClientRect();
        if (rect) {
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          el.style.position = "absolute";
          el.style.left = x + "px";
          el.style.top = y + "px";
          el.style.transform = "translate(1rem, -50%)";
          el.style.pointerEvents = "none";
        }
      };

      // Add the mousemove listener
      document.addEventListener("mousemove", updatePosition);

      // Store the handler on the element so it can be removed later
      (el as any)._updatePosition = updatePosition;
    },
    update(el: HTMLElement, binding: any) {
      const isEnabled = binding.value === true || binding.value === "true";
      if (isEnabled) {
        document.addEventListener("mousemove", (el as any)._updatePosition);
      } else {
        document.removeEventListener("mousemove", (el as any)._updatePosition);
        el.style.pointerEvents = "auto";
      }
    },
    unbind(el: HTMLElement) {
      document.removeEventListener("mousemove", (el as any)._updatePosition);
    },
  });

  client.Vue.directive("tooltip", {
    inserted(el: HTMLElement, binding: any) {
      // Check if the styles are already added
      if (!document.getElementById("vue-tooltip-styles")) {
        const style: HTMLStyleElement = document.createElement("style");
        style.id = "vue-tooltip-styles";
        style.innerHTML = `
          .vue-tooltip {
            position: absolute;
            background-color: #333;
            color: #fff;
            border-radius: 0.5em;
            padding: 0.5em 1em;
            box-shadow: -8px 8px 8px #000000a0;
            z-index: 1000;
            opacity: 0;
            transition: opacity 100ms ease-in-out;
            pointer-events: none; // Prevents the tooltip from interfering with mouse events
          }
          .vue-tooltip.show {
            opacity: 1;
          }
        `;
        document.head.appendChild(style);
      }
    },
    bind(el: HTMLElement, binding: any) {
      let tooltipElem: HTMLDivElement | null = null;

      let showTimer = null as any;

      el.addEventListener("mousemove", function (e: MouseEvent) {
        if (!tooltipElem) {
          tooltipElem = document.createElement("div");
          tooltipElem.className = "vue-tooltip";
          tooltipElem.innerHTML = binding.value?.textToHtml();
          document.body.appendChild(tooltipElem);
        }

        tooltipElem?.classList.remove("show");

        // Position the tooltip based on mouse position
        //const left: number = e.clientX + 30; // 10px offset from the mouse pointer
        //const top: number = e.clientY - 10;

        // Position the tooltip
        const rect = el.getBoundingClientRect();
        const left = rect.right + 10;
        const top = rect.top - rect.height;

        tooltipElem.style.left = `${left}px`;
        tooltipElem.style.top = `${top}px`;

        // Fade in effect
        requestAnimationFrame(() => {
          clearTimeout(showTimer);
          showTimer = setTimeout(() => {
            tooltipElem?.classList.add("show");
          }, 0);
        });
      });

      el.addEventListener("mouseout", function () {
        if (tooltipElem) {
          clearTimeout(showTimer);
          // Fade out effect
          requestAnimationFrame(() => {
            tooltipElem?.classList.remove("show");
          });
        }
      });
    },
    unbind(el: HTMLElement) {
      // Clean up if the element is removed
      const tooltipElem: HTMLElement | null =
        document.querySelector(".vue-tooltip");
      if (tooltipElem) {
        tooltipElem.remove();
      }
    },
  });

  await client.compileAll((c) => !c.name.startsWith("ide."), webScriptMixins);

  const isLocalHost = window.location.hostname == "localhost";

  const gdbData = { nodes: [], links: [] };

  const getNewParams = async () => {
    return (await Params.new(
      () => vueApp,
      client.config.params,
      window.location.pathname
    )) as unknown as MgParams;
  };

  const params = await getNewParams();

  vueApp = new client.Vue({
    mixins: vueAppMixins,
    data: {
      // Meme Generator
      url: mgHelpers.url,
      builders: {
        all: {} as any,
      },
      //
      events: new Events(),
      vm: null as unknown as VueManager,
      client,
      analytics: await AnalyticsTracker.new(),
      params: params,
      html: new HtmlHelper(),
      comps: client.Vue.ref(client.comps),
      compsDic: {},
      compNames: [],
      templates: client.templates,
      store: {},
      isDevToolsOpen: false,
      isLoading: 0,
      error: null,
      loadingImageUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/lightbox2/2.11.3/images/loading.gif",
      key1: 1,
      _uniqueClientID: 1,
      isAdmin: false,
      newCssRules: {},
      misc: {},
    },
    async mounted() {
      await this.init();
      this.events.on("*", this.onAppEvent.bind(this));
      window.addEventListener("resize", () => {
        this.isDevToolsOpen = window.outerWidth - window.innerWidth > 100;
      });
    },
    methods: {
      async onAppEvent(name: string, ...args: any[]) {
        const self = this as any;
        self.$emit(name, ...args);
      },
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
        setTimeout(() => {
          self.$emit("app-init");
        }, 100);
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
        if (!self.dbp) return;
        if (!Object.keys(self.builders.all).length) {
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
        if (!item) return null;
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
        if (item.id) return item.id;
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
      scrollIntoView(element: any) {
        const elementRect = element.getBoundingClientRect();
        const bodyRect = document.body.getBoundingClientRect();
        const offset = elementRect.top - bodyRect.top;
        window.scroll({
          top: offset - 200,
          behavior: "smooth",
        });
      },
      getNodeVues(node: any) {
        if (!node) return [];
        const self = this as any;
        const vues = self.vm.getDescendants(
          this,
          (v: any) => v.$props?.node?.id == node.id
        );
        return vues;
      },
      getAbsoluteRect(el: any) {
        const rect = el.getBoundingClientRect();
        const scrollLeft = document.documentElement.scrollLeft;
        const scrollTop = document.documentElement.scrollTop;
        const top = rect.top + scrollTop;
        const left = rect.left + scrollLeft;
        const width = rect.width;
        const height = rect.height;
        return { top, left, width, height };
      },
    },
    computed: {
      console: () => console,
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

  const vueManager = await VueManager.new(client);

  vueApp.vm = vueManager;

  if ("dbp" in vueApp) {
    //await vueApp.wait(() => vueApp.dbp);
  }

  vueApp.$mount("#app");

  window.addEventListener("popstate", async function (event) {
    await vueApp.refresh();
  });

  (window as any).vueApp = vueApp;
})();
