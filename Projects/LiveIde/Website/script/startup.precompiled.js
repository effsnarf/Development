/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "../../../Apps/DatabaseProxy/Client/DbpClient.ts":
/*!*******************************************************!*\
  !*** ../../../Apps/DatabaseProxy/Client/DbpClient.ts ***!
  \*******************************************************/
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

/***/ "./script/1687405849615.ts":
/*!*********************************!*\
  !*** ./script/1687405849615.ts ***!
  \*********************************/
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
const ClientContext_1 = __webpack_require__(/*! ../../classes/ClientContext */ "../classes/ClientContext.ts");
const Params_1 = __webpack_require__(/*! ../../classes/Params */ "../classes/Params.ts");
const DbpClient_1 = __webpack_require__(/*! ../../../../Apps/DatabaseProxy/Client/DbpClient */ "../../../Apps/DatabaseProxy/Client/DbpClient.ts");
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
    yield client.compileAll();
    let ideVueApp = null;
    const dbp = (yield DbpClient_1.DatabaseProxy.new("https://db.memegenerator.net/MemeGenerator"));
    const params = (yield Params_1.Params.new(() => ideVueApp, client.config.params, window.location.pathname));
    ideVueApp = new client.Vue({
        el: "#app",
        data: {
            dbp,
            params: params,
            url: helpers.url,
            comps: client.Vue.ref(client.comps),
            templates: client.templates,
            key1: 1,
            generator: null,
            generators: null,
            instances: null,
        },
        mounted() {
            return __awaiter(this, void 0, void 0, function* () { });
        },
        methods: {
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
                this.key1++;
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
        },
    });
    if (params.urlName) {
        dbp.generators.select.one(null, params.urlName, {
            $set: [ideVueApp, "generator"],
        });
        dbp.generators.select.related(params.urlName, {
            $set: [ideVueApp, "generators"],
        });
    }
    window.ideVueApp = ideVueApp;
}))();


/***/ }),

/***/ "../classes/ClientContext.ts":
/*!***********************************!*\
  !*** ../classes/ClientContext.ts ***!
  \***********************************/
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
const Lock_1 = __webpack_require__(/*! ../../../Shared/Lock */ "../../../Shared/Lock.ts");
const to_template_1 = __importDefault(__webpack_require__(/*! ../../../Shared/WebScript/to.template */ "../../../Shared/WebScript/to.template.ts"));
const ComponentManager_1 = __webpack_require__(/*! ./ComponentManager */ "../classes/ComponentManager.ts");
const ClientDatabase_1 = __webpack_require__(/*! ./ClientDatabase */ "../classes/ClientDatabase.ts");
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
            "style",
            ...[1, 2, 3, 4, 5, 6].map((i) => `h${i}`),
            "pre",
            "p",
            "img",
            "div",
            "span",
            "ul",
            "li",
            "input",
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

/***/ "../classes/ClientDatabase.ts":
/*!************************************!*\
  !*** ../classes/ClientDatabase.ts ***!
  \************************************/
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

/***/ "../classes/Component.ts":
/*!*******************************!*\
  !*** ../classes/Component.ts ***!
  \*******************************/
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
const ClientContext_1 = __webpack_require__(/*! ./ClientContext */ "../classes/ClientContext.ts");
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

/***/ "../classes/ComponentManager.ts":
/*!**************************************!*\
  !*** ../classes/ComponentManager.ts ***!
  \**************************************/
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
const Lock_1 = __webpack_require__(/*! ../../../Shared/Lock */ "../../../Shared/Lock.ts");
const DataWatcher_1 = __webpack_require__(/*! ../../../Shared/DataWatcher */ "../../../Shared/DataWatcher.ts");
const Component_1 = __webpack_require__(/*! ./Component */ "../classes/Component.ts");
const ClientContext_1 = __webpack_require__(/*! ./ClientContext */ "../classes/ClientContext.ts");
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

/***/ "../classes/Params.ts":
/*!****************************!*\
  !*** ../classes/Params.ts ***!
  \****************************/
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

/***/ "../../../Shared/DataWatcher.ts":
/*!**************************************!*\
  !*** ../../../Shared/DataWatcher.ts ***!
  \**************************************/
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
const RepeatingTaskQueue_1 = __webpack_require__(/*! ./RepeatingTaskQueue */ "../../../Shared/RepeatingTaskQueue.ts");
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

/***/ "../../../Shared/Lock.ts":
/*!*******************************!*\
  !*** ../../../Shared/Lock.ts ***!
  \*******************************/
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

/***/ "../../../Shared/RepeatingTaskQueue.ts":
/*!*********************************************!*\
  !*** ../../../Shared/RepeatingTaskQueue.ts ***!
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

/***/ "../../../Shared/WebScript/to.template.ts":
/*!************************************************!*\
  !*** ../../../Shared/WebScript/to.template.ts ***!
  \************************************************/
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
/******/ 	var __webpack_exports__ = __webpack_require__("./script/1687405849615.ts");
/******/ 	
/******/ })()
;