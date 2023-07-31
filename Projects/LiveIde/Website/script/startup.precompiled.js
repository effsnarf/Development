/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "../../../../../Apps/DatabaseProxy/Client/DbpClient.ts":
/*!*************************************************************!*\
  !*** ../../../../../Apps/DatabaseProxy/Client/DbpClient.ts ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, exports) => {


// This version is for public clients like Meme Generator
// Doesn't have direct access to the database, but can still use the API
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DatabaseProxy = void 0;
// Lowercase the first letter of a string
String.prototype.untitleize = function () {
    return this.charAt(0).toLowerCase() + this.slice(1);
};
class DatabaseProxy {
    urlBase;
    fetchAsJson;
    constructor(urlBase, _fetchAsJson) {
        this.urlBase = urlBase;
        this.fetchAsJson =
            _fetchAsJson ||
                (async (url, ...args) => {
                    const response = await fetch(url, ...args);
                    const text = await response.text();
                    if (!text?.length)
                        return null;
                    return JSON.parse(text);
                });
    }
    static async new(urlBase, _fetchAsJson) {
        const dbp = new DatabaseProxy(urlBase, _fetchAsJson);
        await dbp.init();
        return dbp;
    }
    async init() {
        const api = await this.createApiMethods();
        for (const key of Object.keys(api)) {
            this[key] = api[key];
        }
    }
    static setValue(obj, value) {
        if (Array.isArray(obj)) {
            obj[0][obj[1]] = value;
        }
        else {
            obj.value = value;
        }
    }
    async fetchJson(url, options = {}) {
        // $set also implies cached
        if (!options.$set) {
            if (options.cached) {
                // Even though we're returning from the cache,
                // we still want to fetch in the background
                // to update for the next time
                const fetchItem = async () => {
                    const item = await this.fetchAsJson(url, options);
                    //localStorage.setItem(url, JSON.stringify(item));
                    return item;
                };
                //const cachedItem = Objects.json.parse(localStorage.getItem(url) || "null");
                const cachedItem = null;
                if (!cachedItem)
                    return await fetchItem();
                // Fetch in the background
                fetchItem();
                return cachedItem;
            }
            return await this.fetchAsJson(url, options);
        }
        // Check the local cache
        //const cachedItem = Objects.json.parse(localStorage.getItem(url) || "null");
        const cachedItem = null;
        if (cachedItem)
            DatabaseProxy.setValue(options.$set, cachedItem);
        // Fetch in the background
        const item = await this.fetchAsJson(url, options);
        // Update the local cache
        //localStorage.setItem(url, JSON.stringify(item));
        DatabaseProxy.setValue(options.$set, item);
        return item;
    }
    async callApiMethod(entity, group, method, args, extraArgs) {
        // We're using { $set: [obj, prop] } as a callback syntax
        // This is because sometimes we use the local cache and also fetch in the background
        // in which case we'll need to resolve twice which is not possible with a promise
        const options = extraArgs.find((a) => a?.$set) || {};
        let url = `${this.urlBase}/api/${entity}/${group}/${method}`;
        const isHttpPost = group == "create";
        if (isHttpPost) {
            const data = {};
            args.forEach((a) => (data[a.name] = a.value));
            const isCreateCall = url.includes("/create/one");
            if (isCreateCall) {
                data._uid = DatabaseProxy.getRandomUniqueID();
            }
            const fetchOptions = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                mode: "no-cors",
            };
            let result = await this.fetchJson(url, fetchOptions);
            // If we got an _id back, select the item
            // This is because when POSTing from localhost I'm having trouble getting the actual object back
            const _id = parseInt(result);
            if (isCreateCall && (!result || typeof result != "object")) {
                if (_id) {
                    const idFieldName = `${entity
                        .substring(0, entity.length - 1)
                        .toLowerCase()}ID`;
                    result = await this.callApiMethod(entity, "select", "one", [{ name: idFieldName, value: _id }], []);
                }
                else {
                    result = await this.callApiMethod(entity, "select", "one", [{ name: "_uid", value: data._uid }], []);
                }
            }
            return result;
        }
        const argsStr = args
            .map((a) => `${a.name}=${JSON.stringify(a.value || null)}`)
            .join("&");
        const getUrl = `${url}?${argsStr}`;
        const result = await this.fetchJson(getUrl, options);
        return result;
    }
    async createApiMethods() {
        const api = {};
        const apiMethods = await this.getApiMethods();
        apiMethods.forEach((e) => {
            const entityName = e.entity.untitleize();
            api[entityName] = {};
            e.groups.forEach((g) => {
                api[entityName][g.name] = {};
                g.methods.forEach((m) => {
                    api[entityName][g.name][m.name] = async (...args) => {
                        let result = await this.callApiMethod(e.entity, g.name, m.name, (m.args || []).map((a, i) => {
                            return { name: a, value: args[i] };
                        }), args.slice((m.args || []).length));
                        if (m.then) {
                            const thenArgs = [`api`, ...(m.then.args || [])];
                            const then = eval(`async (${thenArgs.join(`,`)}) => { ${m.then.body} }`);
                            if (m.then.chainResult) {
                                result = await then(api, result);
                            }
                            else {
                                then(api, result);
                            }
                        }
                        return result;
                    };
                });
            });
        });
        return api;
    }
    async getApiMethods() {
        const result = await this.fetchJson(`${this.urlBase}/api`, {
            cached: true,
        });
        return result;
    }
    static getRandomUniqueID() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
            const random = (Math.random() * 16) | 0;
            const value = char === "x" ? random : (random & 0x3) | 0x8;
            return value.toString(16);
        });
    }
}
exports.DatabaseProxy = DatabaseProxy;


/***/ }),

/***/ "../../../../LiveIde/Website/script/1690799541640.ts":
/*!***********************************************************!*\
  !*** ../../../../LiveIde/Website/script/1690799541640.ts ***!
  \***********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__webpack_require__(/*! ../../../../Shared/Extensions */ "../../../../../Shared/Extensions.ts");
