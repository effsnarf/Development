/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "../../../../../Apps/DatabaseProxy/Client/DbpClient.ts":
/*!*************************************************************!*\
  !*** ../../../../../Apps/DatabaseProxy/Client/DbpClient.ts ***!
  \*************************************************************/
/***/ (function(__unused_webpack_module, exports) {


// This version is for public clients like Meme Generator
// Doesn't have direct access to the database, but can still use the API
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DatabaseProxy = void 0;
// Lowercase the first letter of a string
String.prototype.untitleize = function () {
    return this.charAt(0).toLowerCase() + this.slice(1);
};
class DatabaseProxy {
    constructor(urlBase, _fetchAsJson) {
        this.urlBase = urlBase;
        this.fetchAsJson =
            _fetchAsJson ||
                ((url, ...args) => __awaiter(this, void 0, void 0, function* () {
                    const response = yield fetch(url, ...args);
                    const text = yield response.text();
                    if (!(text === null || text === void 0 ? void 0 : text.length))
                        return null;
                    return JSON.parse(text);
                }));
    }
    static new(urlBase, _fetchAsJson) {
        return __awaiter(this, void 0, void 0, function* () {
            const dbp = new DatabaseProxy(urlBase, _fetchAsJson);
            yield dbp.init();
            return dbp;
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const api = yield this.createApiMethods();
            for (const key of Object.keys(api)) {
                this[key] = api[key];
            }
        });
    }
    static setValue(obj, value) {
        if (Array.isArray(obj)) {
            obj[0][obj[1]] = value;
        }
        else {
            obj.value = value;
        }
    }
    fetchJson(url, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            // $set also implies cached
            if (!options.$set) {
                if (options.cached) {
                    // Even though we're returning from the cache,
                    // we still want to fetch in the background
                    // to update for the next time
                    const fetchItem = () => __awaiter(this, void 0, void 0, function* () {
                        const item = yield this.fetchAsJson(url, options);
                        //localStorage.setItem(url, JSON.stringify(item));
                        return item;
                    });
                    //const cachedItem = Objects.json.parse(localStorage.getItem(url) || "null");
                    const cachedItem = null;
                    if (!cachedItem)
                        return yield fetchItem();
                    // Fetch in the background
                    fetchItem();
                    return cachedItem;
                }
                return yield this.fetchAsJson(url, options);
            }
            // Check the local cache
            //const cachedItem = Objects.json.parse(localStorage.getItem(url) || "null");
            const cachedItem = null;
            if (cachedItem)
                DatabaseProxy.setValue(options.$set, cachedItem);
            // Fetch in the background
            const item = yield this.fetchAsJson(url, options);
            // Update the local cache
            //localStorage.setItem(url, JSON.stringify(item));
            DatabaseProxy.setValue(options.$set, item);
            return item;
        });
    }
    callApiMethod(entity, group, method, args, extraArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            // We're using { $set: [obj, prop] } as a callback syntax
            // This is because sometimes we use the local cache and also fetch in the background
            // in which case we'll need to resolve twice which is not possible with a promise
            const options = extraArgs.find((a) => a.$set) || {};
            const url = `${this.urlBase}/api/${entity}/${group}/${method}`;
            const isHttpPost = group == "create";
            if (isHttpPost) {
                const data = {};
                args.forEach((a) => (data[a.name] = a.value));
                const result = yield this.fetchJson(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                    mode: "no-cors",
                });
                return yield (result === null || result === void 0 ? void 0 : result.json());
            }
            const argsStr = args
                .map((a) => `${a.name}=${JSON.stringify(a.value || null)}`)
                .join("&");
            const getUrl = `${url}?${argsStr}`;
            const result = yield this.fetchJson(getUrl, options);
            return result;
        });
    }
    createApiMethods() {
        return __awaiter(this, void 0, void 0, function* () {
            const api = {};
            const apiMethods = yield this.getApiMethods();
            apiMethods.forEach((e) => {
                const entityName = e.entity.untitleize();
                api[entityName] = {};
                e.groups.forEach((g) => {
                    api[entityName][g.name] = {};
                    g.methods.forEach((m) => {
                        api[entityName][g.name][m.name] = (...args) => __awaiter(this, void 0, void 0, function* () {
                            let result = yield this.callApiMethod(e.entity, g.name, m.name, (m.args || []).map((a, i) => {
                                return { name: a, value: args[i] };
                            }), args.slice((m.args || []).length));
                            if (m.then) {
                                const thenArgs = [`api`, ...(m.then.args || [])];
                                const then = eval(`async (${thenArgs.join(`,`)}) => { ${m.then.body} }`);
                                if (m.then.chainResult) {
                                    result = yield then(api, result);
                                }
                                else {
                                    then(api, result);
                                }
                            }
                            return result;
                        });
                    });
                });
            });
            return api;
        });
    }
    getApiMethods() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.fetchJson(`${this.urlBase}/api`, {
                cached: true,
            });
            return result;
        });
    }
}
exports.DatabaseProxy = DatabaseProxy;


