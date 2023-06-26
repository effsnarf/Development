/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "../../../../Apps/DatabaseProxy/Client/DbpClient.ts":
/*!**********************************************************!*\
  !*** ../../../../Apps/DatabaseProxy/Client/DbpClient.ts ***!
  \**********************************************************/
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
            _fetchAsJson || ((url) => __awaiter(this, void 0, void 0, function* () { return yield (yield fetch(url)).json(); }));
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
                        const item = yield this.fetchAsJson(url);
                        //localStorage.setItem(url, JSON.stringify(item));
                        return item;
                    });
                    //const cachedItem = JSON.parse(localStorage.getItem(url) || "null");
                    const cachedItem = null;
                    if (!cachedItem)
                        return yield fetchItem();
                    // Fetch in the background
                    fetchItem();
                    return cachedItem;
                }
                return yield this.fetchAsJson(url);
            }
            // Check the local cache
            //const cachedItem = JSON.parse(localStorage.getItem(url) || "null");
            const cachedItem = null;
            if (cachedItem)
                DatabaseProxy.setValue(options.$set, cachedItem);
            // Fetch in the background
            const item = yield this.fetchAsJson(url);
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
            const argsStr = args
                .map((a) => `${a.name}=${JSON.stringify(a.value || null)}`)
                .join("&");
            const url = `${this.urlBase}/api/${entity}/${group}/${method}?${argsStr}`;
            const result = yield this.fetchJson(url, options);
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

/***/ "../../../LiveIde/Website/script/1687769310546.ts":
/*!********************************************************!*\
  !*** ../../../LiveIde/Website/script/1687769310546.ts ***!
  \********************************************************/
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
__webpack_require__(/*! ../../../../Shared/Extensions */ "../../../../Shared/Extensions.ts");
const AnalyticsTracker_1 = __webpack_require__(/*! ../../classes/AnalyticsTracker */ "../../../LiveIde/classes/AnalyticsTracker.ts");
const ClientContext_1 = __webpack_require__(/*! ../../classes/ClientContext */ "../../../LiveIde/classes/ClientContext.ts");
const Params_1 = __webpack_require__(/*! ../../classes/Params */ "../../../LiveIde/classes/Params.ts");
const DbpClient_1 = __webpack_require__(/*! ../../../../Apps/DatabaseProxy/Client/DbpClient */ "../../../../Apps/DatabaseProxy/Client/DbpClient.ts");
const helpers = {
    url: {
        generator: (generator) => {
            if (!generator)
                return null;
            return `/${generator.urlName}`;
        },
        instance: (instance) => {
            if (!instance)
                return null;
            return `/instance/${instance.instanceID}`;
        },
        image: (imageID) => {
            if (!imageID)
                return null;
            return `https://img.memegenerator.net/images/${imageID}.jpg`;
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
    const dbp = (yield DbpClient_1.DatabaseProxy.new("https://db.memegenerator.net/MemeGenerator"));
    const getNewParams = () => __awaiter(void 0, void 0, void 0, function* () {
        return (yield Params_1.Params.new(() => ideVueApp, client.config.params, window.location.pathname));
    });
    const params = yield getNewParams();
    ideVueApp = new client.Vue({
        el: "#app",
        data: {
            dbp,
            analytics: yield AnalyticsTracker_1.AnalyticsTracker.new(),
            params: params,
            url: helpers.url,
            comps: client.Vue.ref(client.comps),
            templates: client.templates,
            key1: 1,
        },
        mounted() {
            return __awaiter(this, void 0, void 0, function* () { });
        },
        methods: {
            navigateTo(url) {
                return __awaiter(this, void 0, void 0, function* () {
                    window.history.pushState({}, "", url);
                    yield this.refresh();
                });
            },
            compileApp() {
                return __awaiter(this, void 0, void 0, function* () {
                    yield client.compileApp();
                    this.refresh();
                });
            },
            getMoreInstances(pageIndex) {
                return __awaiter(this, void 0, void 0, function* () {
                    const self = this;
                    return yield self.dbp.instances.select.popular("en", pageIndex, self.params.urlName);
                });
            },
            refresh() {
                return __awaiter(this, void 0, void 0, function* () {
                    const self = this;
                    self.params = yield getNewParams();
                    this.key1++;
                });
            },
            getKey(item) {
                if (item.instanceID)
                    return item.instanceID;
                if (item.generatorID)
                    return item.generatorID;
                return null;
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
        },
    });
    window.addEventListener("popstate", function (event) {
        return __awaiter(this, void 0, void 0, function* () {
            yield ideVueApp.refresh();
        });
    });
    window.ideVueApp = ideVueApp;
}))();


/***/ }),