const Extensions_Objects_Client_1 = __webpack_require__(/*! ../../../../Shared/Extensions.Objects.Client */ "../../../../../Shared/Extensions.Objects.Client.ts");
const TaskQueue_1 = __webpack_require__(/*! ../../../../Shared/TaskQueue */ "../../../../../Shared/TaskQueue.ts");
const StateTracker_1 = __webpack_require__(/*! ../../classes/StateTracker */ "../../../../LiveIde/classes/StateTracker.ts");
const AnalyticsTracker_1 = __webpack_require__(/*! ../../classes/AnalyticsTracker */ "../../../../LiveIde/classes/AnalyticsTracker.ts");
const ClientContext_1 = __webpack_require__(/*! ../../classes/ClientContext */ "../../../../LiveIde/classes/ClientContext.ts");
const Params_1 = __webpack_require__(/*! ../../classes/Params */ "../../../../LiveIde/classes/Params.ts");
const DbpClient_1 = __webpack_require__(/*! ../../../../Apps/DatabaseProxy/Client/DbpClient */ "../../../../../Apps/DatabaseProxy/Client/DbpClient.ts");
const VueManager_1 = __webpack_require__(/*! ../../classes/VueManager */ "../../../../LiveIde/classes/VueManager.ts");
const add_paths_1 = __importDefault(__webpack_require__(/*! ../../../../Shared/WebScript/add.paths */ "../../../../../Shared/WebScript/add.paths.ts"));
// To make it accessible to client code
const win = window;
win.Objects = Extensions_Objects_Client_1.Objects;
win.TaskQueue = TaskQueue_1.TaskQueue;
const htmlEncode = (s) => {
    if (!s)
        return null;
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
        thread: (thread, full = false) => {
            if (!thread)
                return null;
            return helpers.url.full(`/t/${thread._id}`, full);
        },
        builder: (builder, full = false) => {
            if (!builder)
                return null;
            return helpers.url.full(`/b/${builder.urlName}`, full);
        },
        media: (media, full = false) => {
            if (!media)
                return null;
            return helpers.url.full(`/m/${media._id}`, full);
        },
        generator: (generator, full = false) => {
            if (!generator)
                return null;
            return helpers.url.full(`/${generator.urlName}`, full);
        },
        instance: (instance, full = false) => {
            if (!instance?.instanceID)
                return null;
            return helpers.url.full(`/instance/${instance.instanceID}`, full);
        },
        itemImage: (item) => {
            if (!item)
                return null;
            if ("text0" in item) {
                if (!item._id)
                    return `/img/empty.png`;
                return `https://img.memegenerator.net/instances/600x600/${item._id}.jpg`;
            }
            if (item.type == "builder" && item.content?.item) {
                const getImageID = (item) => {
                    const imageIDs = [];
                    Extensions_Objects_Client_1.Objects.traverse(item, (node, key, value) => {
                        if (key == "imageID")
                            imageIDs.push(value);
                    });
                    return imageIDs[0];
                };
                const imageID = getImageID(item.content.item);
                return helpers.url.image(imageID);
            }
            const imageNode = Extensions_Objects_Client_1.Objects.traverseMap(item).find((a) => a.key == "imageID");
            if (imageNode)
                return helpers.url.image(imageNode.value);
            console.log(item);
            throw new Error("Unknown item type");
        },
        image: (imageID, full = false, removeBackground = false) => {
            if (!imageID)
                return null;
            const noBg = removeBackground ? ".nobg" : "";
            return helpers.url.full(`https://img.memegenerator.net/images/${imageID}${noBg}.jpg`, full);
        },
        item: (item, full = false) => {
            if (!item)
                return null;
            if (item.builderID)
                return helpers.url.media(item, full);
            if ("text0" in item)
                return helpers.url.instance(item, full);
            if (item.format)
                return helpers.url.builder(item, full);
            if (item.displayName)
                return helpers.url.generator(item, full);
            throw new Error("Unknown item type");
        },
        full: (path, full = false) => {
            if (!path)
                return null;
            if (path.startsWith("http"))
                return path;
            if (full)
                return `https://memegenerator.net${path}`;
            return path;
        },
    },
    html: {
        getAppliedStyle: (element) => {
            // Create a temporary element to get default styles
            const tempElement = document.createElement(element.tagName);
            // Add the temporary element off-screen
            tempElement.style.position = "absolute";
            tempElement.style.left = "-9999px";
            document.body.appendChild(tempElement);
            // Get computed styles of the temporary element
            const defaultStyles = window.getComputedStyle(tempElement);
            // Get computed styles of the target element
            const computedStyles = window.getComputedStyle(element);
            // Object to store non-default styles
            const nonDefaultStyles = {};
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
(async () => {
    const client = await ClientContext_1.ClientContext.get();
    client.Vue.directive("html-raw", {
        bind(el, binding) {
            el.innerHTML = binding.value;
        },
    });
    client.Vue.directive("dim", {
        bind(el, binding) {
            // Set the opacity to 0.4 if the value is true
            if (binding.value) {
                el.style.opacity = "0.4";
            }
        },
        update(el, binding) {
            // Update the opacity whenever the value changes
            if (binding.value) {
                el.style.opacity = "0.4";
            }
            else {
                el.style.opacity = "";
            }
        },
    });
    client.Vue.directive("disable", {
        bind(el, binding) {
            // Set the opacity to 0.4 if the value is true
            if (binding.value) {
                el.style.opacity = "0.4";
                el.style.pointerEvents = "none";
            }
        },
        update(el, binding) {
            // Update the opacity whenever the value changes
            if (binding.value) {
                el.style.opacity = "0.4";
                el.style.pointerEvents = "none";
            }
            else {
                el.style.filter = "";
                el.style.opacity = "";
                el.style.pointerEvents = "";
            }
        },
    });
    await client.compileAll();
    let ideVueApp = null;
    const isLocalHost = window.location.hostname == "localhost";
    const dbpHost = `https://db.memegenerator.net`;
    const dbp = (await DbpClient_1.DatabaseProxy.new(`${dbpHost}/MemeGenerator`));
    const getNewParams = async () => {
        return (await Params_1.Params.new(() => ideVueApp, client.config.params, window.location.pathname));
    };
    const params = await getNewParams();
    const vueManager = await VueManager_1.VueManager.new(client);
    ideVueApp = new client.Vue({
        data: {
            // MemeGenerator
            builders: {
                all: {},
                mainMenu: {},
            },
            // General
            state: null,
            vm: vueManager,
            client,
            dbp,
            analytics: await AnalyticsTracker_1.AnalyticsTracker.new(),
            params: params,
            url: helpers.url,
            html: helpers.html,
            comps: client.Vue.ref(client.comps),
            compsDic: {},
            compNames: [],
            templates: client.templates,
            isLoading: 0,
            error: null,
            loadingImageUrl: "https://cdnjs.cloudflare.com/ajax/libs/lightbox2/2.11.3/images/loading.gif",
            key1: 1,
            _uniqueClientID: 1,
            isAdmin: false,
        },
        async mounted() {
            await this.init();
        },
        methods: {
            async init() {
                const self = this;
                self.compsDic = client.comps.toMap((c) => c.name.hashCode());
                self.compNames = client.comps.map((c) => c.name);
                await self.ensureBuilders();
                self.isAdmin = window.location.hostname == "localhost";
                document.addEventListener("scroll", () => {
                    self.$emit("scroll");
                });
            },
            async getBuilder(urlNameOrID) {
                const self = this;
                await self.ensureBuilders();
                if (typeof urlNameOrID == "string") {
                    return Object.values(ideVueApp.builders.all).find((b) => b.urlName == urlNameOrID);
                }
                if (typeof urlNameOrID == "number") {
                    return self.builders.all[urlNameOrID];
                }
                throw new Error("Invalid builder ID");
            },
            async ensureBuilders() {
                const self = this;
                if (!self.builders?.length) {
                    const allBuilders = await self.dbp.builders.select.all();
                    self.builders.mainMenu = allBuilders.filter((b) => b.visible?.mainMenu);
                    self.builders.all = allBuilders.toMap((b) => b._id);
                }
            },
            getBuilderComponentName(builder) {
                if (!builder)
                    return null;
                return `e-format-${builder.format.replace(/\./g, "-")}`;
            },
            async mediaToTemp(media) {
                const self = this;
                const builder = await self.getBuilder(media.builderID);
                let temp = self.builderSourceToTemplate(builder.format, builder.source);
                temp = self.applyMediaToTemplate(media, temp);
                return temp;
            },
            builderSourceToTemplate(format, source) {
                const self = this;
                if (!source)
                    return null;
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
                    };
                    const hasSubgrid =  true || 0;
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
                                };
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
                    }
                    else {
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
                    const getNewItem = (sourceItem) => {
                        let item = {
                            id: self.getUniqueClientID(),
                            type: sourceItem.type,
                            visible: true,
                            editable: sourceItem.editable || true,
                        };
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
                    };
                    for (const item of source.items) {
                        temp.items.push(getNewItem(item));
                    }
                    return temp;
                }
                throw new Error("Unknown builder source type");
            },
            applyMediaToTemplate(media, temp) {
                if (!media || !temp)
                    return null;
                if (media.mediaGenerator)
                    temp = Extensions_Objects_Client_1.Objects.deepMerge(temp, media.mediaGenerator.content.item);
                temp = Extensions_Objects_Client_1.Objects.deepMerge(temp, media.content.item);
                return temp;
            },
            getComponent(uidOrName) {
                const uid = typeof uidOrName == "number" ? uidOrName : null;
                let name = typeof uidOrName == "string" ? uidOrName : null;
                if (name)
                    name = name.replace(/-/g, ".");
                if (!uid && !name)
                    return null;
                if (uid) {
                    const vue = vueManager.getVue(uid);
                    if (!vue)
                        return null;
                    const compName = vue.$data._.comp.name;
                    if (!compName)
                        return null;
                    const comp = this.compsDic[compName.hashCode()];
                    return comp;
                }
                if (name) {
                    const comp = this.compsDic[name.hashCode()];
                    return comp;
                }
            },
            isComponentName(name) {
                if (!name)
                    return false;
                const self = this;
                return !!self.compsDic[name.hashCode()];
            },
            getElementsFromViewNode(node) {
                if (!node)
                    return [];
                return document.querySelectorAll(`[path="${node[1].path}"]`);
            },
            getViewChildNodes(node) {
                if (!node[1])
                    return [];
                if (typeof node[1] != "object")
                    return [];
                let children = Object.entries(node[1]);
                children = children.filter((c) => !this.isAttributeName(c[0]));
                return children;
            },
            addPaths(compName, dom) {
                return (0, add_paths_1.default)(this, compName, dom);
            },
            ideWatch(uid, name) {
                const ideWatches = this.ideWatches;
                const key = `${uid}-${name}`;
                if (ideWatches[key])
                    return;
                ideWatches[key] = { uid, name };
            },
            isAttributeName(name) {
                const self = this;
                return client.isAttributeName(self.compNames, name);
            },
            getDescendants(vue, filter) {
                if (typeof filter == "string") {
                    const compName = filter;
                    filter = (vue) => vue.$data._?.comp.name == compName;
                }
                const vues = [];
                for (const child of vue.$children) {
                    if (filter(child))
                        vues.push(child);
                    vues.push(...this.getDescendants(child, filter));
                }
                return vues;
            },
            async navigateTo(item) {
                const url = typeof item == "string" ? item : this.itemToUrl(item);
                const self = this;
                self.error = null;
                window.history.pushState({}, "", url);
                await this.refresh();
            },
            async notifyNavigateTo(item) {
                const self = this;
                const url = this.itemToUrl(item);
                const item2 = url?.startsWith("/m/")
                    ? await self.mediaToTemp(item)
                    : item;
                const imageUrl = helpers.url.itemImage(item2);
                window.alertify
                    .message(`<a href="${url}" onclick="ideVueApp.navigateTo(this.href); return false;" class="clickable"><img src="${imageUrl}" /></a><div class="opacity-50 text-center"></div>`)
                    .delay(0);
            },
            itemToUrl(item) {
                if (typeof item == "string")
                    return item;
                if (item.instanceID)
                    return helpers.url.instance(item);
                if (item.threadID)
                    return helpers.url.thread({ _id: item.threadID });
                if (item.builderID && item.content)
                    return helpers.url.media(item);
                throw new Error("Unknown item type");
            },
            notify(componentName, item) {
                const self = this;
                self.$emit("notify", { componentName, item });
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
            async getMoreInstances(pageIndex) {
                const self = this;
                return await self.dbp.instances.select.popular("en", pageIndex, self.params.urlName);
            },
            textToHtml(text, options = {}) {
                if (!text)
                    return null;
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
                    s = s.replace(/^(.*?<br \/>)/g, `<div class='${options.firstLine}'>$1</div>`);
                }
                return s;
            },
            async refresh() {
                const self = this;
                const newParams = (await getNewParams());
                for (const key in newParams) {
                    if ("value" in newParams[key])
                        self.params[key] = newParams[key].value;
                }
                //(this as any).key1++;
                window.scrollTo({ top: 0, behavior: "smooth" });
            },
            async refreshComponents() {
                const self = this;
                self.key1++;
                await self.$nextTick();
                await self.state.restoreState();
            },
            instanceToGenerator(instance) {
                let gen = Extensions_Objects_Client_1.Objects.json.parse(JSON.stringify(instance));
                gen._id = gen.generatorID;
                return gen;
            },
            getInstanceText(instance) {
                if (!instance)
                    return null;
                return [instance.text0, instance.text1].filter((a) => a).join(", ");
            },
            getMediaText(media) {
                return null;
            },
            setDocumentTitle(title) {
                document.title = [title, "Meme Generator"].filter((a) => a).join(" - ");
            },
            getKey(item) {
                if (!item)
                    return null;
                if (item._id)
                    return item._id;
                if (item._uid)
                    return item._uid;
                return item;
            },
            getRandomStanza(poem) {
                if (!poem?.length)
                    return null;
                const count = poem.length;
                const index = Math.floor(Math.random() * count);
                return poem[index];
            },
            getWorkspaceStyle() {
                const style = {};
                if (!this.isDevEnv()) {
                    style.display = "none";
                }
                return style;
            },
            isDevEnv() {
                return window.location.hostname == "localhost";
            },
            visualizedYaml(obj) {
                let yaml = window.jsyaml.dump(obj);
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
            async uploadFile(file) {
                const self = this;
                const imageUrl = await this.getImageUrlFromDataTransferFile(file);
                const s = [];
                s.push(`<img src='${imageUrl}' />`);
                s.push("<h3 class='text-center'>uploading..</h3>");
                s.push(`<div class='text-center'><img src='${self.$data.loadingImageUrl}'></img></div>`);
                const msg = client.alertify.message(s.join("")).delay(0);
                return new Promise(async (resolve, reject) => {
                    let url = "https://img.memegenerator.net/upload";
                    var xhr = new XMLHttpRequest();
                    var formData = new FormData();
                    xhr.open("POST", url, true);
                    xhr.addEventListener("readystatechange", async function (e) {
                        if (xhr.readyState == 4 && xhr.status == 200) {
                            const image = Extensions_Objects_Client_1.Objects.json.parse(xhr.responseText);
                            // Download the image from the server
                            // this also takes some time, and we should hold the loading indicator
                            await self.downloadImage(image._id);
                            msg.dismiss();
                            resolve(image);
                        }
                        else if (xhr.readyState == 4 && xhr.status != 200) {
                            msg.dismiss();
                            reject(xhr.responseText);
                        }
                    });
                    formData.append("image", file);
                    xhr.send(formData);
                });
            },
            async getImageUrlFromDataTransferFile(file) {
                // fileDropEvent.preventDefault();
                // const files = fileDropEvent.dataTransfer.files;
                // const imageUrls = [];
                function readFileAsDataURL(file) {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = function (event) {
                            resolve(event.target.result);
                        };
                        reader.onerror = function (event) {
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
            async downloadImage(imageIdOrUrl) {
                const self = this;
                const imageUrl = typeof imageIdOrUrl === "string"
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
            getIcon(item) {
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
                };
                if (item.type)
                    return stateItemIcons[item.type] || "❔";
                return "❔";
            },
            getUniqueClientID() {
                const self = this;
                return self.$data._uniqueClientID++;
            },
            getRandomUniqueID() {
                // Fallback for browsers without crypto.getRandomValues support
                return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
                    const random = (Math.random() * 16) | 0;
                    const value = char === "x" ? random : (random & 0x3) | 0x8;
                    return value.toString(16);
                });
            },
            async wait(condition, timeout = 10000) {
                // If no condition is provided, just wait the timeout
                if (typeof condition == "number") {
                    return new Promise((resolve, reject) => {
                        setTimeout(resolve, condition);
                    });
                }
                // Wait for a condition to be true
                const startedAt = Date.now();
                const tryInterval = 100;
                return new Promise(async (resolve, reject) => {
                    const tryAgain = async () => {
                        if (Date.now() - startedAt > timeout)
                            return reject();
                        if (await condition()) {
                            resolve();
                        }
                        else {
                            setTimeout(tryAgain, tryInterval);
                        }
                    };
                    tryAgain();
                });
            },
            scrollIntoView(element) {
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
    ideVueApp.state = await StateTracker_1.StateTracker.new(() => ideVueApp, vueManager, client);
    ideVueApp.$mount("#app");
    window.addEventListener("popstate", async function (event) {
        await ideVueApp.refresh();
    });
    window.ideVueApp = ideVueApp;
})();


/***/ }),

/***/ "../../../../LiveIde/classes/AnalyticsTracker.ts":
/*!*******************************************************!*\
  !*** ../../../../LiveIde/classes/AnalyticsTracker.ts ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AnalyticsTracker = void 0;
class AnalyticsTracker {
    isPaused = false;
    trackInterval = 100;
    timeOnSite = 0;
    constructor() {
        // If the user is not looking at the page, pause tracking
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                this.isPaused = false;
            }
            else {
                this.isPaused = true;
            }
        });
        // Send a beacon when the user closes the website
        window.addEventListener("beforeunload", (event) => {
            const data = {
                timeOnSite: this.timeOnSite,
            };
            // Create and send a beacon
            navigator.sendBeacon("/analytics", JSON.stringify(data));
        });
        this.trackTick();
    }
    static async new() {
        return new AnalyticsTracker();
    }
    async trackTick() {
        if (!this.isPaused)
            await this.track();
        setTimeout(this.trackTick.bind(this), this.trackInterval);
    }
    async track() {
        this.timeOnSite += this.trackInterval;
    }
}
exports.AnalyticsTracker = AnalyticsTracker;


/***/ }),

/***/ "../../../../LiveIde/classes/ClientContext.ts":
/*!****************************************************!*\
  !*** ../../../../LiveIde/classes/ClientContext.ts ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ClientContext = void 0;
const Lock_1 = __webpack_require__(/*! ../../../Shared/Lock */ "../../../../../Shared/Lock.ts");
const to_template_1 = __importDefault(__webpack_require__(/*! ../../../Shared/WebScript/to.template */ "../../../../../Shared/WebScript/to.template.ts"));
const is_attribute_name_1 = __importDefault(__webpack_require__(/*! ../../../Shared/WebScript/is.attribute.name */ "../../../../../Shared/WebScript/is.attribute.name.ts"));
const ComponentManager_1 = __webpack_require__(/*! ./ComponentManager */ "../../../../LiveIde/classes/ComponentManager.ts");
const ClientDatabase_1 = __webpack_require__(/*! ./ClientDatabase */ "../../../../LiveIde/classes/ClientDatabase.ts");
const isDevEnv = window.location.hostname == "localhost";
class ClientContext {
    // #region Globals
    static async get() {
        const lock = (window._clientContextLock ||
            (window._clientContextLock = new Lock_1.Lock()));
        await lock.acquire();
        try {
            return (window._clientContext ||
                (window._clientContext =
                    await ClientContext.new()));
        }
        finally {
            lock.release();
        }
    }
    static _fetch;
    // #endregion
    db;
    componentManager;
    get comps() {
        return this.componentManager.comps;
    }
    Handlebars;
    Vue;
    templates;
    config;
    helpers;
    compilation;
    constructor() { }
    static async new() {
        const context = new ClientContext();
        await context.init();
        return context;
    }
    async init() {
        ClientContext._fetch = window.fetch.bind(null);
        window.fetch = ClientContext.fetch;
        this.db = await ClientDatabase_1.ClientDatabase.new("IDE", {
            ModifiedItems: ["key", "modifiedAt", "item"],
        });
        this.componentManager = await ComponentManager_1.ComponentManager.get();
        this.templates = {};
        this.config = {};
        this.helpers = window.helpers;
        this.templates = window.templates;
        this.config = window.config;
        this.Handlebars = window.Handlebars;
        this.Vue = window.Vue;
        this.compilation = {};
        this.compilation.context = {
            helpers: this.helpers,
            isAttributeName: (name) => this.isAttributeName(this.comps.map((c) => c.name), name),
            includeAttribute: (name) => {
                return true;
            },
            postProcessAttribute: (attr) => {
                attr = [...attr];
                attr[0] = attr[0].replace(/\bon_/g, "@");
                return attr;
            },
            toTemplate: (...args) => {
                return to_template_1.default.apply(null, args);
            },
        };
        for (const helper of Object.entries(this.helpers || {})) {
            const func = eval(helper[1].replace(/: any/g, "").replace(/: string/g, ""));
            this.Handlebars.registerHelper(helper[0], (...args) => {
                return func(this.compilation.context, ...args);
            });
        }
    }
    async compileAll(filter = (c) => true) {
        for (const comp of this.comps.filter(filter)) {
            await comp.compile();
        }
    }
    async compileApp() {
        const isIdeComponent = (c) => ["ui", "ide"].some((p) => c.name.startsWith(`${p}.`));
        await this.compileAll((c) => !isIdeComponent(c));
    }
    async reloadComponentsFromServer() {
        await this.componentManager.reloadComponentsFromServer();
        await this.compileAll((c) => !["app"].includes(c.name));
    }
    isAttributeName(componentNames, name) {
        return (0, is_attribute_name_1.default)(componentNames, name);
    }
    async pugToHtml(pug) {
        if (!isDevEnv)
            return null;
        const url = `/pug`;
        const item = await (await fetch(url, { method: "post", body: pug })).text();
        return item;
    }
    async updateComponent(comp) {
        if (!isDevEnv)
            return;
        const url = `/component/update`;
        await fetch(url, { method: "post", body: JSON.stringify(comp) });
    }
    static async fetch(...args) {
        try {
            const result = await ClientContext._fetch(...args);
            if (result.status < 500)
                return result;
            const text = await result.text();
            throw new Error(text);
        }
        catch (ex) {
            const url = args[0];
            console.error(`Error fetching ${url}`);
            console.error(ex);
            if (ex.message.includes("You are not authorized")) {
                ClientContext.alertify.error(`<h3>${ex.message}</h3>`);
                return;
            }
            //if (window.location.hostname == "localhost") {
            if (!ex.message.includes("Object reference not set to an instance of an object")) {
                // ClientContext.alertify
                //   .error(`<h3>${url}</h3><pre>${ex.message}</pre>`)
                //   .delay(0);
            }
            //}
            // Try again
            // Wait a bit
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return await ClientContext.fetch(...args);
        }
    }
    static getStringHashCode(str) {
        let hash = 0;
        if (str.length === 0) {
            return hash;
        }
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }
    static get alertify() {
        return window.alertify;
    }
    get alertify() {
        return ClientContext.alertify;
    }
}
exports.ClientContext = ClientContext;