/***/ }),

/***/ "../../../../LiveIde/Website/script/1689786232860.ts":
/*!***********************************************************!*\
  !*** ../../../../LiveIde/Website/script/1689786232860.ts ***!
  \***********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__webpack_require__(/*! ../../../../Shared/Extensions */ "../../../../../Shared/Extensions.ts");
const Extensions_Objects_Client_1 = __webpack_require__(/*! ../../../../Shared/Extensions.Objects.Client */ "../../../../../Shared/Extensions.Objects.Client.ts");
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
            if (!instance)
                return null;
            return helpers.url.full(`/instance/${instance.instanceID}`, full);
        },
        itemImage: (item) => {
            var _a;
            if (!item)
                return null;
            if (item.text0)
                return `https://img.memegenerator.net/instances/${item._id}.jpg`;
            if (item.builderID)
                return helpers.url.image((_a = item.content.items.find((item) => item.imageID)) === null || _a === void 0 ? void 0 : _a.imageID);
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
            if (item.text0)
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
};
(() => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield ClientContext_1.ClientContext.get();
    client.Vue.directive("html-raw", {
        bind(el, binding) {
            el.innerHTML = binding.value;
        },
    });
    yield client.compileAll();
    let ideVueApp = null;
    const isLocalHost = window.location.hostname == "localhost";
    const dbpHost = `https://db.memegenerator.net`;
    const dbp = (yield DbpClient_1.DatabaseProxy.new(`${dbpHost}/MemeGenerator`));
    const getNewParams = () => __awaiter(void 0, void 0, void 0, function* () {
        return (yield Params_1.Params.new(() => ideVueApp, client.config.params, window.location.pathname));
    });
    const params = yield getNewParams();
    const vueManager = yield VueManager_1.VueManager.new(client);
    ideVueApp = new client.Vue({
        data: {
            // MemeGenerator
            builders: {},
            // General
            state: null,
            vm: vueManager,
            client,
            dbp,
            analytics: yield AnalyticsTracker_1.AnalyticsTracker.new(),
            params: params,
            url: helpers.url,
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
        mounted() {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.init();
            });
        },
        methods: {
            getBuilder(builderID) {
                return __awaiter(this, void 0, void 0, function* () {
                    const self = this;
                    yield self.ensureBuilders();
                    return self.builders[builderID];
                });
            },
            ensureBuilders() {
                var _a;
                return __awaiter(this, void 0, void 0, function* () {
                    const self = this;
                    if (!((_a = self.builders) === null || _a === void 0 ? void 0 : _a.length)) {
                        const allBuilders = yield self.dbp.builders.select.all();
                        self.builders = allBuilders.toMap((b) => b._id);
                    }
                });
            },
            getBuilderComponentName(builder) {
                if (!builder)
                    return null;
                return `e-format-${builder.format.replace(/\./g, "-")}`;
            },
            init() {
                return __awaiter(this, void 0, void 0, function* () {
                    const self = this;
                    self.compsDic = client.comps.toMap((c) => c.name.hashCode());
                    self.compNames = client.comps.map((c) => c.name);
                    yield self.ensureBuilders();
                });
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
                    filter = (vue) => { var _a; return ((_a = vue.$data._) === null || _a === void 0 ? void 0 : _a.comp.name) == compName; };
                }
                const vues = [];
                for (const child of vue.$children) {
                    if (filter(child))
                        vues.push(child);
                    vues.push(...this.getDescendants(child, filter));
                }
                return vues;
            },
            navigateTo(item) {
                return __awaiter(this, void 0, void 0, function* () {
                    const url = typeof item == "string" ? item : this.itemToUrl(item);
                    const self = this;
                    self.error = null;
                    window.history.pushState({}, "", url);
                    yield this.refresh();
                });
            },
            itemToUrl(item) {
                if (typeof item == "string")
                    return item;
                if (item.threadID)
                    return helpers.url.thread({ _id: item.threadID });
                if (item.builderID && item.content)
                    return helpers.url.media(item);
                throw new Error("Unknown item type");
            },
            compileApp() {
                return __awaiter(this, void 0, void 0, function* () {
                    yield client.compileApp();
                    this.refresh();
                });
            },
            reloadComponentsFromServer() {
                return __awaiter(this, void 0, void 0, function* () {
                    yield client.reloadComponentsFromServer();
                    yield this.init();
                    yield this.refreshComponents();
                });
            },
            getMoreInstances(pageIndex) {
                return __awaiter(this, void 0, void 0, function* () {
                    const self = this;
                    return yield self.dbp.instances.select.popular("en", pageIndex, self.params.urlName);
                });
            },
            textToHtml(text) {
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
                return s;
            },
            refresh() {
                return __awaiter(this, void 0, void 0, function* () {
                    const self = this;
                    const newParams = (yield getNewParams());
                    for (const key in newParams) {
                        if ("value" in newParams[key])
                            self.params[key] = newParams[key].value;
                    }
                    //(this as any).key1++;
                    window.scrollTo({ top: 0, behavior: "smooth" });
                });
            },
            refreshComponents() {
                return __awaiter(this, void 0, void 0, function* () {
                    const self = this;
                    self.key1++;
                    yield self.$nextTick();
                    yield self.state.restoreState();
                });
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
                return item;
            },
            getRandomStanza(poem) {
                if (!(poem === null || poem === void 0 ? void 0 : poem.length))
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
            uploadFile(file) {
                return __awaiter(this, void 0, void 0, function* () {
                    const self = this;
                    const imageUrl = yield this.getImageUrlFromDataTransferFile(file);
                    const s = [];
                    s.push(`<img src='${imageUrl}' />`);
                    s.push("<h3 class='text-center'>uploading..</h3>");
                    s.push(`<div class='text-center'><img src='${self.$data.loadingImageUrl}'></img></div>`);
                    const msg = client.alertify.message(s.join("")).delay(0);
                    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                        let url = "https://img.memegenerator.net/upload";
                        var xhr = new XMLHttpRequest();
                        var formData = new FormData();
                        xhr.open("POST", url, true);
                        xhr.addEventListener("readystatechange", function (e) {
                            return __awaiter(this, void 0, void 0, function* () {
                                if (xhr.readyState == 4 && xhr.status == 200) {
                                    const image = Extensions_Objects_Client_1.Objects.json.parse(xhr.responseText);
                                    // Download the image from the server
                                    // this also takes some time, and we should hold the loading indicator
                                    yield self.downloadImage(image._id);
                                    msg.dismiss();
                                    resolve(image);
                                }
                                else if (xhr.readyState == 4 && xhr.status != 200) {
                                    msg.dismiss();
                                    reject(xhr.responseText);
                                }
                            });
                        });
                        formData.append("image", file);
                        xhr.send(formData);
                    }));
                });
            },
            getImageUrlFromDataTransferFile(file) {
                return __awaiter(this, void 0, void 0, function* () {
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
                    const imageUrl = yield readFileAsDataURL(file);
                    return imageUrl;
                    // for (let i = 0; i < files.length; i++) {
                    //   const file = files[i];
                    //   if (file.type.startsWith("image/")) {
                    //     const imageUrl = await readFileAsDataURL(file);
                    //     imageUrls.push(imageUrl);
                    //   }
                    // }
                    // return imageUrls;
                });
            },
            downloadImage(imageIdOrUrl) {
                return __awaiter(this, void 0, void 0, function* () {
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
                });
            },
            getIcon(item) {
                const stateItemIcons = {
                    // method
                    m: "🔴",
                    // event
                    e: "⚡",
                    // prop
                    p: "🔒",
                    // data
                    d: "🧊",
                    // computed
                    c: "✨",
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
            wait(condition, timeout = 10000) {
                return __awaiter(this, void 0, void 0, function* () {
                    const startedAt = Date.now();
                    const tryInterval = 100;
                    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                        const tryAgain = () => __awaiter(this, void 0, void 0, function* () {
                            if (Date.now() - startedAt > timeout)
                                return reject();
                            if (yield condition()) {
                                resolve();
                            }
                            else {
                                setTimeout(tryAgain, tryInterval);
                            }
                        });
                        tryAgain();
                    }));
                });
            },
        },
    });
    ideVueApp.state = yield StateTracker_1.StateTracker.new(() => ideVueApp, vueManager, client);
    ideVueApp.$mount("#app");
    window.addEventListener("popstate", function (event) {
        return __awaiter(this, void 0, void 0, function* () {
            yield ideVueApp.refresh();
        });
    });
    window.ideVueApp = ideVueApp;
}))();