/***/ "../../../LiveIde/classes/AnalyticsTracker.ts":
/*!****************************************************!*\
  !*** ../../../LiveIde/classes/AnalyticsTracker.ts ***!
  \****************************************************/
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

/***/ "../../../LiveIde/classes/ClientContext.ts":
/*!*************************************************!*\
  !*** ../../../LiveIde/classes/ClientContext.ts ***!
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ClientContext = void 0;
const Lock_1 = __webpack_require__(/*! ../../../Shared/Lock */ "../../../../Shared/Lock.ts");
const to_template_1 = __importDefault(__webpack_require__(/*! ../../../Shared/WebScript/to.template */ "../../../../Shared/WebScript/to.template.ts"));
const ComponentManager_1 = __webpack_require__(/*! ./ComponentManager */ "../../../LiveIde/classes/ComponentManager.ts");
const ClientDatabase_1 = __webpack_require__(/*! ./ClientDatabase */ "../../../LiveIde/classes/ClientDatabase.ts");
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
                    attr[0] = attr[0].replace("on_", "@");
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
    isAttributeName(componentNames, name) {
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
            "p",
            "img",
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
            "input",
            "canvas",
            "textarea",
            "component",
        ].includes(name))
            return false;
        if (name.startsWith("."))
            return false;
        if (componentNames.find((c) => c == name.replace(":", "")))
            return false;
        return true;
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
                // Try again
                const url = args[0];
                console.error(`Error fetching ${url}`);
                console.error(ex);
                if (window.location.hostname == "localhost") {
                    ClientContext.alertify
                        .error(`<h3>${url}</h3><pre>${ex.message}</pre>`)
                        .delay(0);
                }
                // Try again
                // Wait a bit
                yield new Promise((resolve) => setTimeout(resolve, 100));
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

/***/ "../../../LiveIde/classes/ClientDatabase.ts":
/*!**************************************************!*\
  !*** ../../../LiveIde/classes/ClientDatabase.ts ***!
  \**************************************************/
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

/***/ "../../../LiveIde/classes/Component.ts":
/*!*********************************************!*\
  !*** ../../../LiveIde/classes/Component.ts ***!
  \*********************************************/
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
const ClientContext_1 = __webpack_require__(/*! ./ClientContext */ "../../../LiveIde/classes/ClientContext.ts");
String.prototype.kebabize = function () {
    return this.replace(/\./g, "-").toLowerCase();
};
class Component {
    constructor(obj) {
        this.name = obj.name;
        this.path = obj.path;
        this.source = obj.source;
        if (this.source)
            this.source.name = this.name.replace(/\./g, "-");
    }
    compile() {
        return __awaiter(this, void 0, void 0, function* () {
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
                        html = html.replace(/on_/g, "@");
                        vueOptions.template = html;
                    }
                    else {
                        const pug = vueOptions.template;
                        let html = (yield client.pugToHtml(pug)) || "";
                        html = html.replace(/on_/g, "@");
                        vueOptions.template = html;
                        this.source.template = html;
                        client.updateComponent(this);
                    }
                }
                client.Vue.component(vueName, vueOptions);
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

/***/ "../../../LiveIde/classes/ComponentManager.ts":
/*!****************************************************!*\
  !*** ../../../LiveIde/classes/ComponentManager.ts ***!
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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ComponentManager = void 0;
const Lock_1 = __webpack_require__(/*! ../../../Shared/Lock */ "../../../../Shared/Lock.ts");
const DataWatcher_1 = __webpack_require__(/*! ../../../Shared/DataWatcher */ "../../../../Shared/DataWatcher.ts");
const Component_1 = __webpack_require__(/*! ./Component */ "../../../LiveIde/classes/Component.ts");
const ClientContext_1 = __webpack_require__(/*! ./ClientContext */ "../../../LiveIde/classes/ClientContext.ts");
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
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (false) {}
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
}
exports.ComponentManager = ComponentManager;