/***/ }),

/***/ "../../../../LiveIde/classes/ClientDatabase.ts":
/*!*****************************************************!*\
  !*** ../../../../LiveIde/classes/ClientDatabase.ts ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ClientDatabase = void 0;
const Dexie = window.Dexie;
class ClientDatabase {
    db;
    // const collections = {
    //   ComponentClasses: ["_id", "name", "_item"],
    //   Cache: ["key", "value"],
    // };
    constructor(dbName, collections) {
        this.db = new Dexie(dbName);
        this.db
            .version(1)
            .stores(Object.fromEntries(Object.entries(collections).map(([name, keys]) => [
            name,
            keys.join(","),
        ])));
    }
    static async new(dbName, collections) {
        const db = new ClientDatabase(dbName, collections);
        return db;
    }
    async pop(collection) {
        const item = await this.db[collection].toCollection().first();
        if (!item)
            return null;
        await this.db[collection].delete(item.key);
        return item;
    }
    async filter(collection, filter) {
        return await this.db[collection].filter(filter).toArray();
    }
    async find(collection, filter) {
        return (await this.filter(collection, filter))[0];
    }
    async upsert(collection, item) {
        await this.db[collection].put(item);
    }
    async upsertMany(collection, items) {
        await this.db[collection].bulkPut(items);
    }
    async delete(collection, key) {
        await this.db[collection].delete(key);
    }
}
exports.ClientDatabase = ClientDatabase;


/***/ }),

/***/ "../../../../LiveIde/classes/Component.ts":
/*!************************************************!*\
  !*** ../../../../LiveIde/classes/Component.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Component = void 0;
const ClientContext_1 = __webpack_require__(/*! ./ClientContext */ "../../../../LiveIde/classes/ClientContext.ts");
String.prototype.kebabize = function () {
    return this.replace(/\./g, "-").toLowerCase();
};
class Component {
    name;
    path;
    source;
    isCompiled;
    constructor(obj) {
        this.name = obj.name;
        this.path = obj.path;
        this.source = obj.source;
        this.isCompiled = false;
        if (this.source)
            this.source.name = this.name.replace(/\./g, "-");
    }
    async compile() {
        if (this.isCompiled)
            return;
        const client = await ClientContext_1.ClientContext.get();
        console.groupCollapsed(this.name);
        console.log(this);
        let json = client.Handlebars.compile(client.templates.vue)(this.source);
        try {
            //console.log(json);
            const vueOptions = eval(`(${json})`);
            console.log(vueOptions);
            const vueName = Component.toVueName(this.name);
            if (this.source) {
                if (this.source.template) {
                    let html = this.source.template;
                    html = html.replace(/\bon_/g, "@");
                    vueOptions.template = html;
                }
                else {
                    const pug = vueOptions.template;
                    let html = (await client.pugToHtml(pug)) || "";
                    html = html.replace(/\bon_/g, "@");
                    vueOptions.template = html;
                    this.source.template = html;
                    client.updateComponent(this);
                }
            }
            client.Vue.component(vueName, vueOptions);
            this.isCompiled = true;
        }
        catch (ex) {
            debugger;
            throw ex;
        }
        console.groupEnd();
    }
    static toVueName(name) {
        return name.kebabize().replace(/base-/g, "");
    }
}
exports.Component = Component;


/***/ }),

/***/ "../../../../LiveIde/classes/ComponentManager.ts":
/*!*******************************************************!*\
  !*** ../../../../LiveIde/classes/ComponentManager.ts ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ComponentManager = void 0;
__webpack_require__(/*! ../../../Shared/Extensions */ "../../../../../Shared/Extensions.ts");
const Lock_1 = __webpack_require__(/*! ../../../Shared/Lock */ "../../../../../Shared/Lock.ts");
const DataWatcher_1 = __webpack_require__(/*! ../../../Shared/DataWatcher */ "../../../../../Shared/DataWatcher.ts");
const Component_1 = __webpack_require__(/*! ./Component */ "../../../../LiveIde/classes/Component.ts");
const ClientContext_1 = __webpack_require__(/*! ./ClientContext */ "../../../../LiveIde/classes/ClientContext.ts");
class ComponentManager {
    // #region Globals
    static async get() {
        const lock = (window._componentManagerLock ||
            (window._componentManagerLock = new Lock_1.Lock()));
        await lock.acquire();
        try {
            return (window._componentManager ||
                (window._componentManager =
                    await ComponentManager.new()));
        }
        finally {
            lock.release();
        }
    }
    // #endregion
    comps = [];
    watchers = [];
    constructor() { }
    static async new() {
        const manager = new ComponentManager();
        await manager.init();
        return manager;
    }
    async init(options = {}) {
        const url = options.onlyChanged ? "/changed/components" : "/components";
        if (window.location.hostname == "localhost") {
            const newComps = (await (await fetch(url)).json()).map((c) => new Component_1.Component(c));
            for (const newComp of newComps) {
                const index = this.comps.findIndex((c) => c.name == newComp.name);
                if (index != -1)
                    this.comps.removeAt(index);
            }
            this.comps.add(newComps);
        }
        else {
            this.comps = window.components.map((c) => new Component_1.Component(c));
        }
        const watchers = await Promise.all(this.comps.map((c) => DataWatcher_1.DataWatcher.new(() => c, this.onComponentChanged.bind(this))));
        this.watchers.push(...watchers);
        this.saveModifiedItems();
    }
    async saveModifiedItems() {
        const client = await ClientContext_1.ClientContext.get();
        // Item needs to be not modified for this time to be saved
        // This is to throtte typing etc
        // This can be a bit longer time because we're saving the changed in IndexedDB
        // So if the user closes the browser, the changes will be saved next time
        const delay = 1000 * 1;
        let modifiedItem;
        while ((modifiedItem = await client.db.find("ModifiedItems", (item) => item.modifiedAt > Date.now() - delay))) {
            await client.db.delete("ModifiedItems", modifiedItem.key);
            await client.updateComponent(modifiedItem.item);
        }
        setTimeout(this.saveModifiedItems.bind(this), 400);
    }
    async onComponentChanged(newComp) {
        const client = await ClientContext_1.ClientContext.get();
        client.db.upsert("ModifiedItems", {
            key: newComp.name,
            modifiedAt: Date.now(),
            item: newComp,
        });
    }
    async reloadComponentsFromServer() {
        await this.init({ onlyChanged: true });
    }
}
exports.ComponentManager = ComponentManager;


/***/ }),

/***/ "../../../../LiveIde/classes/Params.ts":
/*!*********************************************!*\
  !*** ../../../../LiveIde/classes/Params.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Params = void 0;
const Vue = window.Vue;
class Params {
    getRootVue;
    _config;
    _items = [];
    constructor(getRootVue, _config) {
        this.getRootVue = getRootVue;
        this._config = _config;
    }
    static async new(getRootVue, config, url) {
        const params = new Params(getRootVue, config);
        await params.init();
        await params.refresh(url);
        return params;
    }
    async init() {
        for (const param of Object.entries(this._config.params)) {
            const paramConf = param[1];
            const get = eval(`(${paramConf.get})`);
            const ref = Vue.ref({ value: null });
            const paramItem = {
                name: param[0],
                get,
                ref,
            };
            this._items.push(paramItem);
            this[paramItem.name] = paramItem.ref;
            const rootVue = this.getRootVue();
        }
    }
    async refresh(url) {
        for (const item of this._items) {
            item.ref.value = await item.get.apply(this, [url]);
        }
    }
}
exports.Params = Params;


/***/ }),