/***/ }),

/***/ "../../../../LiveIde/classes/AnalyticsTracker.ts":
/*!*******************************************************!*\
  !*** ../../../../LiveIde/classes/AnalyticsTracker.ts ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AnalyticsTracker = void 0;
class AnalyticsTracker {
    constructor() {
        this.isPaused = false;
        this.trackInterval = 100;
        this.timeOnSite = 0;
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
    static new() {
        return __awaiter(this, void 0, void 0, function* () {
            return new AnalyticsTracker();
        });
    }
    trackTick() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isPaused)
                yield this.track();
            setTimeout(this.trackTick.bind(this), this.trackInterval);
        });
    }
    track() {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeOnSite += this.trackInterval;
        });
    }
}
exports.AnalyticsTracker = AnalyticsTracker;


/***/ }),

/***/ "../../../../LiveIde/classes/ClientContext.ts":
/*!****************************************************!*\
  !*** ../../../../LiveIde/classes/ClientContext.ts ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    static get() {
        return __awaiter(this, void 0, void 0, function* () {
            const lock = (window._clientContextLock ||
                (window._clientContextLock = new Lock_1.Lock()));
            yield lock.acquire();
            try {
                return (window._clientContext ||
                    (window._clientContext =
                        yield ClientContext.new()));
            }
            finally {
                lock.release();
            }
        });
    }
    get comps() {
        return this.componentManager.comps;
    }
    constructor() { }
    static new() {
        return __awaiter(this, void 0, void 0, function* () {
            const context = new ClientContext();
            yield context.init();
            return context;
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            ClientContext._fetch = window.fetch.bind(null);
            window.fetch = ClientContext.fetch;
            this.db = yield ClientDatabase_1.ClientDatabase.new("IDE", {
                ModifiedItems: ["key", "modifiedAt", "item"],
            });
            this.componentManager = yield ComponentManager_1.ComponentManager.get();
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
        });
    }
    compileAll(filter = (c) => true) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const comp of this.comps.filter(filter)) {
                yield comp.compile();
            }
        });
    }
    compileApp() {
        return __awaiter(this, void 0, void 0, function* () {
            const isIdeComponent = (c) => ["ui", "ide"].some((p) => c.name.startsWith(`${p}.`));
            yield this.compileAll((c) => !isIdeComponent(c));
        });
    }
    reloadComponentsFromServer() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.componentManager.reloadComponentsFromServer();
            yield this.compileAll((c) => !["app"].includes(c.name));
        });
    }
    isAttributeName(componentNames, name) {
        return (0, is_attribute_name_1.default)(componentNames, name);
    }
    pugToHtml(pug) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!isDevEnv)
                return null;
            const url = `/pug`;
            const item = yield (yield fetch(url, { method: "post", body: pug })).text();
            return item;
        });
    }
    updateComponent(comp) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!isDevEnv)
                return;
            const url = `/component/update`;
            yield fetch(url, { method: "post", body: JSON.stringify(comp) });
        });
    }
    static fetch(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield ClientContext._fetch(...args);
                if (result.status < 500)
                    return result;
                const text = yield result.text();
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
                yield new Promise((resolve) => setTimeout(resolve, 1000));
                return yield ClientContext.fetch(...args);
            }
        });
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
/***/ (function(__unused_webpack_module, exports) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ClientDatabase = void 0;
const Dexie = window.Dexie;
class ClientDatabase {
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
    static new(dbName, collections) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = new ClientDatabase(dbName, collections);
            return db;
        });
    }
    pop(collection) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = yield this.db[collection].toCollection().first();
            if (!item)
                return null;
            yield this.db[collection].delete(item.key);
            return item;
        });
    }
    filter(collection, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db[collection].filter(filter).toArray();
        });
    }
    find(collection, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.filter(collection, filter))[0];
        });
    }
    upsert(collection, item) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db[collection].put(item);
        });
    }
    upsertMany(collection, items) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db[collection].bulkPut(items);
        });
    }
    delete(collection, key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db[collection].delete(key);
        });
    }
}
exports.ClientDatabase = ClientDatabase;