/***/ }),

/***/ "../../../LiveIde/classes/Params.ts":
/*!******************************************!*\
  !*** ../../../LiveIde/classes/Params.ts ***!
  \******************************************/
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

/***/ "../../../../Shared/DataWatcher.ts":
/*!*****************************************!*\
  !*** ../../../../Shared/DataWatcher.ts ***!
  \*****************************************/
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
const RepeatingTaskQueue_1 = __webpack_require__(/*! ./RepeatingTaskQueue */ "../../../../Shared/RepeatingTaskQueue.ts");
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

/***/ "../../../../Shared/Extensions.ts":
/*!****************************************!*\
  !*** ../../../../Shared/Extensions.ts ***!
  \****************************************/
/***/ (() => {


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
        if (this == 0)
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
        return this.toString().colorize(this.getSeverityColor(green, yellow, direction, true));
    };
    Number.prototype.severifyByHttpStatus = function () {
        const value = this.valueOf();
        return value.toString().colorize(value.getHttpSeverityColor());
    };
    Number.prototype.getSeverityColor = function (green, yellow, direction, bgRed) {
        const value = this.valueOf();
        if (direction == "<") {
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
        return `${value.unitify(unitClass).withoutUnit().colorize(color)}${unit.c("gray")}`;
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
    String.prototype.toCamelCase = function () {
        // Lowercase the first letter
        return this.charAt(0).toLowerCase() + this.slice(1);
    };
    String.prototype.parseJSON = function () {
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
        let sum = this.sum(getValue, getWeight);
        let weightSum = this.sum(getWeight);
        return (sum / weightSum).roundTo(3);
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
        return this.map((item, i) => `${(item || "").toLength(columns[i], ellipsis, "right")}`).join(" ");
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
    Array.prototype.sortBy = function (...projects) {
        return this.sort((a, b) => {
            for (const project of [...projects].reverse()) {
                const aVal = project(a);
                const bVal = project(b);
                if (aVal > bVal)
                    return 1;
                if (aVal < bVal)
                    return -1;
            }
            return 0;
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
}
// #endregion


/***/ }),

/***/ "../../../../Shared/Lock.ts":
/*!**********************************!*\
  !*** ../../../../Shared/Lock.ts ***!
  \**********************************/
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

/***/ "../../../../Shared/RepeatingTaskQueue.ts":
/*!************************************************!*\
  !*** ../../../../Shared/RepeatingTaskQueue.ts ***!
  \************************************************/
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

/***/ "../../../../Shared/WebScript/to.template.ts":
/*!***************************************************!*\
  !*** ../../../../Shared/WebScript/to.template.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports["default"] = (context, dom, indent, compName) => {
    if (!dom)
        return [];
    const s = [];
    if (!indent)
        indent = 0;
    dom = JSON.parse(JSON.stringify(dom));
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
            return { key: a[0], value: a[1] };
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
/******/ 	var __webpack_exports__ = __webpack_require__("../../../LiveIde/Website/script/1687769310546.ts");
/******/ 	
/******/ })()
;