/***/ "../../../../LiveIde/classes/StateTracker.ts":
/*!***************************************************!*\
  !*** ../../../../LiveIde/classes/StateTracker.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StateTracker = void 0;
__webpack_require__(/*! ../../../Shared/Extensions */ "../../../../../Shared/Extensions.ts");
const Extensions_Objects_Client_1 = __webpack_require__(/*! ../../../Shared/Extensions.Objects.Client */ "../../../../../Shared/Extensions.Objects.Client.ts");
const VueHelper_1 = __webpack_require__(/*! ./VueHelper */ "../../../../LiveIde/classes/VueHelper.ts");
class StateTracker {
    getApp;
    vm;
    client;
    static _nextID = 1;
    static _maxItems = 100;
    isPaused = 0;
    refChanges = new Map();
    methods = {
        pause: {},
    };
    constructor(getApp, vm, client) {
        this.getApp = getApp;
        this.vm = vm;
        this.client = client;
    }
    static new(app, vueManager, client) {
        const st = new StateTracker(app, vueManager, client);
        return st;
    }
    track(vue, type, key, newValue, oldValue) {
        if (this.isPaused)
            return;
        const comp = this.getApp().getComponent(vue._uid);
        if (!comp)
            return;
        //if (!comp.source.config?.track?.state) return;
        const isEvent = type == "e";
        newValue = isEvent ? newValue : Extensions_Objects_Client_1.Objects.clone(newValue);
        oldValue = isEvent ? oldValue : Extensions_Objects_Client_1.Objects.clone(oldValue);
        const item = {
            id: StateTracker._nextID++,
            dt: Date.now(),
            uid: vue._uid,
            type,
            key,
            newValue,
            oldValue,
        };
        this.addItem(item);
    }
    async apply(uid, change) {
        this.pause();
        const vue = this.vm.getVue(uid);
        vue[change.key] = change.newValue;
        await vue.$nextTick();
        this.resume();
    }
    // Sometimes when refreshing keys in the app, the vue components are recreated
    // and lose their state.
    // This method restores the state from the state tracker.
    async restoreState() {
        this.pause();
        const refKeys = this.vm.getRefKeys();
        const vuesByRef = VueHelper_1.VueHelper.getVuesByRef(this.getApp());
        for (const refKey of refKeys) {
            const vues = vuesByRef.get(refKey) || [];
            console.group(refKey);
            const vueChanges = this.getRefChanges(refKey);
            // For all vues that have this ref
            for (const vue of vues) {
                // Find the last change for each key
                const lastChanges = vueChanges.reduce((acc, cur) => {
                    acc[cur.key] = cur;
                    return acc;
                }, {});
                // Apply the last change for each key
                for (const key in lastChanges) {
                    const change = lastChanges[key];
                    if (change.type != "d")
                        continue;
                    console.log(key, change.newValue);
                    vue.$set(vue, key, change.newValue);
                }
            }
            console.groupEnd();
        }
        this.vm.updateDataVariableUIDs(this.getApp());
        await this.getApp().$nextTick();
        this.resume();
    }
    addItem(item) {
        const isState = item.type == "p" || item.type == "d";
        const isMethod = item.type == "m";
        const vueItems = this.getRefChanges(item.uid);
        // Create an initial empty item
        if (isState && item.newValue && !item.oldValue) {
            const prevItemOfThisKey = [...vueItems]
                .reverse()
                .find((existingItem) => existingItem.key == item.key);
            if (!prevItemOfThisKey) {
                const emptyItem = Extensions_Objects_Client_1.Objects.json.parse(JSON.stringify(item));
                emptyItem.id = StateTracker._nextID++;
                emptyItem.dt = Date.now();
                emptyItem.newValue = emptyItem.oldValue;
                this.addItem(emptyItem);
            }
        }
        // Group typing changes into one item
        if (vueItems.length) {
            const lastItem = vueItems.last();
            if (this.isGroupable(item, lastItem)) {
                item.oldValue = lastItem.oldValue;
                vueItems.pop();
            }
        }
        this.getRefChanges(item.uid).push(item);
        if (vueItems.length > StateTracker._maxItems)
            vueItems.shift();
        this.getApp().$emit("state-changed", item);
    }
    isGroupable(newItem, prevItem) {
        const timePassed = newItem.dt - prevItem.dt;
        if (timePassed > 1000)
            return false;
        if (newItem.type != "p" && newItem.type != "d")
            return false;
        if (!prevItem.newValue && !prevItem.oldValue)
            return false;
        if (newItem.key != prevItem.key)
            return false;
        return true;
    }
    getRefChanges(refKeyOrUID) {
        const refKey = typeof refKeyOrUID == "string"
            ? refKeyOrUID
            : this.vm.getRefKey(refKeyOrUID);
        if (!refKey)
            return [];
        if (!this.refChanges.has(refKey)) {
            this.refChanges.set(refKey, []);
            console.log("new ref", refKey);
        }
        return this.refChanges.get(refKey) || [];
    }
    pause() {
        this.isPaused++;
    }
    resume() {
        this.isPaused--;
    }
    clear() {
        this.refChanges.clear();
    }
}
exports.StateTracker = StateTracker;


/***/ }),

/***/ "../../../../LiveIde/classes/VueHelper.ts":
/*!************************************************!*\
  !*** ../../../../LiveIde/classes/VueHelper.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VueHelper = void 0;
class VueHelper {
    static getVuesByRef(rootVue) {
        const map = new Map();
        VueHelper.traverseVue(rootVue, (vue) => {
            for (const refKey in vue.$refs) {
                if (!map.has(refKey)) {
                    map.set(refKey, []);
                }
                map.get(refKey)?.push(vue.$refs[refKey]);
            }
        });
        return map;
    }
    static traverseVue(vue, callback) {
        callback(vue);
        if (vue.$children) {
            vue.$children.forEach((c) => VueHelper.traverseVue(c, callback));
        }
    }
    static getVuePath(vue) {
        const path = [];
        let currentVue = vue;
        while (currentVue) {
            const index = VueHelper.getVueChildIndex(currentVue);
            path.push(index);
            currentVue = currentVue.$parent;
        }
        return path.reverse();
    }
    static getVueChildIndex(vue) {
        const parent = vue.$parent;
        if (!parent)
            return null;
        const index = parent.$children.findIndex((c) => c._uid == vue._uid);
        return index;
    }
}
exports.VueHelper = VueHelper;


/***/ }),

/***/ "../../../../LiveIde/classes/VueManager.ts":
/*!*************************************************!*\
  !*** ../../../../LiveIde/classes/VueManager.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VueManager = void 0;
__webpack_require__(/*! ../../../Shared/Extensions */ "../../../../../Shared/Extensions.ts");
const TwoWayMap_1 = __webpack_require__(/*! ../../../Shared/TwoWayMap */ "../../../../../Shared/TwoWayMap.ts");
const VueHelper_1 = __webpack_require__(/*! ./VueHelper */ "../../../../LiveIde/classes/VueHelper.ts");
class VueManager {
    client;
    vues = {};
    vuesCount = 0;
    // Tracking by uid or vue tree path are unreliable because vue recreates components
    // We use $refs to track components
    // Any ref that starts with a capital letter is a global reference
    vueRefsToUIDs = new TwoWayMap_1.TwoWayMap();
    constructor(client) {
        this.client = client;
    }
    static async new(client) {
        const vm = new VueManager(client);
        return vm;
    }
    /** Since vue UIDs might have changed, if anyone keeps a "..UID" reference
     *  (hoveredVueUID, selectedVueUID, etc) we update them.
     */
    updateDataVariableUIDs(vue) {
        VueHelper_1.VueHelper.traverseVue(vue, (vue) => {
            const keys = Object.keys(vue.$data).filter((k) => k.endsWith("UID"));
            for (const key of keys) {
                let uid = vue.$data[key];
                uid = this.toRecentVueUID(uid);
                vue.$data[key] = uid;
            }
            const arrayKeys = Object.keys(vue.$data).filter((k) => k.endsWith("UIDs"));
            for (const key of arrayKeys) {
                let uids = vue.$data[key];
                uids = uids.map((uid) => this.toRecentVueUID(uid));
                vue.$data[key].clear();
                vue.$data[key].push(...uids);
            }
        });
    }
    getVue(uid) {
        if (uid == null || uid == undefined)
            return null;
        uid = this.toRecentVueUID(uid);
        const vue = this.vues[uid];
        if (!vue)
            return null;
        return vue();
    }
    // Vues are recreated occasionally
    // Because we're tracking refs, in some cases we can map from the old vue to the new vue
    toRecentVueUID(uid) {
        const refKey = this.getRefKey(uid);
        if (!refKey)
            return uid;
        const newUIDs = this.vueRefsToUIDs.get(refKey);
        return newUIDs.last();
    }
    getComputedKeys(uid) {
        const vue = this.getVue(uid);
        if (!vue)
            return [];
        let keys = Object.keys(vue._computedWatchers || vue.$options._computedWatchers || {});
        keys = keys.filter((k) => !k.startsWith("$"));
        keys = keys.sortBy((k) => k);
        return keys;
    }
    getFields(uid) {
        const vue = this.getVue(uid);
        if (!vue)
            return [];
        let fields = [];
        fields.push(...Object.keys(vue.$data || {}).map((k) => {
            return { type: "d", key: k, newValue: vue.$data[k] };
        }));
        fields.push(...Object.keys(vue.$props || {}).map((k) => {
            return { type: "p", key: k, newValue: vue.$props[k] };
        }));
        fields.push(...this.getComputedKeys(uid).map((k) => {
            return { type: "c", key: k, newValue: vue[k] };
        }));
        fields = fields.filter((f) => !f.key.startsWith("_"));
        fields = fields.sortBy((f) => f.type, (f) => f.key);
        return fields;
    }
    getRefKey(uid) {
        return this.vueRefsToUIDs.getReverse(uid)[0];
    }
    getRefKeys() {
        return this.vueRefsToUIDs.keys();
    }
    onVueMounted(vue) {
        this.vues[vue._uid] = () => vue;
        this.vuesCount++;
        const compName = vue.$data._.comp.name;
        //if (["e.", "ui."].some((prefix) => compName.startsWith(prefix))) return;
        for (const refKey of Object.keys(vue.$refs)) {
            if (refKey[0].isLowerCase())
                continue;
            this.vueRefsToUIDs.set(refKey, vue.$refs[refKey]._uid);
        }
    }
    onVueUnmounted(vue) {
        delete this.vues[vue._uid];
        this.vuesCount--;
        for (const refKey of Object.keys(vue.$refs)) {
            if (refKey[0].isLowerCase())
                continue;
            this.vueRefsToUIDs.delete(refKey);
        }
    }
}
exports.VueManager = VueManager;


/***/ }),

/***/ "../../../../../Shared/DataWatcher.ts":
/*!********************************************!*\
  !*** ../../../../../Shared/DataWatcher.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DataWatcher = void 0;
const RepeatingTaskQueue_1 = __webpack_require__(/*! ./RepeatingTaskQueue */ "../../../../../Shared/RepeatingTaskQueue.ts");
class DefaultDataComparer {
    clone(o1) {
        if (o1 == null)
            return null;
        return JSON.parse(JSON.stringify(o1));
    }
    areEqual(o1, o2) {
        const result = JSON.stringify(o1) === JSON.stringify(o2);
        return result;
    }
}
class DataWatcher {
    getData;
    onChange;
    // #region Global
    static get _queue() {
        return window._dataWatcherQueue;
    }
    static set _queue(value) {
        window._dataWatcherQueue = value;
    }
    static get queue() {
        if (!DataWatcher._queue) {
            DataWatcher._queue = RepeatingTaskQueue_1.RepeatingTaskQueue.new();
        }
        return DataWatcher._queue;
    }
    // #endregion
    dataComparer = new DefaultDataComparer();
    data;
    constructor(getData, onChange) {
        this.getData = getData;
        this.onChange = onChange;
        this.data = this.dataComparer.clone(getData());
        DataWatcher.queue.enqueue(this.check.bind(this));
    }
    static async new(getData, onChange) {
        const watcher = new DataWatcher(getData, onChange);
        return watcher;
    }
    async check() {
        const newData = this.dataComparer.clone(this.getData());
        if (!this.dataComparer.areEqual(this.data, newData)) {
            try {
                await this.onChange(newData, this.data);
            }
            catch (ex) {
                console.error(ex);
            }
            this.data = newData;
        }
    }
}
exports.DataWatcher = DataWatcher;


/***/ }),