/***/ }),

/***/ "../../../../LiveIde/classes/Component.ts":
/*!************************************************!*\
  !*** ../../../../LiveIde/classes/Component.ts ***!
  \************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Component = void 0;
const ClientContext_1 = __webpack_require__(/*! ./ClientContext */ "../../../../LiveIde/classes/ClientContext.ts");
String.prototype.kebabize = function () {
    return this.replace(/\./g, "-").toLowerCase();
};
class Component {
    constructor(obj) {
        this.name = obj.name;
        this.path = obj.path;
        this.source = obj.source;
        this.isCompiled = false;
        if (this.source)
            this.source.name = this.name.replace(/\./g, "-");
    }
    compile() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isCompiled)
                return;
            const client = yield ClientContext_1.ClientContext.get();
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
                        let html = (yield client.pugToHtml(pug)) || "";
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
        });
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
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ComponentManager = void 0;
__webpack_require__(/*! ../../../Shared/Extensions */ "../../../../../Shared/Extensions.ts");
const Lock_1 = __webpack_require__(/*! ../../../Shared/Lock */ "../../../../../Shared/Lock.ts");
const DataWatcher_1 = __webpack_require__(/*! ../../../Shared/DataWatcher */ "../../../../../Shared/DataWatcher.ts");
const Component_1 = __webpack_require__(/*! ./Component */ "../../../../LiveIde/classes/Component.ts");
const ClientContext_1 = __webpack_require__(/*! ./ClientContext */ "../../../../LiveIde/classes/ClientContext.ts");
class ComponentManager {
    // #region Globals
    static get() {
        return __awaiter(this, void 0, void 0, function* () {
            const lock = (window._componentManagerLock ||
                (window._componentManagerLock = new Lock_1.Lock()));
            yield lock.acquire();
            try {
                return (window._componentManager ||
                    (window._componentManager =
                        yield ComponentManager.new()));
            }
            finally {
                lock.release();
            }
        });
    }
    constructor() {
        // #endregion
        this.comps = [];
        this.watchers = [];
    }
    static new() {
        return __awaiter(this, void 0, void 0, function* () {
            const manager = new ComponentManager();
            yield manager.init();
            return manager;
        });
    }
    init(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = options.onlyChanged ? "/changed/components" : "/components";
            if (window.location.hostname == "localhost") {
                const newComps = (yield (yield fetch(url)).json()).map((c) => new Component_1.Component(c));
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
            const watchers = yield Promise.all(this.comps.map((c) => DataWatcher_1.DataWatcher.new(() => c, this.onComponentChanged.bind(this))));
            this.watchers.push(...watchers);
            this.saveModifiedItems();
        });
    }
    saveModifiedItems() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield ClientContext_1.ClientContext.get();
            // Item needs to be not modified for this time to be saved
            // This is to throtte typing etc
            // This can be a bit longer time because we're saving the changed in IndexedDB
            // So if the user closes the browser, the changes will be saved next time
            const delay = 1000 * 1;
            let modifiedItem;
            while ((modifiedItem = yield client.db.find("ModifiedItems", (item) => item.modifiedAt > Date.now() - delay))) {
                yield client.db.delete("ModifiedItems", modifiedItem.key);
                yield client.updateComponent(modifiedItem.item);
            }
            setTimeout(this.saveModifiedItems.bind(this), 400);
        });
    }
    onComponentChanged(newComp) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield ClientContext_1.ClientContext.get();
            client.db.upsert("ModifiedItems", {
                key: newComp.name,
                modifiedAt: Date.now(),
                item: newComp,
            });
        });
    }
    reloadComponentsFromServer() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.init({ onlyChanged: true });
        });
    }
}
exports.ComponentManager = ComponentManager;


/***/ }),

/***/ "../../../../LiveIde/classes/Params.ts":
/*!*********************************************!*\
  !*** ../../../../LiveIde/classes/Params.ts ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, exports) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Params = void 0;
const Vue = window.Vue;
class Params {
    constructor(getRootVue, _config) {
        this.getRootVue = getRootVue;
        this._config = _config;
        this._items = [];
    }
    static new(getRootVue, config, url) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = new Params(getRootVue, config);
            yield params.init();
            yield params.refresh(url);
            return params;
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    refresh(url) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const item of this._items) {
                item.ref.value = yield item.get.apply(this, [url]);
            }
        });
    }
}
exports.Params = Params;


/***/ }),

/***/ "../../../../LiveIde/classes/StateTracker.ts":
/*!***************************************************!*\
  !*** ../../../../LiveIde/classes/StateTracker.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StateTracker = void 0;
__webpack_require__(/*! ../../../Shared/Extensions */ "../../../../../Shared/Extensions.ts");
const Extensions_Objects_Client_1 = __webpack_require__(/*! ../../../Shared/Extensions.Objects.Client */ "../../../../../Shared/Extensions.Objects.Client.ts");
const VueHelper_1 = __webpack_require__(/*! ./VueHelper */ "../../../../LiveIde/classes/VueHelper.ts");
class StateTracker {
    constructor(getApp, vm, client) {
        this.getApp = getApp;
        this.vm = vm;
        this.client = client;
        this.isPaused = 0;
        this.refChanges = new Map();
        this.methods = {
            pause: {},
        };
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
    apply(uid, change) {
        return __awaiter(this, void 0, void 0, function* () {
            this.pause();
            const vue = this.vm.getVue(uid);
            vue[change.key] = change.newValue;
            yield vue.$nextTick();
            this.resume();
        });
    }
    // Sometimes when refreshing keys in the app, the vue components are recreated
    // and lose their state.
    // This method restores the state from the state tracker.
    restoreState() {
        return __awaiter(this, void 0, void 0, function* () {
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
            yield this.getApp().$nextTick();
            this.resume();
        });
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
StateTracker._nextID = 1;
StateTracker._maxItems = 100;


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
            var _a;
            for (const refKey in vue.$refs) {
                if (!map.has(refKey)) {
                    map.set(refKey, []);
                }
                (_a = map.get(refKey)) === null || _a === void 0 ? void 0 : _a.push(vue.$refs[refKey]);
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
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VueManager = void 0;
__webpack_require__(/*! ../../../Shared/Extensions */ "../../../../../Shared/Extensions.ts");
const TwoWayMap_1 = __webpack_require__(/*! ../../../Shared/TwoWayMap */ "../../../../../Shared/TwoWayMap.ts");
const VueHelper_1 = __webpack_require__(/*! ./VueHelper */ "../../../../LiveIde/classes/VueHelper.ts");
class VueManager {
    constructor(client) {
        this.client = client;
        this.vues = {};
        this.vuesCount = 0;
        // Tracking by uid or vue tree path are unreliable because vue recreates components
        // We use $refs to track components
        // Any ref that starts with a capital letter is a global reference
        this.vueRefsToUIDs = new TwoWayMap_1.TwoWayMap();
    }
    static new(client) {
        return __awaiter(this, void 0, void 0, function* () {
            const vm = new VueManager(client);
            return vm;
        });
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
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    constructor(getData, onChange) {
        this.getData = getData;
        this.onChange = onChange;
        // #endregion
        this.dataComparer = new DefaultDataComparer();
        this.data = this.dataComparer.clone(getData());
        DataWatcher.queue.enqueue(this.check.bind(this));
    }
    static new(getData, onChange) {
        return __awaiter(this, void 0, void 0, function* () {
            const watcher = new DataWatcher(getData, onChange);
            return watcher;
        });
    }
    check() {
        return __awaiter(this, void 0, void 0, function* () {
            const newData = this.dataComparer.clone(this.getData());
            if (!this.dataComparer.areEqual(this.data, newData)) {
                try {
                    yield this.onChange(newData, this.data);
                }
                catch (ex) {
                    console.error(ex);
                }
                this.data = newData;
            }
        });
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
    static toCamelCaseKeys(obj) {
        const result = {};
        for (const key of Object.keys(obj)) {
            let value = obj[key];
            if (value && !Array.isArray(value) && typeof value === "object")
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
            if (typeof tgt !== "object" || typeof src !== "object") {
                return tgt;
            }
            if (null == src) {
                return tgt;
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
}
exports.Objects = Objects;
Objects.json = {
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


/***/ }),

/***/ "../../../../../Shared/Extensions.ts":
/*!*******************************************!*\
  !*** ../../../../../Shared/Extensions.ts ***!
  \*******************************************/
/***/ (function() {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Time {
    static prevUnit(unit) {
        return this.units[this.units.indexOf(unit) - 1];
    }
    static nextUnit(unit) {
        return this.units[this.units.indexOf(unit) + 1];
    }
}
Time.units = [
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
Time.longUnits = [
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
Time.unitToValue = {
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
class Size {
    static prevUnit(unit) {
        return this.units[this.units.indexOf(unit) - 1];
    }
    static nextUnit(unit) {
        return this.units[this.units.indexOf(unit) + 1];
    }
}
Size.units = [
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
Size.longUnits = [
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
Size.unitToValue = {
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
class Percentage {
    static prevUnit(unit) {
        return this.units[this.units.indexOf(unit) - 1];
    }
    static nextUnit(unit) {
        return this.units[this.units.indexOf(unit) + 1];
    }
}
Percentage.units = ["%"];
Percentage.longUnits = ["percent"];
Percentage.unitToValue = {
    "%": 100,
};
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
        if (!(unit === null || unit === void 0 ? void 0 : unit.length))
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
    Number.prototype.severify = function (green, yellow, direction) {
        const color = this.getSeverityColor(green, yellow, direction, true);
        let s = this.toString().colorize(color);
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
        if (value < 10)
            return value.toFixed(2);
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
        if (!unitClass)
            throw new Error("No unit class found");
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
            if (index != -1)
                return unitClass.units[index];
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
    Array.prototype.add = function (items, stagger = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Array.isArray(items))
                items = [items];
            items = [...items];
            if (!stagger) {
                this.push(...items);
                return;
            }
            const addOne = () => __awaiter(this, void 0, void 0, function* () {
                if (items.length > 0) {
                    this.push(items.shift());
                    setTimeout(addOne, stagger);
                }
            });
            addOne();
        });
    };
    Array.prototype.take = function (count) {
        return this.slice(0, count);
    };
    Array.prototype.replace = function (getNewItems, stagger = 0, getItemKey) {
        return __awaiter(this, void 0, void 0, function* () {
            if (getItemKey) {
                let newItems = yield getNewItems();
                const processNext = (i) => __awaiter(this, void 0, void 0, function* () {
                    if (i > Math.max(this.length, newItems.length))
                        return;
                    if (this[i] && !newItems.contains(this[i], getItemKey))
                        this.removeAt(i);
                    if (newItems[i] && !this.contains(newItems[i], getItemKey))
                        this.insertAt(i, newItems[i], true);
                    setTimeout(() => processNext(i + 1), stagger);
                });
                processNext(0);
            }
            else {
                this.clear(stagger);
                this.add(yield getNewItems(), stagger);
            }
        });
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
            timeout = setTimeout(function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield fn.apply(context, args);
                });
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
                timeout = setTimeout(function () {
                    return __awaiter(this, void 0, void 0, function* () {
                        yield fn.apply(context, fn.prototype.nextArgs);
                        timeout = null;
                    });
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
    constructor() {
        this.queue = [];
        this.locked = false;
    }
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
/***/ (function(__unused_webpack_module, exports) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RepeatingTaskQueue = void 0;
class RepeatingTaskQueue {
    constructor() {
        // Meaning the queue will cycle through all tasks every [cycleInterval] milliseconds
        this.cycleInterval = 1000;
        this.tasks = [];
        this.index = 0;
        this.index = 0;
        this.next();
    }
    static new() {
        const queue = new RepeatingTaskQueue();
        return queue;
    }
    next() {
        return __awaiter(this, void 0, void 0, function* () {
            const task = this.tasks[this.index];
            if (task)
                yield task();
            this.index = (this.index + 1) % this.tasks.length || 0;
            setTimeout(this.next.bind(this), this.cycleInterval / this.tasks.length);
        });
    }
    enqueue(task) {
        this.tasks.push(task);
    }
}
exports.RepeatingTaskQueue = RepeatingTaskQueue;


/***/ }),

/***/ "../../../../../Shared/TwoWayMap.ts":
/*!******************************************!*\
  !*** ../../../../../Shared/TwoWayMap.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TwoWayMap = void 0;
class TwoWayMap {
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
/******/ 	var __webpack_exports__ = __webpack_require__("../../../../LiveIde/Website/script/1689786232860.ts");
/******/ 	
/******/ })()
;