/***/ "../../../../../Shared/Extensions.Objects.Client.ts":
/*!**********************************************************!*\
  !*** ../../../../../Shared/Extensions.Objects.Client.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Objects = void 0;
__webpack_require__(/*! ./Extensions */ "../../../../../Shared/Extensions.ts");
const _importMainFileToImplement = "This is not supported on the client side. Import Extensions.Objects to implement";
class Objects {
    static is(obj, type) {
        return (0)._is(obj, type);
    }
    static areEqual(obj1, obj2) {
        if (typeof obj1 != "object" || typeof obj2 != "object")
            return obj1 == obj2;
        if ((obj1 == null) != (obj2 == null))
            return false;
        const keys1 = Object.keys(obj1).sortBy((s) => s);
        const keys2 = Object.keys(obj2).sortBy((s) => s);
        if (keys1.join(",") != keys2.join(","))
            return false;
        for (const key of keys1) {
            if (!Objects.areEqual(obj1[key], obj2[key]))
                return false;
        }
        return true;
    }
    static clone(obj) {
        if (obj == null || obj == undefined || typeof obj != "object")
            return obj;
        try {
            return Objects.json.parse(JSON.stringify(obj));
        }
        catch (ex) {
            console.error("Error cloning object", obj, ex);
            debugger;
            throw ex;
        }
    }
    static subtract(target, source) {
        if (Array.isArray(target) && Array.isArray(source)) {
            const result = [];
            for (let i = 0; i < target.length; i++) {
                result.push(Objects.subtract(target[i], source[i]));
            }
            return result;
        }
        const targetJson = JSON.stringify(target);
        const sourceJson = JSON.stringify(source);
        if (targetJson === sourceJson) {
            return {}; // Return an empty object if the JSON representations are identical
        }
        else {
            const result = {};
            for (const key in target) {
                if (target.hasOwnProperty(key)) {
                    if (typeof target[key] === "object" &&
                        typeof source[key] === "object") {
                        const nestedResult = Objects.subtract(target[key], source[key]); // Recursively subtract nested objects
                        if (Object.keys(nestedResult).length > 0) {
                            result[key] = nestedResult;
                        }
                    }
                    else if (target[key] !== source[key]) {
                        result[key] = target[key]; // Add the property to the result if the values are different
                    }
                }
            }
            return result;
        }
    }
    static withoutFalsyValues(obj) {
        const result = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (obj[key]) {
                    result[key] = obj[key];
                }
            }
        }
        return result;
    }
    static on(obj, key, callback) {
        if (typeof key === "function") {
            const func = key;
            const self = obj;
            self[func.name] = (...args) => {
                setTimeout(() => callback.apply(self, args), 0);
                return func.apply(self, args);
            };
            return;
        }
        const self = obj;
        const descriptor = Object.getOwnPropertyDescriptor(self, key);
        if (descriptor && (descriptor.get || descriptor.set)) {
            if (!descriptor.get)
                throw new Error("Cannot watch a non-getter property");
            if (!descriptor.set)
                throw new Error("Cannot watch a non-setter property");
            const getter = descriptor.get;
            const setter = descriptor.set;
            Object.defineProperty(self, key, {
                get: function () {
                    return getter();
                },
                set: function (newValue) {
                    setter(newValue);
                    callback(newValue);
                },
            });
            return;
        }
        let value = self[key];
        Object.defineProperty(self, key, {
            get: function () {
                return value;
            },
            set: function (newValue) {
                value = newValue;
                callback(newValue);
            },
        });
    }
    static traverse(obj, onValue, include) {
        const traverse = function (node, key, value, path, include) {
            if (!include)
                include = () => true;
            onValue(node, key, value, path);
            if (value && (Array.isArray(value) || typeof value === "object")) {
                if (Array.isArray(value)) {
                    // Path index is filtered
                    // (path filtered index)
                    let pfi = 0;
                    for (let i = 0; i < value.length; i++) {
                        if (!include(node, i.toString(), value[i]))
                            continue;
                        traverse(value, i.toString(), value[i], [...path, pfi], include);
                        pfi++;
                    }
                }
                else {
                    const keys = Object.keys(value);
                    let pfj = 0;
                    for (let j = 0; j < keys.length; j++) {
                        const k = keys[j];
                        if (!include(node, k, value[k]))
                            continue;
                        traverse(value, k, value[k], [...path, pfj], include);
                        pfj++;
                    }
                }
            }
        };
        traverse(obj, "", obj, [], include);
    }
    static traverseMap(obj) {
        const items = [];
        Objects.traverse(obj, (node, key, value, path) => {
            items.push({ node, key, value, path });
        });
        return items;
    }
    static toCamelCaseKeys(obj) {
        if (!obj)
            return obj;
        if (typeof obj !== "object")
            return obj;
        if (Array.isArray(obj))
            return obj.map(Objects.toCamelCaseKeys);
        if (obj instanceof Date)
            return obj;
        if (obj instanceof RegExp)
            return obj;
        // Traverse the object and convert all keys to camel case
        const result = {};
        for (const key of Object.keys(obj)) {
            let value = obj[key];
            value = Objects.toCamelCaseKeys(value);
            result[key.toCamelCase()] = value;
        }
        return result;
    }
    static toTitleCaseKeys(obj) {
        const result = {};
        for (const key of Object.keys(obj)) {
            let value = obj[key];
            if (value && !Array.isArray(value) && typeof value === "object")
                value = Objects.toTitleCaseKeys(value);
            result[key.toTitleCase()] = value;
        }
        return result;
    }
    static stringify(obj) {
        throw new Error(_importMainFileToImplement);
    }
    static yamlify(obj) {
        throw new Error(_importMainFileToImplement);
    }
    static parseYaml(str) {
        throw new Error(_importMainFileToImplement);
    }
    static pugToHtml(str, options) {
        throw new Error(_importMainFileToImplement);
    }
    static jsonify(obj) {
        throw new Error(_importMainFileToImplement);
    }
    static deepDiff(obj1, obj2) {
        throw new Error(_importMainFileToImplement);
    }
    static deepMerge(target, ...objects) {
        const deepMerge = (tgt, src) => {
            if (Objects.is(tgt, Array) || Objects.is(src, Array)) {
                return src.map((s, i) => deepMerge(tgt[i], s));
            }
            if (!Objects.is(tgt, Object) || !Objects.is(src, Object)) {
                return src;
            }
            const merged = Objects.clone(tgt);
            for (const key of Object.keys(src)) {
                if (key in merged) {
                    merged[key] = deepMerge(merged[key], src[key]);
                }
                else {
                    merged[key] = src[key];
                }
            }
            return merged;
        };
        let result = target;
        for (const object of objects) {
            result = deepMerge(result, object);
        }
        return result;
    }
    static map(obj, func) {
        const result = {};
        for (const key of Object.keys(obj)) {
            const [newKey, newValue] = func(key, obj[key]);
            result[newKey] = newValue;
        }
        return result;
    }
    static mapValues(obj, func) {
        return Objects.map(obj, (key, value) => [key, func(value)]);
    }
    static try(func, onCatch) {
        try {
            return func();
        }
        catch (ex) {
            onCatch(ex);
        }
    }
    static json = {
        parse: (str) => {
            try {
                if (str === null)
                    return null;
                if (str === undefined)
                    return undefined;
                if (str === "undefined")
                    return undefined;
                return JSON.parse(str);
            }
            catch (ex) {
                throw `Error parsing JSON:\n\n${JSON.stringify(str)}\n\n${ex.stack}`;
            }
        },
    };
}
exports.Objects = Objects;


/***/ }),

/***/ "../../../../../Shared/Extensions.ts":
/*!*******************************************!*\
  !*** ../../../../../Shared/Extensions.ts ***!
  \*******************************************/
/***/ (() => {


class Time {
    static units = [
        "ms",
        "s",
        "m",
        "h",
        "d",
        "w",
        "M",
        "y",
        "de",
        "ce",
    ];
    static longUnits = [
        "milliseconds",
        "seconds",
        "minutes",
        "hours",
        "days",
        "weeks",
        "months",
        "years",
        "decades",
        "centuries",
    ];
    static unitToValue = {
        ms: 1,
        s: 1000,
        m: 1000 * 60,
        h: 1000 * 60 * 60,
        d: 1000 * 60 * 60 * 24,
        w: 1000 * 60 * 60 * 24 * 7,
        M: 1000 * 60 * 60 * 24 * 30,
        y: 1000 * 60 * 60 * 24 * 30 * 365,
        decade: 1000 * 60 * 60 * 24 * 30 * 365 * 10,
        century: 1000 * 60 * 60 * 24 * 30 * 365 * 100,
    };
    static prevUnit(unit) {
        return this.units[this.units.indexOf(unit) - 1];
    }
    static nextUnit(unit) {
        return this.units[this.units.indexOf(unit) + 1];
    }
}
class Size {
    static units = [
        "b",
        "kb",
        "mb",
        "gb",
        "tb",
        "pb",
        "eb",
        "zb",
        "yb",
    ];
    static longUnits = [
        "bytes",
        "kilobytes",
        "megabytes",
        "gigabytes",
        "terabytes",
        "petabytes",
        "exabytes",
        "zettabytes",
        "yottabytes",
    ];
    static unitToValue = {
        b: 1,
        kb: 1000,
        mb: 1000 * 1000,
        gb: 1000 * 1000 * 1000,
        tb: 1000 * 1000 * 1000 * 1000,
        pb: 1000 * 1000 * 1000 * 1000 * 1000,
        eb: 1000 * 1000 * 1000 * 1000 * 1000 * 1000,
        zb: 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000,
        yb: 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000,
    };
    static prevUnit(unit) {
        return this.units[this.units.indexOf(unit) - 1];
    }
    static nextUnit(unit) {
        return this.units[this.units.indexOf(unit) + 1];
    }
}
class Percentage {
    static units = ["%"];
    static longUnits = ["percent"];
    static unitToValue = {
        "%": 100,
    };
    static prevUnit(unit) {
        return this.units[this.units.indexOf(unit) - 1];
    }
    static nextUnit(unit) {
        return this.units[this.units.indexOf(unit) + 1];
    }
}
const UnitClasses = [Time, Size, Percentage];
const color = {
    fromNumber: {
        0: "reset",
        1: "bright",
        2: "dim",
        4: "underscore",
        5: "blink",
        7: "reverse",
        8: "hidden",
        30: "black",
        31: "red",
        32: "green",
        33: "yellow",
        34: "blue",
        35: "magenta",
        36: "cyan",
        37: "white",
        40: "bgBlack",
        41: "bgRed",
        42: "bgGreen",
        43: "bgYellow",
        44: "bgBlue",
        45: "bgMagenta",
        46: "bgCyan",
        47: "bgWhite",
    },
    toNumber: {
        reset: "0",
        bright: "1",
        dim: "2",
        underscore: "4",
        blink: "5",
        reverse: "7",
        hidden: "8",
        black: "30",
        red: "31",
        green: "32",
        yellow: "33",
        blue: "34",
        magenta: "35",
        cyan: "36",
        white: "37",
        bgBlack: "40",
        bgRed: "41",
        bgGreen: "42",
        bgYellow: "43",
        bgBlue: "44",
        bgMagenta: "45",
        bgCyan: "46",
        bgWhite: "47",
    },
    toChar: {
        reset: "\x1b[0m",
        bright: "\x1b[1m",
        dim: "\x1b[2m",
        underscore: "\x1b[4m",
        blink: "\x1b[5m",
        reverse: "\x1b[7m",
        hidden: "\x1b[8m",
        black: "\x1b[30m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m",
        bgBlack: "\x1b[40m",
        bgRed: "\x1b[41m",
        bgGreen: "\x1b[42m",
        bgYellow: "\x1b[43m",
        bgBlue: "\x1b[44m",
        bgMagenta: "\x1b[45m",
        bgCyan: "\x1b[46m",
        bgWhite: "\x1b[47m",
    },
};
// #endregion
// #region Number
if (typeof Number !== "undefined") {
    // #warning This is a hack to save the _is function somewhere we can access it
    // This is needed because we can't export or import anything from Extensions.ts
    // Usage: (0)._is([obj], [type])
    // Examples:
    //   (0)._is(5, Number) // true
    //   (0)._is(5, String) // false
    //   (0)._is("5", String) // true
    //   (0)._is("5", Number) // false
    Number.prototype._is = function (obj, type) {
        switch (type) {
            case String:
                return typeof obj === "string" || obj instanceof String;
            case Number:
                return typeof obj === "number" && isFinite(obj);
            case Boolean:
                return typeof obj === "boolean";
            case Array:
                return Array.isArray(obj);
            case Object:
                return obj !== null && typeof obj === "object" && !Array.isArray(obj);
            default:
                return obj instanceof type;
        }
    };
    Number.prototype.is = function (type) {
        return (0)._is(this, type);
    };
    Number.prototype.seconds = function () {
        return this.valueOf() * 1000;
    };
    Number.prototype.minutes = function () {
        return (this.valueOf() * 60).seconds();
    };
    Number.prototype.hours = function () {
        return (this.valueOf() * 60).minutes();
    };
    Number.prototype.days = function () {
        return (this.valueOf() * 24).hours();
    };
    Number.prototype.weeks = function () {
        return (this.valueOf() * 7).days();
    };
    Number.prototype.months = function () {
        return (this.valueOf() * 30).days();
    };
    Number.prototype.years = function () {
        return (this.valueOf() * 365).days();
    };
    Number.prototype.wait = function (options = { log: false }) {
        let timer = null;
        let started = Date.now();
        if (options.log) {
            timer = setInterval(() => {
                const elapsed = started + this.valueOf() - Date.now();
                process.stdout.write(`\r`);
                process.stdout.write(`${`Waiting -`.c("gray")}${elapsed.unitifyTime()}\r`);
            }, 100);
        }
        return new Promise((resolve) => setTimeout(() => {
            if (timer) {
                clearInterval(timer);
                process.stdout.write("\r");
                process.stdout.clearLine(0);
            }
            resolve();
        }, this.valueOf()));
    };
    Number.prototype.isBetween = function (min, max, strictOrder) {
        // strictOrder: if false, max could be min and vice versa
        const value = this.valueOf();
        if (strictOrder)
            return value > min && value < max;
        return (value > min && value < max) || (value > max && value < min);
    };
    Number.prototype.isBetweenOrEq = function (min, max, strictOrder) {
        // strictOrder: if false, max could be min and vice versa
        const value = this.valueOf();
        if (strictOrder)
            return value >= min && value <= max;
        return (value >= min && value <= max) || (value >= max && value <= min);
    };
    Number.prototype.pluralize = function (plural) {
        const singular = plural.singularize();
        if (this.valueOf() === 1)
            return `${this} ${singular}`;
        return `${this} ${plural}`;
    };
    Number.prototype.unitify = function (unitClass, unit) {
        // ["m", "s", "ms"] should:
        // return "230ms" if value is < 1000
        // return "1.23s" if value is < 60000 and > 1000
        // return "1.23m" if value is > 60000
        if (!unit?.length)
            unit = unitClass.units;
        let value = this.valueOf();
        // Percent is a special case
        if (unitClass == Percentage)
            return `${Math.round(value * 100)}${`%`.c("gray")}`;
        const units = !Array.isArray(unit)
            ? [unit]
            : unit.sortByDesc((u) => unitClass.unitToValue[u]);
        if (!value)
            return `0${units.last()}`.c("gray");
        for (const u of units) {
            const currentUnitValue = unitClass.unitToValue[u];
            const nextUnitValue = unitClass.unitToValue[unitClass.nextUnit(u)];
            if (value.isBetweenOrEq(currentUnitValue, nextUnitValue)) {
                const unitValue = value / currentUnitValue;
                if (unitValue >= 10 || u == units.last()) {
                    return `${unitValue.toFixed(0)}${u.c("gray")}`;
                }
                return `${unitValue.toFixedRounded(2)}${u.c("gray")}`;
            }
        }
        if (value == 0)
            return `${value}${units.last().c("gray")}`;
        return `${value.toFixed(0)}${units.last().c("gray")}`;
    };
    Number.prototype.unitifyTime = function (unit) {
        return this.unitify(Time, unit);
    };
    Number.prototype.unitifySize = function (unit) {
        return this.unitify(Size, unit);
    };
    Number.prototype.unitifyPercent = function () {
        return this.unitify(Percentage);
        //return `${Math.round(this.valueOf() * 100)}${`%`.c("gray")}`;
    };
    Number.prototype.toProgressBar = function (barLength, ...severifyArgs) {
        const value = this.valueOf();
        if (!barLength)
            barLength = 50;
        barLength = barLength - ` 100%`.length;
        const progressLength = Math.round(value * barLength);
        const bar = "█".repeat(progressLength);
        const emptyLength = barLength - progressLength;
        const empty = emptyLength <= 0 ? "" : "█".repeat(emptyLength).c("gray");
        let s = `${bar}${empty} ${value.unitifyPercent().withoutColors()}`;
        if (severifyArgs.length)
            s = s.colorize(value.getSeverityColor(severifyArgs[0], severifyArgs[1], severifyArgs[2]));
        return s;
    };
    Number.prototype.severify = function (green, yellow, direction, value) {
        if (value === undefined)
            value = this.valueOf();
        const color = value.getSeverityColor(green, yellow, direction, true);
        let s = value.toString().colorize(color);
        if (color == "bgRed")
            s = s.colorize("white");
        return s;
    };
    Number.prototype.severifyByHttpStatus = function () {
        const value = this.valueOf();
        return value.toString().colorize(value.getHttpSeverityColor());
    };
    Number.prototype.getSeverityColor = function (green, yellow, direction, bgRed) {
        const value = this.valueOf();
        if (direction == "<") {
            if (value === null || value === undefined || Number.isNaN(value))
                return "gray";
            if (value <= green)
                return "green";
            if (value <= yellow)
                return "yellow";
            return bgRed ? "bgRed" : "red";
        }
        if (direction == ">") {
            if (value >= green)
                return "green";
            if (value >= yellow)
                return "yellow";
            return bgRed ? "bgRed" : "red";
        }
        throw new Error(`Invalid direction: ${direction}`);
    };
    Number.prototype.getHttpSeverityColor = function () {
        const value = this.valueOf();
        if (value == 404)
            return "yellow";
        return value.getSeverityColor(200, 400, "<", true);
    };
    Number.prototype.toFixedRounded = function (places) {
        const value = this.valueOf();
        let str = value.toFixed(places);
        while (str.endsWith("0"))
            str = str.slice(0, -1);
        if (str.endsWith("."))
            str = str.slice(0, -1);
        return str;
    };
    Number.prototype.roundTo = function (places) {
        return parseFloat(this.toFixed(places));
    };
    Number.prototype.getEnumName = function (enumType) {
        const value = this.valueOf();
        const keys = Object.keys(enumType);
        for (const key of keys) {
            if (enumType[key] == value)
                return key;
        }
        return "";
    };
    Number.prototype.ordinalize = function () {
        const number = this.valueOf();
        if (number === 0) {
            return "0"; // No ordinal representation for 0
        }
        const suffixes = ["th", "st", "nd", "rd"];
        const mod100 = number % 100;
        const mod10 = number % 10;
        if (mod10 === 1 && mod100 !== 11) {
            return number + "st";
        }
        else if (mod10 === 2 && mod100 !== 12) {
            return number + "nd";
        }
        else if (mod10 === 3 && mod100 !== 13) {
            return number + "rd";
        }
        else {
            return number + "th";
        }
    };
    Number.prototype.humanize = function () {
        const value = this.valueOf();
        if (value < 0)
            return `-${(-value).humanize()}`;
        if (value < 10) {
            // If no fraction, return as integer
            if (value % 1 === 0)
                return value.toString();
            return value.toFixed(2);
        }
        if (value < 1000)
            return Math.round(value).toLocaleString();
        if (value < 1000000)
            return `${(value / 1000).toLocaleString()}k`;
        if (value < 1000000000)
            return `${(value / 1000000).toLocaleString()}m`;
        return `${(value / 1000000000).toLocaleString()}b`;
    };
}
// #endregion
// #region String
if (typeof String !== "undefined") {
    String.prototype.is = function (type) {
        return (0)._is(this, type);
    };
    String.prototype.isColorCode = function () {
        return this.startsWith("\x1b[");
    };
    String.prototype.isLowerCase = function () {
        return this.toLowerCase() === this.toString();
    };
    String.prototype.pad = function (align, fillString) {
        if (!align)
            align = "left";
        if (align === "left")
            return `${fillString}${this}`;
        return `${this}${fillString}`;
    };
    // Returns the next character in the string ("abcd" => "a")
    // In case of console color codes, it returns the whole color code
    String.prototype.nextChar = function () {
        const s = this.toString();
        if (s.isColorCode()) {
            return s.slice(0, 5);
        }
        return s[0];
    };
    // "[red]ab[/reset]cdef" -> ["[red]", "a", "b", "[reset]", "c", "d", "e", "f"]
    String.prototype.getChars = function* () {
        let s = this.toString();
        while (s.length > 0) {
            const char = s.nextChar();
            yield char;
            s = s.slice(char.length);
        }
    };
    String.prototype.c = function (color) {
        return this.colorize(color);
    };
    String.prototype.colorize = function (color) {
        if (!String.prototype[color])
            return this.toString();
        return eval(`this.${color}`);
    };
    String.prototype.singularize = function () {
        if (this.endsWith("ies"))
            return this.slice(0, -3) + "y";
        if (this.endsWith("s"))
            return this.slice(0, -1);
        return this.toString();
    };
    String.prototype.pluralize = function () {
        if (this.endsWith("ay"))
            return this + "s";
        if (this.endsWith("y"))
            return this.slice(0, -1) + "ies";
        if (this.endsWith("s"))
            return this.toString();
        return this + "s";
    };
    String.prototype.antonym = function () {
        const antonyms = [
            ["up", "down"],
            ["left", "right"],
            ["top", "bottom"],
            ["start", "end"],
            ["before", "after"],
            ["above", "below"],
            ["first", "last"],
            ["front", "back"],
        ];
        for (const [a, b] of antonyms) {
            if (this === a)
                return b;
            if (this === b)
                return a;
        }
        return this.toString();
    };
    String.prototype.severify = function (green, yellow, direction) {
        const valueStr = this.toString();
        const unitClass = valueStr.getUnitClass();
        if (!unitClass) {
            const value = parseFloat(valueStr);
            const color = value.getSeverityColor(green, yellow, direction);
            return valueStr.colorize(color);
        }
        const value = valueStr.deunitify();
        const unit = valueStr.getUnit();
        const color = value.getSeverityColor(green, yellow, direction, true);
        let coloredValue = value.unitify(unitClass).withoutUnit().colorize(color);
        if (color == "bgRed")
            coloredValue = coloredValue.white;
        return `${coloredValue}${unit.c("gray")}`;
    };
    String.prototype.severifyByHttpStatus = function (statusCode, bgRed) {
        if (!statusCode)
            statusCode = this.split(" ")
                .map((s) => parseInt(s))
                .find((n) => !isNaN(n));
        if (!statusCode)
            return this.toString();
        return this.colorize(statusCode.getHttpSeverityColor());
    };
    String.prototype.deunitify = function () {
        const unitClass = this.getUnitClass();
        if (!unitClass)
            throw new Error(`No unit class found for ${this}`);
        // Percentages are special, because they are relative to 100
        if (unitClass === Percentage) {
            const value = parseFloat(this.withoutUnit());
            return value / 100;
        }
        const s = this.withoutColors();
        const unit = s.getUnit();
        const value = parseFloat(s.withoutUnit());
        return value * (unit ? unitClass.unitToValue[unit] : 1);
    };
    String.prototype.getUnit = function (options = { throw: true }) {
        let word = this.withoutColors()
            .replace(/[0-9\.]/g, "")
            .trim();
        if (word.length > 2)
            word = word.pluralize();
        // Search for the long unit name ("seconds", "bytes", "percentages")
        for (const unitClass of UnitClasses) {
            let index = unitClass.longUnits.indexOf(word);
            if (index != -1) {
                const lus = unitClass.longUnits
                    .map((lu) => lu[0])
                    .join("")
                    .toLowerCase();
                const sus = unitClass.units.join("").toLowerCase();
                if (lus == sus)
                    return unitClass.units[index];
                if (word.startsWith("month"))
                    return "M";
                return word[0];
            }
        }
        // Search for the short unit name ("s", "B", "%")
        for (const unitClass of UnitClasses) {
            let index = unitClass.units.indexOf(word);
            if (index != -1)
                return unitClass.units[index];
        }
        if (options.throw) {
            throw new Error(`No unit found for "${word}"`);
        }
        else {
            return "";
        }
    };
    String.prototype.getUnitClass = function () {
        const unit = this.getUnit({ throw: false });
        if (Time.units.includes(unit))
            return Time;
        if (Size.units.includes(unit))
            return Size;
        if (Percentage.units.includes(unit))
            return Percentage;
        return null;
    };
    String.prototype.withoutUnit = function () {
        return this.withoutColors()
            .replace(/[^0-9.-]/g, "")
            .trim();
    };
    String.prototype.padStartChars = function (maxLength, fillString) {
        if (fillString === undefined)
            fillString = " ";
        let result = this;
        while (result.getCharsCount() < maxLength) {
            result = fillString + result;
        }
        return result.toString();
    };
    String.prototype.padEndChars = function (maxLength, fillString) {
        if (fillString === undefined)
            fillString = " ";
        let result = this;
        while (result.getCharsCount() < maxLength) {
            result += fillString;
        }
        return result.toString();
    };
    // Slice a string by character count instead of by byte count
    // Copies color codes too but doesn't count them in the character count
    String.prototype.sliceChars = function (start, end) {
        if (start === undefined)
            start = 0;
        if (end === undefined)
            end = this.length;
        let result = "";
        let charCount = 0;
        for (let i = 0; i < this.length; i++) {
            const char = this[i];
            if (char === "\u001b") {
                const colorCode = this.slice(i, i + 9);
                result += colorCode;
                i += colorCode.length - 1;
                continue;
            }
            if (charCount >= start && charCount < end)
                result += char;
            charCount++;
        }
        return result;
    };
    String.prototype.alignRight = function () {
        const width = process.stdout.columns;
        const padding = " ".repeat(Math.max(width - this.length, 0));
        return `${padding}${this}`;
    };
    String.prototype.shorten = function (maxLength, ellipsis = true) {
        if (maxLength == null)
            return this.toString();
        if (ellipsis)
            maxLength -= 2;
        let s = this.toString();
        if (s.getCharsCount() > maxLength) {
            s = s.sliceChars(0, maxLength);
            if (ellipsis)
                s += "..";
        }
        return s;
    };
    String.prototype.toLength = function (length, ellipsis, align) {
        if (!align)
            align = "left";
        let s = (this || "").toString().shorten(length, ellipsis);
        if (length)
            s = s.pad(align.antonym(), " ".repeat(Math.max(0, length - s.getCharsCount())));
        return s;
    };
    String.prototype.splitOnWidth = function (width) {
        const lines = [];
        let currentLine = "";
        let colorStack = [];
        for (const char of this.getChars()) {
            if (char.isColorCode())
                colorStack.push(char);
            if (currentLine.getCharsCount() >= width) {
                // new line
                if (colorStack.length > 0)
                    // reset the color
                    currentLine += color.toChar.reset;
                lines.push(currentLine);
                currentLine = "";
                colorStack.forEach((c) => (currentLine += c));
                colorStack = [];
            }
            currentLine += char;
        }
        if (currentLine.length > 0)
            lines.push(currentLine);
        return lines;
    };
    String.prototype.trimAll = function () {
        return this.replace(/[\t\n]/g, "").trim();
    };
    // Trim double quotes from a string if they exist
    String.prototype.trimDoubleQuotes = function () {
        if (this.startsWith('"') && this.endsWith('"'))
            return this.slice(1, -1);
        return this.toString();
    };
    String.prototype.stripHtmlTags = function () {
        return (this
            // Replace <br /> with a new line
            .replace(/<br\s*[\/]?>/gi, "\n")
            // Remove HTML tags
            .replace(/(<([^>]+)>)/gi, " "));
    };
    String.prototype.decodeHtml = function () {
        return (this.replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            // Replace &#[number]; with the unicode character
            .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
            // Replace &#x[number]; with the unicode character
            .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16))));
    };
    String.prototype.getWords = function () {
        // Get the words using a regex
        return this.match(/\w+/g) || [];
    };
    String.prototype.getCaseWords = function () {
        // Split "titleCaseString" into "title case string"
        return this.replace(/([A-Z])/g, " $1").split(" ");
    };
    String.prototype.toCamelCase = function () {
        // Lowercase the first letter
        return this.charAt(0).toLowerCase() + this.slice(1);
    };
    String.prototype.toTitleCase = function () {
        // Uppercase the first letter of each word
        return this.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substring(1);
        });
    };
    String.prototype.parseJSON = function () {
        if (this == "undefined")
            return undefined;
        if (!this)
            return null;
        return JSON.parse(this.toString());
    };
    String.prototype.truncate = function (maxLength) {
        if (this.getCharsCount() <= maxLength)
            return this.toString();
        const ellipsis = "..";
        maxLength = Math.max(0, maxLength - ellipsis.length);
        // Strip the color codes from the string
        //const stripped = this.replace(/\x1b\[[0-9;]*m/g, "");
        // Truncate the string
        //return stripped.slice(0, maxLength) + ellipsis;
        // Construct a new string with the max length
        // Copy the characters from the original string
        // Include the color codes but count only the characters that are not color codes
        // Add ".." to the end of the string
        let result = "";
        let charsCount = 0;
        for (let i = 0; i < this.length; i++) {
            const char = this.charAt(i);
            result += char;
            if (char === "\x1b") {
                // Skip the color code
                while (this.charAt(i) !== "m") {
                    i++;
                    result += this.charAt(i);
                }
            }
            else {
                charsCount++;
            }
            if (charsCount >= maxLength)
                break;
        }
        // At the end of the string, add the ellipsis
        result += ellipsis;
        // At the end of the string, reset the color
        result += "\x1b[0m";
        return result;
    };
    String.prototype.getCharsCount = function () {
        return this.length - this.getColorCodesLength();
    };
    String.prototype.getColorCodesLength = function () {
        const colorCodeRegex = /\x1b\[[0-9;]*m/g; // matches all ANSI escape sequences for console color codes
        const matches = this.match(colorCodeRegex);
        return matches ? matches.join("").length : 0;
    };
    String.prototype.withoutColors = function () {
        return this.replace(/\x1b\[[0-9;]*m/g, "");
    };
    String.prototype.showColorCodes = function () {
        return this.replace(/\x1B\[/g, "\\x1B[");
    };
    String.prototype.colorsToHandleBars = function () {
        // Create a regular expression pattern to match each console color escape sequence and replace it with the corresponding handlebars-style syntax
        const pattern = /\x1B\[(\d+)m(.+?)\x1B\[(\d+)m/g;
        const result = this.replace(pattern, (match, colorCode, content) => {
            const colorName = color.fromNumber[colorCode.toNumber()];
            if (colorName) {
                return `{{#${colorName}}}${content}{{/${colorName}}}`;
            }
            else {
                return content;
            }
        });
        if (result.includes("\x1B")) {
            return result.colorsToHandleBars();
        }
        return result;
    };
    String.prototype.handlebarsColorsToHtml = function () {
        const pattern = /\{\{\#([^\{\}]*?)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
        const result = this.replace(pattern, (match, color, content) => {
            if (!color.colorToCodeNum[color])
                return content;
            return `<span class="${color}">${content.handleBarsColorsToHtml()}</span>`;
        });
        // If pattern is found, call the function recursively
        if (result.match(pattern)) {
            return result.handlebarsColorsToHtml();
        }
        return result;
    };
    String.prototype.handlebarsColorsToConsole = function () {
        // {{#red}}Hello {{#green}}World{{/green}}!{{/red}}
        // {{#red}}
        const pattern = /\{\{\#([^\{\}]*?)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
        // {{/red}}
        let result = this.replace(pattern, (match, color, content) => {
            if (!color.colorToCodeChar[color])
                return content;
            return `${color.colorToCodeChar[color]}${content.handlebarsColorsToConsole()}${color.colorToCodeChar["reset"]}`;
        });
        // If pattern is found, call the function recursively
        if (result.match(pattern)) {
            return result.handlebarsColorsToConsole();
        }
        return result;
    };
    String.prototype.colorsToHtml = function () {
        return this.colorsToHandleBars().handlebarsColorsToHtml();
    };
    String.prototype.parseColorCodes = function () {
        const escapeRegex = /\x1b\[(\d+)m/g; // matches escape sequences in the form \x1b[<number>m
        const resetCode = "\x1b[0m"; // reset code to remove all colors and styles
        return this.replace(escapeRegex, (_, code) => {
            const colorCode = {
                30: "\x1b[30m",
                31: "\x1b[31m",
                32: "\x1b[32m",
                33: "\x1b[33m",
                34: "\x1b[34m",
                35: "\x1b[35m",
                36: "\x1b[36m",
                37: "\x1b[37m", // white
            }[code];
            return colorCode ? colorCode : resetCode;
        });
    };
    String.prototype.toShortPath = function (comparePath) {
        const path = this.toString().replace(/\\/g, "/");
        const allParts = path.split("/");
        // Return the last 2 parts of the path
        const parts = allParts.slice(Math.max(allParts.length - 2, 0));
        let s = `${parts[0].yellow}${`\\`.c("gray")}${parts[1]}`;
        if (parts.length > 2) {
            s = `${s} (${parts.slice(0, -2).join("\\")})`.c("gray");
        }
        if (comparePath) {
            const compareParts = comparePath.replace(/\\/g, "/").split("/");
            const diffs = allParts.filter((part, index) => {
                return part !== compareParts[index];
            });
            if (diffs.length > 0) {
                s = `${diffs.join("\\").c("gray")}..\\${s}`;
            }
        }
        s = `${`..\\`.c("gray")}${s}`;
        return s;
    };
    // Convert a relative path to an absolute path
    // If the path is already absolute, return it as is
    // If the path is relative, convert from the current working directory
    // If the path contains ..\, resolve the path
    String.prototype.toAbsolutePath = function (path) {
        if (path.isAbsolute(this.toString()))
            return path.resolve(this.toString());
        return path.resolve(path.join(process.cwd(), this.toString()));
    };
    String.prototype.toNumber = function () {
        return parseFloat(this.withoutColors());
    };
    String.prototype.isEqualPath = function (path) {
        return this.toString().normalizePath() === path.normalizePath();
    };
    String.prototype.splitPath = function () {
        return this.toString().replace(/\\/g, "/").split("/");
    };
    String.prototype.normalizePath = function () {
        return this.toString().replace(/\//g, "\\");
    };
    // Make a string safe to use as a filename or directory name
    String.prototype.sanitizePath = function () {
        const sanitizePart = (s) => {
            if (s.length == 2 && s[1] == ":")
                return s;
            // Invalid characters in Windows filenames: \ / : * ? " < > |
            const invalidCharsRegex = /[\x00-\x1f\\\/:*?"<>|]/g;
            s = s.replace(invalidCharsRegex, "_");
            return s;
        };
        const parts = this.toString().replace(/\\/g, "/").split("/");
        const dirName = parts.slice(0, -1);
        const fileName = parts.slice(-1)[0];
        const extension = fileName.split(".").slice(-1)[0];
        const sanitized = [
            ...dirName,
            sanitizePart(fileName.split(".").slice(0, -1).join(".")),
        ].join("/") + (extension ? `.${extension}` : "");
        return sanitized;
    };
    String.prototype.findParentDir = function (dirName) {
        const parts = this.toString().normalizePath().split("\\");
        const index = parts.indexOf(dirName);
        if (index != -1)
            return parts.slice(0, index + 1).join("\\");
        throw new Error(`Could not find ${dirName} in ${this}`);
    };
    String.prototype.ipToNumber = function () {
        let parts = this.split(".");
        return (parseInt(parts[0]) * 256 * 256 * 256 +
            parseInt(parts[1]) * 256 * 256 +
            parseInt(parts[2]) * 256 +
            parseInt(parts[3]));
    };
    String.prototype.decodeBase64 = function () {
        return Buffer.from(this, "base64").toString("ascii");
    };
    String.prototype.hashCode = function () {
        const str = this.toString();
        let hash = 0;
        if (str.length === 0) {
            return hash;
        }
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    };
    // Case insensitive
    String.prototype.parseEnum = function (enumType) {
        const str = this.toString();
        // If the string is a number, return the number
        if (str.match(/^\d+$/))
            return parseInt(str);
        for (const key in enumType) {
            if (key.toLowerCase() == str.toLowerCase())
                return enumType[key];
        }
        return null;
    };
}
// #endregion
// #region Array
if (typeof Array !== "undefined") {
    Array.prototype.toMap = function (getKey, getValue) {
        if (!getValue)
            getValue = (item) => item;
        const map = {};
        this.forEach((item) => {
            map[getKey(item)] = getValue(item);
        });
        return map;
    };
    Array.prototype.contains = function (item, getItemKey) {
        if (getItemKey) {
            const key = getItemKey(item);
            return this.find((i) => getItemKey(i) == key) != null;
        }
        return this.indexOf(item) != -1;
    };
    Array.prototype.reversed = function () {
        return this.slice().reverse();
    };
    Array.prototype.removeAt = function (index) {
        this.splice(index, 1);
    };
    Array.prototype.insertAt = function (index, item, appendToEnd) {
        if (appendToEnd && index > this.length)
            index = this.length;
        this.splice(index, 0, item);
    };
    Array.prototype.removeBy = function (predicate) {
        const index = this.findIndex(predicate);
        if (index != -1)
            this.removeAt(index);
    };
    Array.prototype.removeByField = function (key, value) {
        this.removeBy((item) => item[key] == value);
    };
    Array.prototype.clear = function (stagger) {
        if (!stagger) {
            this.splice(0, this.length);
            return;
        }
        const removeOne = () => {
            if (this.length > 0) {
                this.pop();
                setTimeout(removeOne, stagger);
            }
        };
        removeOne();
    };
    Array.prototype.add = async function (items, stagger = 0) {
        if (!Array.isArray(items))
            items = [items];
        items = [...items];
        if (!stagger) {
            this.push(...items);
            return;
        }
        const addOne = async () => {
            if (items.length > 0) {
                this.push(items.shift());
                setTimeout(addOne, stagger);
            }
        };
        addOne();
    };
    Array.prototype.take = function (count) {
        return this.slice(0, count);
    };
    Array.prototype.replace = async function (getNewItems, stagger = 0, getItemKey) {
        if (getItemKey) {
            let newItems = await getNewItems();
            const processNext = async (i) => {
                if (i > Math.max(this.length, newItems.length))
                    return;
                if (this[i] && !newItems.contains(this[i], getItemKey))
                    this.removeAt(i);
                if (newItems[i] && !this.contains(newItems[i], getItemKey))
                    this.insertAt(i, newItems[i], true);
                setTimeout(() => processNext(i + 1), stagger);
            };
            processNext(0);
        }
        else {
            this.clear(stagger);
            this.add(await getNewItems(), stagger);
        }
    };
    Array.prototype.sum = function (getValue, getWeight) {
        if (!getValue)
            getValue = (item) => item;
        if (!getWeight)
            getWeight = (item) => 1;
        let sum = 0;
        for (const item of this) {
            sum += getValue(item) * getWeight(item);
        }
        return sum;
    };
    Array.prototype.min = function () {
        return Math.min.apply(null, this);
    };
    Array.prototype.max = function () {
        return Math.max.apply(null, this);
    };
    Array.prototype.average = function (getValue, getWeight) {
        if (this.length === 0) {
            return 0;
        }
        if (!getValue)
            getValue = (item) => item;
        if (!getWeight)
            getWeight = (item) => 1;
        let sum = this.map((n) => getValue(n) * getWeight(n)).sum();
        return (sum / this.length).roundTo(3);
    };
    Array.prototype.first = function () {
        return this[0];
    };
    Array.prototype.last = function () {
        return this[this.length - 1];
    };
    Array.prototype.back = function () {
        return this.slice(0, this.length - 1);
    };
    Array.prototype.skip = function (count) {
        return this.slice(count);
    };
    Array.prototype.joinColumns = function (columns, ellipsis) {
        if (!columns.length)
            return this.join(" ");
        return this.map((item, i) => {
            if (typeof item != "string")
                item = JSON.stringify(item);
            return `${(item || "").toLength(columns[i], ellipsis, "right")}`;
        }).join(" ");
    };
    Array.prototype.distinct = function (project) {
        if (!project)
            project = (item) => item;
        const result = [];
        const map = new Map();
        for (const item of this) {
            const key = project ? project(item) : item;
            if (!map.has(key)) {
                map.set(key, true);
                result.push(item);
            }
        }
        return result;
    };
    Array.prototype.except = function (...items) {
        return this.filter((item) => !items.includes(item));
    };
    Array.prototype.exceptBy = function (items, getItemKey) {
        if (!getItemKey)
            getItemKey = (item) => item;
        const itemKeys = items.map(getItemKey);
        return this.filter((item) => !itemKeys.includes(getItemKey(item)));
    };
    Array.prototype.sortBy = function (...projects) {
        return this.sort((a, b) => {
            const aVal = projects.map((project) => project(a)).join("/");
            const bVal = projects.map((project) => project(b)).join("/");
            return aVal.localeCompare(bVal);
        });
    };
    Array.prototype.sortByDesc = function (...projects) {
        return [...this.sortBy(...projects)].reverse();
    };
    Array.prototype.stringify = function () {
        return JSON.stringify(this);
    };
    Array.prototype.onlyTruthy = function () {
        return this.filter((item) => !!item);
    };
    Array.prototype.shuffle = function () {
        return this.sortBy(() => Math.random() - 0.5);
    };
}
// #endregion
// #region Function
if (typeof Function !== "undefined") {
    Function.prototype.is = function (type) {
        return (0)._is(this, type);
    };
    Function.prototype.getArgumentNames = function () {
        const code = this.toString();
        const args = code
            .slice(code.indexOf("(") + 1, code.indexOf(")"))
            .match(/([^\s,]+)/g);
        return args || [];
    };
    Function.prototype.postpone = function (delay) {
        const fn = this;
        return () => {
            setTimeout(fn, delay);
        };
    };
    /**
     * If the original function is called multiple times within the specified delay,
     * the function will only be executed once at the end.
     */
    Function.prototype.debounce = function (delay) {
        const fn = this;
        let timeout;
        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(async function () {
                await fn.apply(context, args);
            }, delay);
        };
    };
    /**
     * If the original function is called multiple times within the specified delay,
     * it will execute once every delay time.
     */
    Function.prototype.throttle = function (delay) {
        const fn = this;
        let timeout;
        return function (...args) {
            fn.prototype.nextArgs = args;
            const context = this;
            if (!timeout) {
                timeout = setTimeout(async function () {
                    await fn.apply(context, fn.prototype.nextArgs);
                    timeout = null;
                }, delay);
            }
        };
    };
}
// #endregion


/***/ }),

/***/ "../../../../../Shared/Lock.ts":
/*!*************************************!*\
  !*** ../../../../../Shared/Lock.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Lock = void 0;
class Lock {
    queue = [];
    locked = false;
    constructor() { }
    acquire() {
        return new Promise((resolve) => {
            if (!this.locked) {
                // If no one else has the lock
                // Take the lock immediately
                this.locked = true;
                resolve(null);
            }
            else {
                // Wait for someone else to release the lock
                this.queue.push(resolve);
                return;
            }
        });
    }
    release() {
        const resolve = this.queue.shift();
        if (resolve) {
            resolve(null);
        }
        else {
            this.locked = false;
        }
    }
}
exports.Lock = Lock;


/***/ }),

/***/ "../../../../../Shared/RepeatingTaskQueue.ts":
/*!***************************************************!*\
  !*** ../../../../../Shared/RepeatingTaskQueue.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RepeatingTaskQueue = void 0;
class RepeatingTaskQueue {
    // Meaning the queue will cycle through all tasks every [cycleInterval] milliseconds
    cycleInterval = 1000;
    tasks = [];
    index = 0;
    constructor() {
        this.index = 0;
        this.next();
    }
    static new() {
        const queue = new RepeatingTaskQueue();
        return queue;
    }
    async next() {
        const task = this.tasks[this.index];
        if (task)
            await task();
        this.index = (this.index + 1) % this.tasks.length || 0;
        setTimeout(this.next.bind(this), this.cycleInterval / this.tasks.length);
    }
    enqueue(task) {
        this.tasks.push(task);
    }
}
exports.RepeatingTaskQueue = RepeatingTaskQueue;


/***/ }),

/***/ "../../../../../Shared/TaskQueue.ts":
/*!******************************************!*\
  !*** ../../../../../Shared/TaskQueue.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TaskQueue = void 0;
// Enqueue async tasks and run them in order
class TaskQueue {
    tasks = [];
    constructor() {
        this.next();
    }
    enqueue(task) {
        this.tasks.push(task);
    }
    async next() {
        const task = this.tasks.shift();
        if (task)
            await task();
        const delay = this.tasks.length ? 0 : 100;
        setTimeout(this.next.bind(this), delay);
    }
}
exports.TaskQueue = TaskQueue;


/***/ }),

/***/ "../../../../../Shared/TwoWayMap.ts":
/*!******************************************!*\
  !*** ../../../../../Shared/TwoWayMap.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TwoWayMap = void 0;
class TwoWayMap {
    forward;
    reverse;
    constructor() {
        this.forward = new Map();
        this.reverse = new Map();
    }
    set(key, value) {
        if (!this.forward.has(key)) {
            this.forward.set(key, []);
        }
        this.forward.get(key).push(value);
        if (!this.reverse.has(value)) {
            this.reverse.set(value, []);
        }
        this.reverse.get(value).push(key);
    }
    setReverse(value, key) {
        if (!this.reverse.has(value)) {
            this.reverse.set(value, []);
        }
        this.reverse.get(value).push(key);
        if (!this.forward.has(key)) {
            this.forward.set(key, []);
        }
        this.forward.get(key).push(value);
    }
    delete(key) {
        const values = this.forward.get(key);
        if (!values)
            return;
        values.forEach((value) => {
            const keys = this.reverse.get(value);
            if (!keys)
                return;
            const index = keys.indexOf(key);
            if (index == -1)
                return;
            keys.splice(index, 1);
        });
        this.forward.delete(key);
    }
    deleteReverse(value) {
        const keys = this.reverse.get(value);
        if (!keys)
            return;
        keys.forEach((key) => {
            const values = this.forward.get(key);
            if (!values)
                return;
            const index = values.indexOf(value);
            if (index == -1)
                return;
            values.splice(index, 1);
        });
        this.reverse.delete(value);
    }
    get(key) {
        return this.forward.get(key) || [];
    }
    getReverse(value) {
        return this.reverse.get(value) || [];
    }
    keys() {
        return Array.from(this.forward.keys());
    }
    values() {
        return Array.from(this.reverse.keys());
    }
}
exports.TwoWayMap = TwoWayMap;


/***/ }),

/***/ "../../../../../Shared/WebScript/add.paths.ts":
/*!****************************************************!*\
  !*** ../../../../../Shared/WebScript/add.paths.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const Extensions_Objects_Client_1 = __webpack_require__(/*! ../Extensions.Objects.Client */ "../../../../../Shared/Extensions.Objects.Client.ts");
exports["default"] = (context, compName, dom) => {
    compName = compName.replace(/-/g, ".");
    dom = Extensions_Objects_Client_1.Objects.json.parse(JSON.stringify(dom));
    const root = Object.values(dom)[0];
    // Traverse the tree and for each object node (not attribute), add a path attribute
    Extensions_Objects_Client_1.Objects.traverse(root, (node, key, value, path) => {
        if (value && typeof value == "object") {
            const paths = (value.paths || "").split("|").filter((p) => p);
            if (paths.some((p) => p.startsWith(compName)))
                return;
            paths.push(`${compName.hashCode()}.${path.join(".")}`);
            value.path = paths.join("|");
        }
    }, 
    // In WebScript, attributes are on the same level as nodes
    // for human readability, although formally this is not correct
    // We only want to traverse the nodes, not the attributes
    (n, key) => !context.isAttributeName(key));
    return dom;
};


/***/ }),

/***/ "../../../../../Shared/WebScript/is.attribute.name.ts":
/*!************************************************************!*\
  !*** ../../../../../Shared/WebScript/is.attribute.name.ts ***!
  \************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports["default"] = (componentNames, name) => {
    if (name.includes("@"))
        return true;
    if (name.includes("."))
        return false;
    if (name.startsWith(":"))
        return true;
    if (name.includes("#"))
        return false;
    if (name.startsWith("template"))
        return false;
    if (name == "slot")
        return false;
    if ([
        "a",
        "style",
        ...[1, 2, 3, 4, 5, 6].map((i) => `h${i}`),
        "pre",
        "code",
        "p",
        "img",
        "video",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "div",
        "span",
        "ul",
        "li",
        "label",
        "input",
        "button",
        "select",
        "option",
        "canvas",
        "textarea",
        "component",
        "transition",
        "keep.alive",
    ].includes(name))
        return false;
    if (name.startsWith("."))
        return false;
    if (componentNames.find((c) => c == name.replace(":", "")))
        return false;
    return true;
};


/***/ }),

/***/ "../../../../../Shared/WebScript/to.template.ts":
/*!******************************************************!*\
  !*** ../../../../../Shared/WebScript/to.template.ts ***!
  \******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const add_paths_1 = __importDefault(__webpack_require__(/*! ./add.paths */ "../../../../../Shared/WebScript/add.paths.ts"));
exports["default"] = (context, dom, indent, compName) => {
    if (!dom)
        return [];
    const s = [];
    if (!indent)
        indent = 0;
    dom = JSON.parse(JSON.stringify(dom));
    if (compName) {
        // Traverse the tree and for each object node (not attribute), add a path attribute
        dom = (0, add_paths_1.default)(context, compName, dom);
    }
    // Add the component name as a class to the root element
    if (!indent && compName) {
        const compClassName = `comp-${compName}`;
        const rootEntry = Object.entries(dom)[0];
        const rootKey = rootEntry[0];
        const root = (rootEntry[1] || {});
        root.class = [
            compClassName,
            ...(root.class || "").split(" ").filter((c) => c),
        ].join(" ");
        dom[rootKey] = root;
    }
    const stringToArray = (s) => {
        if (!s)
            return [];
        if (Array.isArray(s))
            return s;
        return s.split(" ").filter((s) => s);
    };
    // If the dom is { div.opacity: {} }, then we want to render it as { div: { class: "opacity", ...{} } }
    for (const child of Object.entries(dom || {})) {
        const tag = child[0];
        if (!child[1])
            continue;
        if (Array.isArray(dom[tag].class))
            dom[tag].class = dom[tag].class.join(" ");
        if (tag.startsWith(".")) {
            const parts = tag.split(".");
            const newTag = parts[0] || "div";
            const classNames = parts.slice(1);
            dom[newTag] = JSON.parse(JSON.stringify(dom[tag]));
            dom[newTag].class = [];
            dom[newTag].class.push(...stringToArray(dom[tag].class));
            dom[newTag].class.push(...classNames);
            dom[newTag].class = dom[newTag].class.join(" ");
            delete dom[tag];
        }
    }
    const domNode = (tag, attrs, indent) => {
        // Remove #1, #2, etc. from class names
        if (attrs.class) {
            attrs.class = stringToArray(attrs.class)
                .map((c) => c.split("#")[0])
                .join(" ");
        }
        tag = tag.replace(/\./g, "-");
        const indentStr = "  ".repeat(indent);
        return `${indentStr}${tag}(${Object.entries(attrs)
            .map((a) => {
            return { key: a[0].split("#")[0], value: a[1] };
        })
            .filter((a) => a.value)
            .map((a) => {
            const valueStr = typeof a.value == "string" ? a.value : a.value;
            return `"${a.key}"="${valueStr}"`;
        }).join(", ")})`;
    };
    if (Array.isArray(dom)) {
        s.push(domNode("div", {}, indent));
        for (const child of dom) {
            s.push(...context.toTemplate(context, child, indent + 2));
        }
        return s;
    }
    for (let child of Object.entries(dom || {})) {
        let tag = child[0];
        // For convenience and brevity, we use this syntax:
        //   div
        //   div
        // But this is not valid YAML, because duplicate keys
        // So we're using:
        //   div#1
        //   div#2
        // And later removing the #1, #2 from the tag
        if (tag.includes("#")) {
            tag = tag.split("#")[0];
        }
        if (!child[1]) {
            s.push(domNode(tag, {}, indent));
            continue;
        }
        if (typeof child[1] == "string") {
            const obj = {};
            obj[":value"] = child[1];
            child = [tag, obj];
        }
        const attrs = Object.fromEntries(Object.entries(child[1])
            .filter((a) => context.isAttributeName(a[0]))
            .filter((a) => context.includeAttribute(a[0]))
            .map((a) => context.postProcessAttribute(a)));
        const children = Object.fromEntries(Object.entries(child[1]).filter((a) => !context.isAttributeName(a[0])));
        s.push(domNode(tag, attrs, indent));
        for (const child of Object.entries(children)) {
            let dom = {};
            dom[child[0]] = child[1];
            s.push(...context.toTemplate(context, dom, indent + 1));
        }
    }
    return s;
};


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("../../../../LiveIde/Website/script/1690799541640.ts");
/******/ 	
/******/ })()
;