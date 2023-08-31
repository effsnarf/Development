/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "../../../LiveIde/Classes/AnalyticsTracker.ts":
/*!****************************************************!*\
  !*** ../../../LiveIde/Classes/AnalyticsTracker.ts ***!
  \****************************************************/
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

/***/ "../../../LiveIde/Classes/ClientContext.ts":
/*!*************************************************!*\
  !*** ../../../LiveIde/Classes/ClientContext.ts ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ClientContext = void 0;
const Lock_1 = __webpack_require__(/*! ../../../Shared/Lock */ "../../../../Shared/Lock.ts");
const to_template_1 = __importDefault(__webpack_require__(/*! ../../../Shared/WebScript/to.template */ "../../../../Shared/WebScript/to.template.ts"));
const is_attribute_name_1 = __importDefault(__webpack_require__(/*! ../../../Shared/WebScript/is.attribute.name */ "../../../../Shared/WebScript/is.attribute.name.ts"));
const ComponentManager_1 = __webpack_require__(/*! ./ComponentManager */ "../../../LiveIde/Classes/ComponentManager.ts");
const ClientDatabase_1 = __webpack_require__(/*! ./ClientDatabase */ "../../../LiveIde/Classes/ClientDatabase.ts");
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
                if (args[0]?.constructor?.name == "ClientContext")
                    args.shift();
                return func(this.compilation.context, ...args);
            });
        }
    }
    async compileAll(filter = (c) => true, mixins = []) {
        for (const comp of this.comps.filter(filter)) {
            await comp.compile(mixins);
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

/***/ "../../../LiveIde/Classes/ClientDatabase.ts":
/*!**************************************************!*\
  !*** ../../../LiveIde/Classes/ClientDatabase.ts ***!
  \**************************************************/
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

/***/ "../../../LiveIde/Classes/Component.ts":
/*!*********************************************!*\
  !*** ../../../LiveIde/Classes/Component.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Component = void 0;
const ClientContext_1 = __webpack_require__(/*! ./ClientContext */ "../../../LiveIde/Classes/ClientContext.ts");
String.prototype.kebabize = function () {
    return this.toString()
        .replace(/\./g, " ")
        .replace(/\-/g, " ")
        .getCaseWords()
        .map((w) => w.toLowerCase())
        .join("-");
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
    async compile(mixins = []) {
        if (this.isCompiled)
            return;
        const logGroup = false;
        const client = await ClientContext_1.ClientContext.get();
        if (logGroup) {
            console.groupCollapsed(this.name);
            console.log(this);
        }
        else {
            console.log(this.name);
        }
        try {
            const vueOptions = await this.getVueOptions();
            const compMixins = mixins.filter((m) => m.matchComp(this));
            vueOptions.mixins = [...(vueOptions.mixins || []), ...compMixins];
            if (logGroup)
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
        finally {
            if (logGroup)
                console.groupEnd();
        }
    }
    async getVueOptions() {
        const client = await ClientContext_1.ClientContext.get();
        let json = client.Handlebars.compile(client.templates.vue)(this.source);
        try {
            const vueOptions = eval(`(${json})`);
            return vueOptions;
        }
        catch (ex) {
            debugger;
            throw ex;
        }
    }
    static toVueName(name) {
        return name.kebabize().replace(/base-/g, "");
    }
}
exports.Component = Component;


/***/ }),

/***/ "../../../LiveIde/Classes/ComponentManager.ts":
/*!****************************************************!*\
  !*** ../../../LiveIde/Classes/ComponentManager.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ComponentManager = void 0;
__webpack_require__(/*! ../../../Shared/Extensions */ "../../../../Shared/Extensions.ts");
const Lock_1 = __webpack_require__(/*! ../../../Shared/Lock */ "../../../../Shared/Lock.ts");
const DataWatcher_1 = __webpack_require__(/*! ../../../Shared/DataWatcher */ "../../../../Shared/DataWatcher.ts");
const Component_1 = __webpack_require__(/*! ./Component */ "../../../LiveIde/Classes/Component.ts");
const ClientContext_1 = __webpack_require__(/*! ./ClientContext */ "../../../LiveIde/Classes/ClientContext.ts");
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

/***/ "../../../LiveIde/Classes/Flow.ts":
/*!****************************************!*\
  !*** ../../../LiveIde/Classes/Flow.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Flow = void 0;
const Events_1 = __webpack_require__(/*! ../../../Shared/Events */ "../../../../Shared/Events.ts");
const Vue = window.Vue;
var Flow;
(function (Flow) {
    class RuntimeData {
        gdb;
        events = new Events_1.Events();
        nodeDatas = Vue.reactive({});
        constructor(gdb) {
            this.gdb = gdb;
            this.gdb.events.on("node.change", this.onNodeChange.bind(this));
        }
        async onNodeChange(node) {
            this.computeNodeData(node);
        }
        async computeNodeData(node) {
            if (node.type == "flow.data.fetch") {
                if (false) {}
                const imageUrls = [
                    "https://cdn.pixabay.com/photo/2016/03/28/12/35/cat-1285634_640.png",
                    "https://cdn.pixabay.com/photo/2015/11/16/14/43/cat-1045782_640.jpg",
                    "https://cdn.pixabay.com/photo/2016/07/10/21/47/cat-1508613_640.jpg",
                    "https://cdn.pixabay.com/photo/2013/05/30/18/21/cat-114782_640.jpg",
                    "https://cdn.pixabay.com/photo/2016/06/14/00/14/cat-1455468_640.jpg",
                    "https://cdn.pixabay.com/photo/2018/05/04/16/50/cat-3374422_640.jpg",
                    "https://cdn.pixabay.com/photo/2020/10/05/10/51/cat-5628953_640.jpg",
                    "https://cdn.pixabay.com/photo/2016/09/07/22/38/cat-1652822_640.jpg",
                    "https://cdn.pixabay.com/photo/2020/06/24/19/41/cat-5337501_640.jpg",
                    "https://cdn.pixabay.com/photo/2015/06/07/19/42/animal-800760_640.jpg",
                ];
                const texts = [
                    "Fluffo the Frog",
                    "Giggly Garry",
                    "MemeMaster Mike",
                    "Chillax Charlie",
                    "Dank Dave",
                    "Lolita Llama",
                    "Pepe's Peculiar Pal",
                    "Roflcopter Rick",
                    "Sassy Sally",
                    "Woke Wendy",
                ];
                const exampleData = imageUrls.map((url, index) => ({
                    id: index,
                    text: texts[index],
                    imageUrl: url,
                }));
                this.setNodeData(node, exampleData);
                return;
                const fetchResponse = await fetch(node.data.url.value);
                const fetchText = await fetchResponse.text();
                let fetchData = JSON.parse(fetchText);
                if (fetchData.result)
                    fetchData = fetchData.result;
                this.setNodeData(node, fetchData);
            }
        }
        onNodeClick(node, contextData) {
            const nodeLinks = this.gdb
                .getNodeLinks(node)
                .filter((l) => l.type == "data.send")
                .filter((l) => l.data.event == "click");
            for (const link of nodeLinks) {
                this.events.emit("link.data.send", link);
            }
            const nodes = nodeLinks
                .map((l) => this.gdb.getNode(l.to))
                .filter((n) => n);
            for (let node of nodes) {
                node = node;
                const data = contextData || this.nodeDatas[node.id];
                this.setNodeData(node, contextData);
            }
        }
        setNodeData(node, data, depth = 0) {
            if (depth > 10) {
                window.alertify.error("setNodeData: max depth reached");
                return;
            }
            this.nodeDatas[node.id] = data;
            this.events.emit("node.data.change", node, data);
            const sendToNodes = this.gdb.getNodes(node, "data.send");
            for (const sendToNode of sendToNodes) {
                const links = this.gdb.getLinks(node, sendToNode);
                for (const link of links) {
                    this.events.emit("link.data.send", link);
                }
                this.setNodeData(sendToNode, data, depth + 1);
            }
        }
    }
    class UserApp {
        gdb;
        events = new Events_1.Events();
        runtimeData;
        constructor(gdb) {
            this.gdb = gdb;
            this.runtimeData = new RuntimeData(gdb);
            this.events.forward(this.runtimeData.events, "runtime.data");
        }
        initialize() {
            const app = this.gdb.addTemplate("app");
        }
        onNodeClick(node, contextData) {
            this.runtimeData.onNodeClick(node, contextData);
        }
        isNodeClickable(node) {
            const nodeLinks = this.gdb
                .getNodeLinks(node)
                .filter((l) => l.from == node.id)
                .filter((l) => l.data.event == "click");
            return nodeLinks.length > 0;
        }
    }
    Flow.UserApp = UserApp;
    class UI {
        vm;
        gdb;
        nodeIdsToVueUids = new Map();
        constructor(vm, gdb) {
            this.vm = vm;
            this.gdb = gdb;
        }
        getNodeVues(node, options = {}) {
            if (!node)
                return [];
            const vueUids = this.nodeIdsToVueUids.get(node.id) || [];
            return this.uidsToVues(vueUids, options);
        }
        getLinkedVues(node, options = {}) {
            const linkedNodes = this.gdb.getLinkedNodes(node);
            const vues = linkedNodes
                .flatMap(this.getNodeVues.bind(this))
                .distinct((vue) => vue._uid);
            return vues;
        }
        uidsToVues(vueUids, options = {}) {
            let vues = vueUids.map((uid) => this.vm.getVue(uid)).filter((vue) => vue);
            vues = vues.except(options.except);
            return vues;
        }
        registerVue(vue) {
            if (!vue.node)
                return;
            const node = vue.node;
            const vueUids = this.nodeIdsToVueUids.get(node.id) || [];
            vueUids.push(vue._uid);
            this.nodeIdsToVueUids.set(node.id, vueUids);
        }
        unregisterVue(vue) {
            if (!vue.node)
                return;
            const node = vue.node;
            const vueUids = this.nodeIdsToVueUids.get(node.id) || [];
            vueUids.removeBy((uid) => uid == vue._uid);
            this.nodeIdsToVueUids.set(node.id, vueUids);
        }
    }
    Flow.UI = UI;
    class Manager {
        vm;
        gdb;
        events = new Events_1.Events();
        ui;
        user = {
            app: null,
        };
        constructor(vm, gdb) {
            this.vm = vm;
            this.gdb = gdb;
            this.ui = new UI(vm, gdb);
            this.user.app = new UserApp(gdb);
            this.events.forward(this.user.app.events, "user.app");
        }
    }
    Flow.Manager = Manager;
})(Flow || (exports.Flow = Flow = {}));


/***/ }),

/***/ "../../../LiveIde/Classes/HtmlHelper.ts":
/*!**********************************************!*\
  !*** ../../../LiveIde/Classes/HtmlHelper.ts ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HtmlHelper = void 0;
const add_paths_1 = __importDefault(__webpack_require__(/*! ../../../Shared/WebScript/add.paths */ "../../../../Shared/WebScript/add.paths.ts"));
class HtmlHelper {
    cssProperties = {
        "align-content": {
            moz: false,
            webkit: true,
            syntax: "(stretch)|(center)|(flex-start)|(flex-end)|(space-between)|(space-around)|(initial)|(inherit)",
            initial: "stretch",
            values: [
                "stretch",
                "center",
                "flex-start",
                "flex-end",
                "space-between",
                "space-around",
                "initial",
                "inherit",
            ],
        },
        "align-items": {
            moz: false,
            webkit: true,
            syntax: "(stretch)|(center)|(flex-start)|(flex-end)|(baseline)|(initial)|(inherit)",
            initial: "stretch",
            values: [
                "stretch",
                "center",
                "flex-start",
                "flex-end",
                "baseline",
                "initial",
                "inherit",
            ],
        },
        "align-self": {
            moz: false,
            webkit: true,
            syntax: "(auto)|(stretch)|(center)|(flex-start)|(flex-end)|(baseline)|(initial)|(inherit)",
            initial: "auto",
            values: [
                "auto",
                "stretch",
                "center",
                "flex-start",
                "flex-end",
                "baseline",
                "initial",
                "inherit",
            ],
        },
        all: {
            moz: false,
            webkit: false,
            syntax: "(initial)|(inherit)|(unset)",
            initial: "none",
            values: ["initial", "inherit", "unset"],
        },
        animation: {
            moz: true,
            webkit: true,
            syntax: "(([prop:animation-name]) ([prop:animation-duration]) ([prop:animation-timing-function]) ([prop:animation-delay]) ([prop:animation-iteration-count]) ([prop:animation-direction]) ([prop:animation-fill-mode]) ([prop:animation-play-state]))|(initial)|(inherit)",
            initial: "none 0 ease 0 1 normal none running",
            values: [
                "[prop:animation-name]",
                "[prop:animation-duration]",
                "[prop:animation-timing-function]",
                "[prop:animation-delay]",
                "[prop:animation-iteration-count]",
                "[prop:animation-direction]",
                "[prop:animation-fill-mode]",
                "[prop:animation-play-state]",
                "initial",
                "inherit",
            ],
        },
        "animation-delay": {
            moz: true,
            webkit: true,
            syntax: "([time])|(initial)|(inherit)",
            initial: "0s",
            values: ["[time]", "initial", "inherit"],
        },
        "animation-direction": {
            moz: true,
            webkit: true,
            syntax: "(normal)|(reverse)|(alternate)|(alternate-reverse)|(initial)|(inherit)",
            initial: "normal",
            values: [
                "normal",
                "reverse",
                "alternate",
                "alternate-reverse",
                "initial",
                "inherit",
            ],
        },
        "animation-duration": {
            moz: true,
            webkit: true,
            syntax: "([time])|(initial)|(inherit)",
            initial: "0",
            values: ["[time]", "initial", "inherit"],
        },
        "animation-fill-mode": {
            moz: true,
            webkit: true,
            syntax: "(none)|(forwards)|(backwards)|(both)|(initial)|(inherit)",
            initial: "none",
            values: ["none", "forwards", "backwards", "both", "initial", "inherit"],
        },
        "animation-iteration-count": {
            moz: true,
            webkit: true,
            syntax: "([number])|(infinite)|(initial)|(inherit)",
            initial: "1",
            values: ["[number]", "infinite", "initial", "inherit"],
        },
        "animation-name": {
            moz: true,
            webkit: true,
            syntax: "([label])|(none)|(initial)|(inherit)",
            initial: "none",
            values: ["[label]", "none", "initial", "inherit"],
        },
        "animation-play-state": {
            moz: true,
            webkit: true,
            syntax: "(paused)|(running)|(initial)|(inherit)",
            initial: "running",
            values: ["paused", "running", "initial", "inherit"],
        },
        "animation-timing-function": {
            moz: true,
            webkit: true,
            syntax: "(linear)|(ease)|(ease-in)|(ease-out)|(ease-in-out)|(step-start)|(step-end)|([steps])|[cubic-bezier]|(initial)|(inherit)",
            initial: "ease",
            values: [
                "linear",
                "ease",
                "ease-in",
                "ease-out",
                "ease-in-out",
                "step-start",
                "step-end",
                "[steps]",
                "cubic-bezier",
                "initial",
                "inherit",
            ],
        },
        "backface-visibility": {
            moz: true,
            webkit: true,
            syntax: "(visible)|(hidden)|(initial)|(inherit)",
            initial: "visible",
            values: ["visible", "hidden", "initial", "inherit"],
        },
        background: {
            moz: false,
            webkit: false,
            syntax: "(([prop:background-color]) ([prop:background-image]) ((([prop:background-position])|([prop:background-size]))) ([prop:background-repeat]) ([prop:background-origin]) ([prop:background-clip]) ([prop:background-attachment]))|(initial)|(inherit)",
            initial: "see individual properties",
            values: [
                "[prop:background-color]",
                "[prop:background-image]",
                "[prop:background-position]",
                "[prop:background-size]",
                "[prop:background-repeat]",
                "[prop:background-origin]",
                "[prop:background-clip]",
                "[prop:background-attachment]",
                "initial",
                "inherit",
            ],
        },
        "background-attachment": {
            moz: false,
            webkit: false,
            syntax: "(scroll)|(fixed)|(local)|(initial)|(inherit)",
            initial: "scroll",
            values: ["scroll", "fixed", "local", "initial", "inherit"],
        },
        "background-blend-mode": {
            moz: false,
            webkit: false,
            syntax: "(normal)|(multiply)|(screen)|(overlay)|(darken)|(lighten)|(color-dodge)|(saturation)|([color])|(luminosity)",
            initial: "normal",
            values: [
                "normal",
                "multiply",
                "screen",
                "overlay",
                "darken",
                "lighten",
                "color-dodge",
                "saturation",
                "[color]",
                "luminosity",
            ],
        },
        "background-clip": {
            moz: false,
            webkit: false,
            syntax: "(border-box)|(padding-box)|(content-box)|(initial)|(inherit)",
            initial: "border-box",
            values: [
                "border-box",
                "padding-box",
                "content-box",
                "initial",
                "inherit",
            ],
        },
        "background-color": {
            moz: false,
            webkit: false,
            syntax: "([color])|(transparent)|(initial)|(inherit)",
            initial: "transparent",
            values: ["[color]", "transparent", "initial", "inherit"],
        },
        "background-image": {
            moz: false,
            webkit: false,
            syntax: "([fn:url])|([fn:linear-gradient])|([fn:radial-gradient])|([fn:repeating-linear-gradient])|([fn:repeating-radial-gradient])|(none)|(initial)|(inherit)",
            initial: "none",
            values: [
                "[fn:url]",
                "none",
                "[fn:linear-gradient]",
                "[fn:radial-gradient]",
                "[fn:repeating-linear-gradient]",
                "[fn:repeating-radial-gradient]",
                "initial",
                "inherit",
            ],
        },
        "background-origin": {
            moz: false,
            webkit: false,
            syntax: "(padding-box)|(border-box)|(content-box)|(initial)|(inherit)",
            initial: "padding-box",
            values: [
                "padding-box",
                "border-box",
                "content-box",
                "initial",
                "inherit",
            ],
        },
        "background-position": {
            moz: false,
            webkit: false,
            syntax: "(left top)|(left center)|(left bottom)|(right top)|(right center)|(right bottom)|(center top)|(center center)|(center bottom)|([percent]){2,2}|([length]){2,2}|(initial)|(inherit)",
            initial: "0% 0%",
            values: [
                "left top",
                "left center",
                "left bottom",
                "right top",
                "right center",
                "right bottom",
                "center top",
                "center center",
                "center bottom",
                "([percent]){2,2}",
                "([length]){2,2}",
                "initial",
                "inherit",
            ],
        },
        "background-repeat": {
            moz: false,
            webkit: false,
            syntax: "(repeat)|(repeat-x)|(repeat-y)|(no-repeat)|(initial)|(inherit)",
            initial: "repeat",
            values: [
                "repeat",
                "repeat-x",
                "repeat-y",
                "no-repeat",
                "space",
                "round",
                "initial",
                "inherit",
            ],
        },
        "background-size": {
            moz: true,
            webkit: true,
            syntax: "(auto)|([length])|(cover)|(contain)|(initial)|(inherit)",
            initial: "auto",
            values: [
                "auto",
                "[length]",
                "percentage",
                "cover",
                "contain",
                "initial",
                "inherit",
            ],
        },
        border: {
            moz: false,
            webkit: false,
            syntax: "(([prop:border-width]) ([prop:border-style]) ([prop:border-color]))|(initial)|(inherit)",
            initial: "medium none color",
            values: [
                "[prop:border-width]",
                "[prop:border-style]",
                "[prop:border-color]",
                "initial",
                "inherit",
            ],
        },
        "border-bottom": {
            moz: false,
            webkit: false,
            syntax: "([prop:border-bottom-width]) ([prop:border-bottom-style]) ([prop:border-bottom-color])|(initial)|(inherit)",
            initial: "medium none color",
            values: [
                "[prop:border-bottom-width]",
                "[prop:border-bottom-style]",
                "[prop:border-bottom-color]",
                "initial",
                "inherit",
            ],
        },
        "border-bottom-color": {
            moz: false,
            webkit: false,
            syntax: "([color])|(transparent)|(initial)|(inherit)",
            initial: "The current color of the element",
            values: ["[color]", "transparent", "initial", "inherit"],
        },
        "border-bottom-left-radius": {
            moz: true,
            webkit: true,
            syntax: "(([length])|([percent])){1,2}|(initial)|(inherit)",
            initial: "0",
            values: ["[length]", "[percent]", "initial", "inherit"],
        },
        "border-bottom-right-radius": {
            moz: true,
            webkit: true,
            syntax: "(([length])|([percent])){1,2}|(initial)|(inherit)",
            initial: "0",
            values: ["[length]", "[percent]", "initial", "inherit"],
        },
        "border-bottom-style": {
            moz: false,
            webkit: false,
            syntax: "(none)|(hidden)|(dotted)|(dashed)|(solid)|(double)|(groove)|(ridge)|(inset)|(outset)|(initial)|(inherit)",
            initial: "none",
            values: [
                "none",
                "hidden",
                "dotted",
                "dashed",
                "solid",
                "double",
                "groove",
                "ridge",
                "inset",
                "outset",
                "initial",
                "inherit",
            ],
        },
        "border-bottom-width": {
            moz: false,
            webkit: false,
            syntax: "(medium)|(thin)|(thick)|([length])|(initial)|(inherit)",
            initial: "medium",
            values: ["medium", "thin", "thick", "[length]", "initial", "inherit"],
        },
        "border-collapse": {
            moz: false,
            webkit: false,
            syntax: "(separate)|(collapse)|(initial)|(inherit)",
            initial: "separate",
            values: ["separate", "collapse", "initial", "inherit"],
        },
        "border-color": {
            moz: false,
            webkit: false,
            syntax: "([color])|(transparent)|(initial)|(inherit)",
            initial: "The current color of the element",
            values: ["[color]", "transparent", "initial", "inherit"],
        },
        "border-image": {
            moz: true,
            webkit: true,
            syntax: "(([prop:border-image-source]) ([prop:border-image-slice]) ([prop:border-image-width]) ([prop:border-image-outset]) ([prop:border-image-repeat]))|(initial)|(inherit)",
            initial: "none 100% 1 0 stretch",
            values: [
                "[prop:border-image-source]",
                "[prop:border-image-slice]",
                "[prop:border-image-width]",
                "[prop:border-image-outset]",
                "[prop:border-image-repeat]",
                "initial",
                "inherit",
            ],
        },
        "border-image-outset": {
            moz: false,
            webkit: false,
            syntax: "([length])|([number])|(initial)|(inherit)",
            initial: "0",
            values: ["[length]", "[number]", "initial", "inherit"],
        },
        "border-image-repeat": {
            moz: false,
            webkit: false,
            syntax: "(stretch)|(repeat)|(round)|(initial)|(inherit)",
            initial: "stretch",
            values: ["stretch", "repeat", "round", "space", "initial", "inherit"],
        },
        "border-image-slice": {
            moz: false,
            webkit: false,
            syntax: "([number])|([percent])|(fill)|(initial)|(inherit)",
            initial: "100%",
            values: ["[number]", "[percent]", "fill", "initial", "inherit"],
        },
        "border-image-source": {
            moz: false,
            webkit: false,
            syntax: "(none)|(image)|(initial)|(inherit)",
            initial: "none",
            values: ["none", "image", "initial", "inherit"],
        },
        "border-image-width": {
            moz: false,
            webkit: false,
            syntax: "([number])|([percent])|(auto)|(initial)|(inherit)",
            initial: "1",
            values: [
                "[length]",
                "[number]",
                "[percent]",
                "auto",
                "initial",
                "inherit",
            ],
        },
        "border-left": {
            moz: false,
            webkit: false,
            syntax: "(([prop:border-left-width]) ([prop:border-left-style]) ([prop:border-left-color]))|(initial)|(inherit)",
            initial: "medium none color",
            values: [
                "[prop:border-left-width]",
                "[prop:border-left-style]",
                "[prop:border-left-color]",
                "initial",
                "inherit",
            ],
        },
        "border-left-color": {
            moz: false,
            webkit: false,
            syntax: "([color])|(transparent)|(initial)|(inherit)",
            initial: "The current color of the element",
            values: ["[color]", "transparent", "initial", "inherit"],
        },
        "border-left-style": {
            moz: false,
            webkit: false,
            syntax: "(none)|(hidden)|(dotted)|(dashed)|(solid)|(double)|(groove)|(ridge)|(inset)|(outset)|(initial)|(inherit)",
            initial: "none",
            values: [
                "none",
                "hidden",
                "dotted",
                "dashed",
                "solid",
                "double",
                "groove",
                "ridge",
                "inset",
                "outset",
                "initial",
                "inherit",
            ],
        },
        "border-left-width": {
            moz: false,
            webkit: false,
            syntax: "(medium)|(thin)|(thick)|([length])|(initial)|(inherit)",
            initial: "medium",
            values: ["medium", "thin", "thick", "[length]", "initial", "inherit"],
        },
        "border-radius": {
            moz: true,
            webkit: true,
            syntax: "(([length])|[percent]){1:4}|(initial)|(inherit)",
            initial: "0",
            values: ["[length]", "[percent]", "initial", "inherit"],
        },
        "border-right": {
            moz: false,
            webkit: false,
            syntax: "(([prop:border-width]) ([prop:border-style]) ([prop:border-color]))|(initial)|(inherit)",
            initial: "medium none color",
            values: [
                "[prop:border-right-width]",
                "[prop:border-right-style]",
                "[prop:border-right-color]",
                "initial",
                "inherit",
            ],
        },
        "border-right-color": {
            moz: false,
            webkit: false,
            syntax: "([color])|(transparent)|(initial)|(inherit)",
            initial: "black",
            values: ["[color]", "transparent", "initial", "inherit"],
        },
        "border-right-style": {
            moz: false,
            webkit: false,
            syntax: "(none)|(hidden)|(dotted)|(dashed)|(solid)|(double)|(groove)|(ridge)|(inset)|(outset)|(initial)|(inherit)",
            initial: "none",
            values: [
                "none",
                "hidden",
                "dotted",
                "dashed",
                "solid",
                "double",
                "groove",
                "ridge",
                "inset",
                "outset",
                "initial",
                "inherit",
            ],
        },
        "border-right-width": {
            moz: false,
            webkit: false,
            syntax: "(medium)|(thin)|(thick)|([length])|(initial)|(inherit)",
            initial: "medium",
            values: ["medium", "thin", "thick", "[length]", "initial", "inherit"],
        },
        "border-spacing": {
            moz: false,
            webkit: false,
            syntax: "([length]){1,2}|(initial)|(inherit)",
            initial: "2px",
            values: ["[length]", "initial", "inherit"],
        },
        "border-style": {
            moz: false,
            webkit: false,
            syntax: "(none)|(hidden)|(dotted)|(dashed)|(solid)|(double)|(groove)|(ridge)|(inset)|(outset)|(initial)|(inherit)",
            initial: "none",
            values: [
                "none",
                "hidden",
                "dotted",
                "dashed",
                "solid",
                "double",
                "groove",
                "ridge",
                "inset",
                "outset",
                "initial",
                "inherit",
            ],
        },
        "border-top": {
            moz: false,
            webkit: false,
            syntax: "(([prop:border-left-width]) ([prop:border-left-style]) ([prop:border-left-color]))|(initial)|(inherit)",
            initial: "medium none color",
            values: [
                "[prop:border-top-width]",
                "[prop:border-top-style]",
                "[prop:border-top-color]",
                "initial",
                "inherit",
            ],
        },
        "border-top-color": {
            moz: false,
            webkit: false,
            syntax: "([color])|(transparent)|(initial)|(inherit)",
            initial: "The current color of the element",
            values: ["[color]", "transparent", "initial", "inherit"],
        },
        "border-top-left-radius": {
            moz: true,
            webkit: true,
            syntax: "(([length])|[percent]){1,2}|(initial)|(inherit)",
            initial: "0",
            values: ["[length]", "[percent]", "initial", "inherit"],
        },
        "border-top-right-radius": {
            moz: true,
            webkit: true,
            syntax: "(([length])|[percent]){1,2}|(initial)|(inherit)",
            initial: "0",
            values: ["[length]", "[percent]", "initial", "inherit"],
        },
        "border-top-style": {
            moz: false,
            webkit: false,
            syntax: "(none)|(hidden)|(dotted)|(dashed)|(solid)|(double)|(groove)|(ridge)|(inset)|(outset)|(initial)|(inherit)",
            initial: "none",
            values: [
                "none",
                "hidden",
                "dotted",
                "dashed",
                "solid",
                "double",
                "groove",
                "ridge",
                "inset",
                "outset",
                "initial",
                "inherit",
            ],
        },
        "border-top-width": {
            moz: false,
            webkit: false,
            syntax: "(medium)|(thin)|(thick)|([length])|(initial)|(inherit)",
            initial: "medium",
            values: ["medium", "thin", "thick", "[length]", "initial", "inherit"],
        },
        "border-width": {
            moz: false,
            webkit: false,
            syntax: "(medium)|(thin)|(thick)|([length])|(initial)|(inherit)",
            initial: "medium",
            values: ["medium", "thin", "thick", "[length]", "initial", "inherit"],
        },
        bottom: {
            moz: false,
            webkit: false,
            syntax: "(auto)|([length])|(initial)|(inherit)",
            initial: "auto",
            values: ["auto", "[length]", "[percent]", "initial", "inherit"],
        },
        "box-decoration-break": {
            moz: false,
            webkit: true,
            syntax: "(slice)|(clone)|(initial)|(inherit)|(unset)",
            initial: "slice",
            values: ["slice", "clone", "initial", "inherit"],
        },
        "box-shadow": {
            moz: true,
            webkit: true,
            syntax: "(none)|(h-offset) v-offset blur spread color |(inset)|(initial)|(inherit)",
            initial: "none",
            values: [
                "none",
                "h-offset",
                "v-offset",
                "blur",
                "spread",
                "[color]",
                "inset",
                "initial",
                "inherit",
            ],
        },
        "box-sizing": {
            moz: true,
            webkit: true,
            syntax: "(content-box)|(border-box)|(initial)|(inherit)",
            initial: "content-box",
            values: ["content-box", "border-box", "initial", "inherit"],
        },
        "caption-side": {
            moz: false,
            webkit: false,
            syntax: "(top)|(bottom)|(initial)|(inherit)",
            initial: "top",
            values: ["top", "bottom", "initial", "inherit"],
        },
        "caret-color": {
            moz: false,
            webkit: false,
            syntax: "(auto)|([color])",
            initial: "auto",
            values: ["auto", "[color]"],
        },
        "@charset": {
            moz: false,
            webkit: false,
            syntax: '@charset "charset"',
            initial: "charset",
            values: ["charset"],
        },
        clear: {
            moz: false,
            webkit: false,
            syntax: "(none)|(left)|(right)|(both)|(initial)|(inherit)",
            initial: "none",
            values: ["none", "left", "right", "both", "initial", "inherit"],
        },
        clip: {
            moz: false,
            webkit: false,
            syntax: "(auto)|(shape)|(initial)|(inherit)",
            initial: "auto",
            values: ["auto", "shape", "initial", "inherit"],
        },
        color: {
            moz: false,
            webkit: false,
            syntax: "([color])|(initial)|(inherit)",
            initial: "not specified",
            values: ["[color]", "initial", "inherit"],
        },
        "column-count": {
            moz: true,
            webkit: true,
            syntax: "([number])|(auto)|(initial)|(inherit)",
            initial: "auto",
            values: ["[number]", "auto", "initial", "inherit"],
        },
        "column-fill": {
            moz: true,
            webkit: true,
            syntax: "(balance)|(auto)|(initial)|(inherit)",
            initial: "balance",
            values: ["balance", "auto", "initial", "inherit"],
        },
        "column-gap": {
            moz: true,
            webkit: true,
            syntax: "([length])|(normal)|(initial)|(inherit)",
            initial: "normal",
            values: ["[length]", "normal", "initial", "inherit"],
        },
        "column-rule": {
            moz: true,
            webkit: true,
            syntax: "(([prop:column-rule-width]) ([prop:column-rule-style]) ([prop:column-rule-color]))|(initial)|(inherit)",
            initial: "medium none color",
            values: [
                "[prop:column-rule-width]",
                "[prop:column-rule-style]",
                "[prop:column-rule-color]",
                "initial",
                "inherit",
            ],
        },
        "column-rule-color": {
            moz: true,
            webkit: true,
            syntax: "([color])|(initial)|(inherit)",
            initial: "The current color of the element",
            values: ["[color]", "initial", "inherit"],
        },
        "column-rule-style": {
            moz: true,
            webkit: true,
            syntax: "(none)|(hidden)|(dotted)|(dashed)|(solid)|(double)|(groove)|(ridge)|(inset)|(outset)|(initial)|(inherit)",
            initial: "none",
            values: [
                "none",
                "hidden",
                "dotted",
                "dashed",
                "solid",
                "double",
                "groove",
                "ridge",
                "inset",
                "outset",
                "initial",
                "inherit",
            ],
        },
        "column-rule-width": {
            moz: true,
            webkit: true,
            syntax: "(medium)|(thin)|(thick)|([length])|(initial)|(inherit)",
            initial: "medium",
            values: ["medium", "thin", "thick", "[length]", "initial", "inherit"],
        },
        "column-span": {
            moz: false,
            webkit: true,
            syntax: "(none)|(all)|(initial)|(inherit)",
            initial: "none",
            values: ["none", "all", "initial", "inherit"],
        },
        "column-width": {
            moz: true,
            webkit: true,
            syntax: "(auto)|([length])|(initial)|(inherit)",
            initial: "auto",
            values: ["auto", "[length]", "initial", "inherit"],
        },
        columns: {
            moz: true,
            webkit: true,
            syntax: "(auto)|(([prop:column-width]) ([prop:column-count]))|(initial)|(inherit)",
            initial: "auto auto",
            values: [
                "auto",
                "[prop:column-width]",
                "[prop:column-count]",
                "initial",
                "inherit",
            ],
        },
        content: {
            moz: false,
            webkit: false,
            syntax: "(normal)|(none)|(counter)|(attr)|(string)|(open-quote)|(close-quote)|(no-open-quote)|(no-close-quote)|(url)|(initial)|(inherit)",
            initial: "normal",
            values: [
                "normal",
                "none",
                "counter",
                "attr(attribute)",
                "string",
                "open-quote",
                "close-quote",
                "no-open-quote",
                "no-close-quote",
                "url(url)",
                "initial",
                "inherit",
            ],
        },
        "counter-increment": {
            moz: false,
            webkit: false,
            syntax: "(none)|([number])|(initial)|(inherit)",
            initial: "none",
            values: ["none", "[number]", "initial", "inherit"],
        },
        "counter-reset": {
            moz: false,
            webkit: false,
            syntax: "(none)|([number])|(initial)|(inherit)",
            initial: "none",
            values: ["none", "[number]", "initial", "inherit"],
        },
        cursor: {
            moz: false,
            webkit: false,
            syntax: "(alias)|(all-scroll)|(auto)|(cell)|(context-menu)|(col-resize)|(copy)|(crosshair)|(default)|(e-resize)|(ew-resize)|(grab)|(grabbing)|(help)|(move)|(n-resize)|(ne-resize)|(nesw-resize)|(ns-resize)|(nw-resize)|(nwse-resize)|(no-drop)|(none)|(not-allowed)|(pointer)|(progress)|(row-resize)|(s-resize)|(se-resize)|(sw-resize)|(text)|(URL)|(vertical-text)|(w-resize)|(wait)|(zoom-in)|(zoom-out)|(initial)|(inherit)",
            initial: "auto",
            values: [
                "alias",
                "all-scroll",
                "auto",
                "cell",
                "context-menu",
                "col-resize",
                "copy",
                "crosshair",
                "default",
                "e-resize",
                "ew-resize",
                "grab",
                "grabbing",
                "help",
                "move",
                "n-resize",
                "ne-resize",
                "nesw-resize",
                "ns-resize",
                "nw-resize",
                "nwse-resize",
                "no-drop",
                "none",
                "not-allowed",
                "pointer",
                "progress",
                "row-resize",
                "s-resize",
                "se-resize",
                "sw-resize",
                "text",
                "URL",
                "vertical-text",
                "w-resize",
                "wait",
                "zoom-in",
                "zoom-out",
                "initial",
                "inherit",
            ],
        },
        direction: {
            moz: false,
            webkit: false,
            syntax: "(ltr)|(rtl)|(initial)|(inherit)",
            initial: "ltr",
            values: ["ltr", "rtl", "initial", "inherit"],
        },
        display: {
            moz: false,
            webkit: false,
            syntax: "(inline)|(block)|(contents)|(flex)|(grid)|(inline-block)|(inline-flex)|(inline-grid)|(inline-table)|(list-item)|(run-in)|(table)|(table-caption)|(table-column-group)|(table-header-group)|(table-footer-group)|(table-row-group)|(table-cell)|(table-column)|(table-row)|(none)|(initial)|(inherit)",
            initial: "",
            values: [
                "inline",
                "block",
                "contents",
                "flex",
                "grid",
                "inline-block",
                "inline-flex",
                "inline-grid",
                "inline-table",
                "list-item",
                "run-in",
                "table",
                "table-caption",
                "table-column-group",
                "table-header-group",
                "table-footer-group",
                "table-row-group",
                "table-cell",
                "table-column",
                "table-row",
                "none",
                "initial",
                "inherit",
            ],
        },
        "empty-cells": {
            moz: false,
            webkit: false,
            syntax: "(show)|(hide)|(initial)|(inherit)",
            initial: "show",
            values: ["show", "hide", "initial", "inherit"],
        },
        filter: {
            moz: false,
            webkit: true,
            syntax: "(none)|([fn:blur])|([fn:brightness])|([fn:contrast])|([fn:drop-shadow])|([fn:grayscale])|([fn:hue-rotate])|([fn:invert])|([fn:opacity])|([fn:saturate])|([fn:sepia])|([fn:url])",
            initial: "none",
            values: [
                "none",
                "[fn:blur]",
                "[fn:brightness]",
                "[fn:contrast]",
                "[fn:drop-shadow]",
                "[fn:grayscale]",
                "[fn:hue-rotate]",
                "[fn:invert]",
                "[fn:opacity]",
                "[fn:saturate]",
                "[fn:sepia]",
                "[fn:url]",
                "initial",
                "inherit",
            ],
        },
        flex: {
            moz: true,
            webkit: true,
            syntax: "(([prop:flex-grow]) ([prop:flex-shrink]) ([prop:flex-basis]))|(auto)|(initial)|(inherit)",
            initial: "0 1 auto",
            values: [
                "[prop:flex-grow]",
                "[prop:flex-shrink]",
                "[prop:flex-basis]",
                "auto",
                "initial",
                "none",
                "inherit",
            ],
        },
        "flex-basis": {
            moz: true,
            webkit: true,
            syntax: "([number])|(auto)|(initial)|(inherit)",
            initial: "auto",
            values: ["[number]", "auto", "initial", "inherit"],
        },
        "flex-direction": {
            moz: true,
            webkit: true,
            syntax: "(row)|(row-reverse)|(column)|(column-reverse)|(initial)|(inherit)",
            initial: "row",
            values: [
                "row",
                "row-reverse",
                "column",
                "column-reverse",
                "initial",
                "inherit",
            ],
        },
        "flex-flow": {
            moz: true,
            webkit: true,
            syntax: "flex-direction (flex-wrap)|(initial)|(inherit)",
            initial: "row nowrap",
            values: ["flex-direction", "flex-wrap", "initial", "inherit"],
        },
        "flex-grow": {
            moz: true,
            webkit: true,
            syntax: "([number])|(initial)|(inherit)",
            initial: "0",
            values: ["[number]", "initial", "inherit"],
        },
        "flex-shrink": {
            moz: true,
            webkit: true,
            syntax: "([number])|(initial)|(inherit)",
            initial: "1",
            values: ["[number]", "initial", "inherit"],
        },
        "flex-wrap": {
            moz: true,
            webkit: true,
            syntax: "(nowrap)|(wrap)|(wrap-reverse)|(initial)|(inherit)",
            initial: "nowrap",
            values: ["nowrap", "wrap", "wrap-reverse", "initial", "inherit"],
        },
        float: {
            moz: false,
            webkit: false,
            syntax: "(none)|(left)|(right)|(initial)|(inherit)",
            initial: "none",
            values: ["none", "left", "right", "initial", "inherit"],
        },
        font: {
            moz: false,
            webkit: false,
            syntax: "font-style font-variant font-weight font-size/line-height (font-family)|(caption)|(icon)|(menu)|(message-box)|(small-caption)|(status-bar)|(initial)|(inherit)",
            initial: "The default value of the font properties",
            values: [
                "[prop:font-style]",
                "[prop:font-variant]",
                "[prop:font-weight]",
                "[prop:font-size/line-height]",
                "[prop:font-family]",
                "caption",
                "icon",
                "menu",
                "message-box",
                "small-caption",
                "status-bar",
                "initial",
                "inherit",
            ],
        },
        "font-family": {
            moz: false,
            webkit: false,
            syntax: "([family-name])|([generic-family])|(initial)|(inherit)",
            initial: "depends on the browser",
            values: ["[family-name]", "[generic-family]", "initial", "inherit"],
        },
        "font-kerning": {
            moz: false,
            webkit: true,
            syntax: "(auto)|(normal)|(none)",
            initial: "auto",
            values: ["auto", "normal", "none"],
        },
        "font-size": {
            moz: false,
            webkit: false,
            syntax: "([length])|([percent])|(medium)|(xx-small)|(x-small)|(small)|(large)|(x-large)|(xx-large)|(smaller)|(larger)|([length])|(initial)|(inherit)",
            initial: "medium",
            values: [
                "medium",
                "xx-small",
                "x-small",
                "small",
                "large",
                "x-large",
                "xx-large",
                "smaller",
                "larger",
                "[length]",
                "[percent]",
                "initial",
                "inherit",
            ],
        },
        "font-size-adjust": {
            moz: false,
            webkit: false,
            syntax: "([number])|(none)|(initial)|(inherit)",
            initial: "none",
            values: ["[number]", "none", "initial", "inherit"],
        },
        "font-stretch": {
            moz: false,
            webkit: false,
            syntax: "(ultra-condensed)|(extra-condensed)|(condensed)|(semi-condensed)|(normal)|(semi-expanded)|(expanded)|(extra-expanded)|(ultra-expanded)|(initial)|(inherit)",
            initial: "normal",
            values: [
                "ultra-condensed",
                "extra-condensed",
                "condensed",
                "semi-condensed",
                "normal",
                "semi-expanded",
                "expanded",
                "extra-expanded",
                "ultra-expanded",
                "initial",
                "inherit",
            ],
        },
        "font-style": {
            moz: false,
            webkit: false,
            syntax: "(normal)|(italic)|(oblique)|(initial)|(inherit)",
            initial: "normal",
            values: ["normal", "italic", "oblique", "initial", "inherit"],
        },
        "font-variant": {
            moz: false,
            webkit: false,
            syntax: "(normal)|(small-caps)|(initial)|(inherit)",
            initial: "normal",
            values: ["normal", "small-caps", "initial", "inherit"],
        },
        "font-weight": {
            moz: false,
            webkit: false,
            syntax: "(normal)|(bold)|(bolder)|(lighter)|([number])|(initial)|(inherit)",
            initial: "normal",
            values: [
                "normal",
                "bold",
                "bolder",
                "lighter",
                "100",
                "200",
                "300",
                "400",
                "500",
                "600",
                "700",
                "800",
                "900",
                "initial",
                "inherit",
            ],
        },
        grid: {
            moz: false,
            webkit: false,
            syntax: "(none)|(grid-template-rows) / (grid-template-columns)|(grid-template-areas)|(grid-template-rows) / [grid-auto-flow] (grid-auto-columns)|[grid-auto-flow] grid-auto-rows / (grid-template-columns)|(initial)|(inherit)",
            initial: "none none none auto auto row",
            values: [
                "none",
                "grid-template rows / grid-template-columns",
                "grid-template-areas",
                "grid-template rows / grid-auto-columns",
                "grid-auto-rows / grid-template-columns",
                "grid-template rows / grid-auto-flow grid-auto-columns",
                "grid-auto flow grid-auto-rows / grid-template-columns",
                "initial",
                "inherit",
            ],
        },
        "grid-area": {
            moz: false,
            webkit: false,
            syntax: "(([prop:grid-row-start]) / ([prop:grid-column-start]) / ([prop:grid-row-end]) / ([prop:grid-row-end]))|([label])",
            initial: "auto / auto / auto / auto",
            values: [
                "[prop:grid-row-start]",
                "[prop:grid-column-start]",
                "[prop:grid-row-end]",
                "[prop:grid-column-end]",
                "[label]",
            ],
        },
        "grid-auto-columns": {
            moz: false,
            webkit: false,
            syntax: "(auto)|(max-content)|(min-content)|([length])|([percent])|([fn:fit-content])|([fn:minmax])",
            initial: "auto",
            values: [
                "auto",
                "[fn:fit-content]",
                "max-content",
                "min-content",
                "[fn:minmax]",
                "[length]",
                "[percent]",
            ],
        },
        "grid-auto-flow": {
            moz: false,
            webkit: false,
            syntax: "(row)|(column)|(dense)|(row dense)|(column dense)",
            initial: "row",
            values: ["row", "column", "dense", "row dense", "column dense"],
        },
        "grid-auto-rows": {
            moz: false,
            webkit: false,
            syntax: "(auto)|(max-content)|(min-content)|([length])",
            initial: "auto",
            values: ["auto", "max-content", "min-content", "[length]"],
        },
        "grid-column": {
            moz: false,
            webkit: false,
            syntax: "grid-column-start / grid-column-end",
            initial: "auto / auto",
            values: ["[prop:grid-column-start]", "[prop:grid-column-end]"],
        },
        "grid-column-end": {
            moz: false,
            webkit: false,
            syntax: "(auto)|((span) ([number]))|(column-line)",
            initial: "auto",
            values: ["auto", "(span) ([number])", "column-line"],
        },
        "grid-column-gap": {
            moz: false,
            webkit: false,
            syntax: "[length]",
            initial: "0",
            values: ["[length]"],
        },
        "grid-column-start": {
            moz: false,
            webkit: false,
            syntax: "(auto)|((span) ([number]))|(column-line)",
            initial: "auto",
            values: ["auto", "(span) ([number])", "column-line"],
        },
        "grid-gap": {
            moz: false,
            webkit: false,
            syntax: "([prop:grid-row-gap]) ([prop:grid-column-gap])",
            initial: "0 0",
            values: ["[prop:grid-row-gap]", "[prop:grid-column-gap]"],
        },
        "grid-row": {
            moz: false,
            webkit: false,
            syntax: "([prop:grid-row-start]) / ([prop:grid-row-end])",
            initial: "auto / auto",
            values: ["[prop:grid-row-start]", "[prop:grid-row-end]"],
        },
        "grid-row-end": {
            moz: false,
            webkit: false,
            syntax: "(auto)|(row-line)|((span) ([number]))|(column-line)",
            initial: "auto",
            values: ["auto", "(span) ([number])", "column-line"],
        },
        "grid-row-gap": {
            moz: false,
            webkit: false,
            syntax: "[length]",
            initial: "0",
            values: ["[length]"],
        },
        "grid-row-start": {
            moz: false,
            webkit: false,
            syntax: "(auto)|(row-line)",
            initial: "auto",
            values: ["auto", "row-line"],
        },
        "grid-template": {
            moz: false,
            webkit: false,
            syntax: "(none)|(grid-template-rows) / (grid-template-columns)|(grid-template-areas)|(initial)|(inherit)",
            initial: "none none none",
            values: [
                "none",
                "grid-template rows / grid-template-columns",
                "grid-template-areas",
                "initial",
                "inherit",
            ],
        },
        "grid-template-areas": {
            moz: false,
            webkit: false,
            syntax: "(none)|(itemnames)",
            initial: "none",
            values: ["none", "itemnames"],
        },
        "grid-template-columns": {
            moz: false,
            webkit: false,
            syntax: "(none)|(auto)|(max-content)|(min-content)|([length])|(initial)|(inherit)",
            initial: "none",
            values: [
                "none",
                "auto",
                "max-content",
                "min-content",
                "[length]",
                "initial",
                "inherit",
            ],
        },
        "grid-template-rows": {
            moz: false,
            webkit: false,
            syntax: "(none)|(auto)|(max-content)|(min-content)|([length])|(initial)|(inherit)",
            initial: "none",
            values: ["none", "auto", "max-content", "min-content", "[length]"],
        },
        "hanging-punctuation": {
            moz: false,
            webkit: false,
            syntax: "(none)|(first)|(last)|(allow-end)|(force-end)|(initial)|(inherit)",
            initial: "none",
            values: [
                "none",
                "first",
                "last",
                "allow-end",
                "force-end",
                "initial",
                "inherit",
            ],
        },
        height: {
            moz: false,
            webkit: false,
            syntax: "(auto)|([length])|(initial)|(inherit)",
            initial: "auto",
            values: ["auto", "[length]", "[percent]", "initial", "inherit"],
        },
        hyphens: {
            moz: false,
            webkit: true,
            syntax: "(none)|(manual)|(auto)|(initial)|(inherit)",
            initial: "manual",
            values: ["none", "manual", "auto", "initial", "inherit"],
        },
        isolation: {
            moz: false,
            webkit: false,
            syntax: "(auto)|(isolate)|(initial)|(inherit)",
            initial: "auto",
            values: ["auto", "isolate", "initial", "inherit"],
        },
        "justify-content": {
            moz: true,
            webkit: true,
            syntax: "(flex-start)|(flex-end)|(center)|(space-between)|(space-around)|(initial)|(inherit)",
            initial: "flex-start",
            values: [
                "flex-start",
                "flex-end",
                "center",
                "space-between",
                "space-around",
                "initial",
                "inherit",
            ],
        },
        left: {
            moz: false,
            webkit: false,
            syntax: "(auto)|([length])|(initial)|(inherit)",
            initial: "auto",
            values: ["auto", "[length]", "[percent]", "initial", "inherit"],
        },
        "letter-spacing": {
            moz: false,
            webkit: false,
            syntax: "(normal)|([length])|(initial)|(inherit)",
            initial: "normal",
            values: ["normal", "[length]", "initial", "inherit"],
        },
        "line-height": {
            moz: false,
            webkit: false,
            syntax: "(normal)|([number])|([length])|(initial)|(inherit)",
            initial: "normal",
            values: [
                "normal",
                "[number]",
                "[length]",
                "[percent]",
                "initial",
                "inherit",
            ],
        },
        "list-style": {
            moz: false,
            webkit: false,
            syntax: "(([prop:list-style-type]) ([prop:list-style-position]) ([prop:list-style-image]))|(initial)|(inherit)",
            initial: "disc outside none",
            values: [
                "[prop:list-style-type]",
                "[prop:list-style-position]",
                "[prop:list-style-image]",
                "initial",
                "inherit",
            ],
        },
        "list-style-image": {
            moz: false,
            webkit: false,
            syntax: "(none)|(url)|(initial)|(inherit)",
            initial: "none",
            values: ["none", "url", "initial", "inherit"],
        },
        "list-style-position": {
            moz: false,
            webkit: false,
            syntax: "(inside)|(outside)|(initial)|(inherit)",
            initial: "outside",
            values: ["inside", "outside", "initial", "inherit"],
        },
        "list-style-type": {
            moz: false,
            webkit: false,
            syntax: "(disc)|(armenian)|(circle)|(cjk-ideographic)|(decimal)|(decimal-leading-zero)|(georgian)|(hebrew)|(hiragana)|(hiragana-iroha)|(katakana)|(katakana-iroha)|(lower-alpha)|(lower-greek)|(lower-latin)|(lower-roman)|(none)|(square)|(upper-alpha)|(upper-greek)|(upper-latin)|(upper-roman)|(initial)|(inherit)",
            initial: "disc",
            values: [
                "disc",
                "armenian",
                "circle",
                "cjk-ideographic",
                "decimal",
                "decimal-leading-zero",
                "georgian",
                "hebrew",
                "hiragana",
                "hiragana-iroha",
                "katakana",
                "katakana-iroha",
                "lower-alpha",
                "lower-greek",
                "lower-latin",
                "lower-roman",
                "none",
                "square",
                "upper-alpha",
                "upper-greek",
                "upper-latin",
                "upper-roman",
                "initial",
                "inherit",
            ],
        },
        margin: {
            moz: false,
            webkit: false,
            syntax: "(([length])|([percent])){1,4}|(auto)|(initial)|(inherit)",
            initial: "0",
            values: ["[length]", "[percent]", "auto", "initial", "inherit"],
        },
        "margin-bottom": {
            moz: false,
            webkit: false,
            syntax: "([length])|([percent])|(auto)|(initial)|(inherit)",
            initial: "0",
            values: ["[length]", "[percent]", "auto", "initial", "inherit"],
        },
        "margin-left": {
            moz: false,
            webkit: false,
            syntax: "([length])|([percent])|(auto)|(initial)|(inherit)",
            initial: "0",
            values: ["[length]", "[percent]", "auto", "initial", "inherit"],
        },
        "margin-right": {
            moz: false,
            webkit: false,
            syntax: "([length])|([percent])|(auto)|(initial)|(inherit)",
            initial: "0",
            values: ["[length]", "[percent]", "auto", "initial", "inherit"],
        },
        "margin-top": {
            moz: false,
            webkit: false,
            syntax: "([length])|(auto)|(initial)|(inherit)",
            initial: "0",
            values: ["[length]", "[percent]", "auto", "initial", "inherit"],
        },
        "max-height": {
            moz: false,
            webkit: false,
            syntax: "(none)|([length])|(initial)|(inherit)",
            initial: "none",
            values: ["none", "[length]", "[percent]", "initial", "inherit"],
        },
        "max-width": {
            moz: false,
            webkit: false,
            syntax: "(none)|([length])|(initial)|(inherit)",
            initial: "none",
            values: ["none", "[length]", "[percent]", "initial", "inherit"],
        },
        "min-height": {
            moz: false,
            webkit: false,
            syntax: "([length])|(initial)|(inherit)",
            initial: "0",
            values: ["[length]", "[percent]", "initial", "inherit"],
        },
        "min-width": {
            moz: false,
            webkit: false,
            syntax: "([length])|(initial)|(inherit)",
            initial: "0",
            values: ["[length]", "[percent]", "initial", "inherit"],
        },
        "mix-blend-mode": {
            moz: false,
            webkit: false,
            syntax: "(normal)|(multiply)|(screen)|(overlay)|(darken)|(lighten)|(color-dodge)|(color-burn)|(difference)|(exclusion)|(hue)|(saturation)|([color])|(luminosity)",
            initial: "normal",
            values: [
                "normal",
                "multiply",
                "screen",
                "overlay",
                "darken",
                "lighten",
                "color-dodge",
                "color-burn",
                "difference",
                "exclusion",
                "hue",
                "saturation",
                "[color]",
                "luminosity",
            ],
        },
        "object-fit": {
            moz: false,
            webkit: false,
            syntax: "(fill)|(contain)|(cover)|(scale-down)|(none)|(initial)|(inherit)",
            initial: "",
            values: [
                "fill",
                "contain",
                "cover",
                "none",
                "scale-down",
                "initial",
                "inherit",
            ],
        },
        "object-position": {
            moz: false,
            webkit: false,
            syntax: "(position)|(initial)|(inherit)",
            initial: "50% 50%",
            values: ["position", "initial", "inherit"],
        },
        opacity: {
            moz: false,
            webkit: false,
            syntax: "([number])|(initial)|(inherit)",
            initial: "1",
            values: ["[number]", "initial", "inherit"],
        },
        order: {
            moz: true,
            webkit: true,
            syntax: "([number])|(initial)|(inherit)",
            initial: "0",
            values: ["[number]", "initial", "inherit"],
        },
        outline: {
            moz: false,
            webkit: false,
            syntax: "(([prop:outline-width]) ([prop:outline-style]) ([prop:outline-color]))|(initial)|(inherit)",
            initial: "medium invert color",
            values: [
                "[prop:outline-width]",
                "[prop:outline-style]",
                "[prop:outline-color]",
                "initial",
                "inherit",
            ],
        },
        "outline-color": {
            moz: false,
            webkit: false,
            syntax: "(invert)|([color])|(initial)|(inherit)",
            initial: "invert",
            values: ["invert", "[color]", "initial", "inherit"],
        },
        "outline-offset": {
            moz: false,
            webkit: false,
            syntax: "([length])|(initial)|(inherit)",
            initial: "0",
            values: ["[length]", "initial", "inherit"],
        },
        "outline-style": {
            moz: false,
            webkit: false,
            syntax: "(none)|(hidden)|(dotted)|(dashed)|(solid)|(double)|(groove)|(ridge)|(inset)|(outset)|(initial)|(inherit)",
            initial: "none",
            values: [
                "none",
                "hidden",
                "dotted",
                "dashed",
                "solid",
                "double",
                "groove",
                "ridge",
                "inset",
                "outset",
                "initial",
                "inherit",
            ],
        },
        "outline-width": {
            moz: false,
            webkit: false,
            syntax: "(medium)|(thin)|(thick)|([length])|(initial)|(inherit)",
            initial: "medium",
            values: ["medium", "thin", "thick", "[length]", "initial", "inherit"],
        },
        overflow: {
            moz: false,
            webkit: false,
            syntax: "(visible)|(hidden)|(scroll)|(auto)|(initial)|(inherit)",
            initial: "visible",
            values: ["visible", "hidden", "scroll", "auto", "initial", "inherit"],
        },
        "overflow-x": {
            moz: false,
            webkit: false,
            syntax: "(visible)|(hidden)|(scroll)|(auto)|(initial)|(inherit)",
            initial: "visible",
            values: ["visible", "hidden", "scroll", "auto", "initial", "inherit"],
        },
        "overflow-y": {
            moz: false,
            webkit: false,
            syntax: "(visible)|(hidden)|(scroll)|(auto)|(initial)|(inherit)",
            initial: "visible",
            values: ["visible", "hidden", "scroll", "auto", "initial", "inherit"],
        },
        padding: {
            moz: false,
            webkit: false,
            syntax: "(([length])|([percent])){1,4}|(initial)|(inherit)",
            initial: "0",
            values: ["[length]", "[percent]", "initial", "inherit"],
        },
        "padding-bottom": {
            moz: false,
            webkit: false,
            syntax: "([length])|([percent])|(initial)|(inherit)",
            initial: "0",
            values: ["[length]", "[percent]", "initial", "inherit"],
        },
        "padding-left": {
            moz: false,
            webkit: false,
            syntax: "([length])|(initial)|(inherit)",
            initial: "0",
            values: ["[length]", "[percent]", "initial", "inherit"],
        },
        "padding-right": {
            moz: false,
            webkit: false,
            syntax: "([length])|([percent])|(initial)|(inherit)",
            initial: "0",
            values: ["[length]", "[percent]", "initial", "inherit"],
        },
        "padding-top": {
            moz: false,
            webkit: false,
            syntax: "([length])|([percent])|(initial)|(inherit)",
            initial: "0",
            values: ["[length]", "[percent]", "initial", "inherit"],
        },
        "page-break-after": {
            moz: false,
            webkit: false,
            syntax: "(auto)|(always)|(avoid)|(left)|(right)|(initial)|(inherit)",
            initial: "auto",
            values: [
                "auto",
                "always",
                "avoid",
                "left",
                "right",
                "initial",
                "inherit",
            ],
        },
        "page-break-before": {
            moz: false,
            webkit: false,
            syntax: "(auto)|(always)|(avoid)|(left)|(right)|(initial)|(inherit)",
            initial: "auto",
            values: [
                "auto",
                "always",
                "avoid",
                "left",
                "right",
                "initial",
                "inherit",
            ],
        },
        "page-break-inside": {
            moz: false,
            webkit: false,
            syntax: "(auto)|(avoid)|(initial)|(inherit)",
            initial: "auto",
            values: ["auto", "avoid", "initial", "inherit"],
        },
        perspective: {
            moz: true,
            webkit: true,
            syntax: "([length])|(none)",
            initial: "none",
            values: ["[length]", "none", "initial", "inherit"],
        },
        "perspective-origin": {
            moz: true,
            webkit: true,
            syntax: "x-axis (y-axis)|(initial)|(inherit)",
            initial: "50% 50%",
            values: ["x-axis", "y-axis", "initial", "inherit"],
        },
        "pointer-events": {
            moz: false,
            webkit: false,
            syntax: "(auto)|(none)",
            initial: "auto",
            values: ["auto", "none", "initial", "inherit"],
        },
        position: {
            moz: false,
            webkit: false,
            syntax: "(static)|(absolute)|(fixed)|(relative)|(sticky)|(initial)|(inherit)",
            initial: "static",
            values: [
                "static",
                "absolute",
                "fixed",
                "relative",
                "sticky",
                "initial",
                "inherit",
            ],
        },
        quotes: {
            moz: false,
            webkit: false,
            syntax: "(none)|(string)|(initial)|(inherit)",
            initial: "not specified",
            values: [
                "none",
                "string string string string",
                "initial",
                "inherit",
                '"',
                "'",
                "‹",
                "›",
                "«",
                "»",
                "‘",
                "’",
                "“",
                "”",
                "„",
            ],
        },
        resize: {
            moz: true,
            webkit: false,
            syntax: "(none)|(both)|(horizontal)|(vertical)|(initial)|(inherit)",
            initial: "none",
            values: ["none", "both", "horizontal", "vertical", "initial", "inherit"],
        },
        right: {
            moz: false,
            webkit: false,
            syntax: "(auto)|([length])|(initial)|(inherit)",
            initial: "auto",
            values: ["auto", "[length]", "[percent]", "initial", "inherit"],
        },
        "scroll-behavior": {
            moz: false,
            webkit: false,
            syntax: "(auto)|(smooth)|(initial)|(inherit)",
            initial: "auto",
            values: ["auto", "smooth", "initial", "inherit"],
        },
        "tab-size": {
            moz: true,
            webkit: false,
            syntax: "([number])|([length])|(initial)|(inherit)",
            initial: "8",
            values: ["[number]", "[length]", "initial", "inherit"],
        },
        "table-layout": {
            moz: false,
            webkit: false,
            syntax: "(auto)|(fixed)|(initial)|(inherit)",
            initial: "auto",
            values: ["auto", "fixed", "initial", "inherit"],
        },
        "text-align": {
            moz: false,
            webkit: false,
            syntax: "(left)|(right)|(center)|(justify)|(initial)|(inherit)",
            initial: "left if direction is ltr, and right if direction is rtl",
            values: ["left", "right", "center", "justify", "initial", "inherit"],
        },
        "text-align-last": {
            moz: true,
            webkit: false,
            syntax: "(auto)|(left)|(right)|(center)|(justify)|(start)|(end)|(initial)|(inherit)",
            initial: "auto",
            values: [
                "auto",
                "left",
                "right",
                "center",
                "justify",
                "start",
                "end",
                "initial",
                "inherit",
            ],
        },
        "text-decoration": {
            moz: false,
            webkit: false,
            syntax: "(([prop:text-decoration-line]) ([prop:text-decoration-color]) ([prop:text-decoration-style]))|(initial)|(inherit)",
            initial: "none currentcolor solid",
            values: [
                "[prop:text-decoration-line]",
                "[prop:text-decoration-color]",
                "[prop:text-decoration-style]",
                "initial",
                "inherit",
            ],
        },
        "text-decoration-color": {
            moz: true,
            webkit: true,
            syntax: "([color])|(initial)|(inherit)",
            initial: "currentColor",
            values: ["[color]", "initial", "inherit"],
        },
        "text-decoration-line": {
            moz: true,
            webkit: true,
            syntax: "(none)|(underline)|(overline)|(line-through)|(initial)|(inherit)",
            initial: "none",
            values: [
                "none",
                "underline",
                "overline",
                "line-through",
                "initial",
                "inherit",
            ],
        },
        "text-decoration-style": {
            moz: true,
            webkit: false,
            syntax: "(solid)|(double)|(dotted)|(dashed)|(wavy)|(initial)|(inherit)",
            initial: "solid",
            values: [
                "solid",
                "double",
                "dotted",
                "dashed",
                "wavy",
                "initial",
                "inherit",
            ],
        },
        "text-indent": {
            moz: false,
            webkit: false,
            syntax: "([length])|(initial)|(inherit)",
            initial: "0",
            values: ["[length]", "[percent]", "initial", "inherit"],
        },
        "text-justify": {
            moz: false,
            webkit: false,
            syntax: "(auto)|(inter-word)|(inter-character)|(none)|(initial)|(inherit)",
            initial: "auto",
            values: [
                "auto",
                "inter-word",
                "inter-character",
                "none",
                "initial",
                "inherit",
            ],
        },
        "text-overflow": {
            moz: false,
            webkit: false,
            syntax: "(clip)|(ellipsis)|(string)|(initial)|(inherit)",
            initial: "clip",
            values: ["clip", "ellipsis", "string", "initial", "inherit"],
        },
        "text-shadow": {
            moz: false,
            webkit: false,
            syntax: "h-shadow v-shadow blur-radius ([color])|(none)|(initial)|(inherit)",
            initial: "none",
            values: [
                "h-shadow",
                "v-shadow",
                "blur-radius",
                "[color]",
                "none",
                "initial",
                "inherit",
            ],
        },
        "text-transform": {
            moz: false,
            webkit: false,
            syntax: "(none)|(capitalize)|(uppercase)|(lowercase)|(initial)|(inherit)",
            initial: "none",
            values: [
                "none",
                "capitalize",
                "uppercase",
                "lowercase",
                "initial",
                "inherit",
            ],
        },
        top: {
            moz: false,
            webkit: false,
            syntax: "(auto)|([length])|(initial)|(inherit)",
            initial: "auto",
            values: ["auto", "[length]", "[percent]", "initial", "inherit"],
        },
        "transform(2D)": {
            moz: true,
            webkit: true,
            syntax: "(none)|([fn:matrix])|([fn:matrix3d])|([fn:translate])|([fn:translate3d])|([fn:translateX])|([fn:translateY])|([fn:translateZ])|([fn:scale])|([fn:scale3d])|([fn:scaleX])|([fn:scaleY])|([fn:scaleZ])|([fn:rotate])|([fn:rotate3d])|([fn:rotateX])|([fn:rotateY])|([fn:rotateZ])|([fn:skew])|([fn:skewX])|([fn:skewY])|([fn:perspective])|(initial)|(inherit)",
            initial: "none",
            values: [
                "none",
                "[fn:matrix]",
                "[fn:matrix3d]",
                "[fn:translate]",
                "[fn:translate3d]",
                "[fn:translateX]",
                "[fn:translateY]",
                "[fn:translateZ]",
                "[fn:scale]",
                "[fn:scale3d]",
                "[fn:scaleX]",
                "[fn:scaleY]",
                "[fn:scaleZ]",
                "[fn:rotate]",
                "[fn:rotate3d]",
                "[fn:rotateX]",
                "[fn:rotateY]",
                "[fn:rotateZ]",
                "[fn:skew]",
                "[fn:skewX]",
                "[fn:skewY]",
                "[fn:perspective]",
                "initial",
                "inherit",
            ],
        },
        "transform-origin(two-value syntax)": {
            moz: true,
            webkit: true,
            syntax: "x-axis y-axis (z-axis)|(initial)|(inherit)",
            initial: "50% 50% 0",
            values: ["x-axis", "y-axis", "z-axis", "initial", "inherit"],
        },
        "transform-style": {
            moz: true,
            webkit: true,
            syntax: "(flat)|(preserve-3d)|(initial)|(inherit)",
            initial: "flat",
            values: ["flat", "preserve-3d", "initial", "inherit"],
        },
        transition: {
            moz: true,
            webkit: true,
            syntax: "(([prop:transition-property]) ([prop:transition-duration]) ([prop:transition-timing-function]) ([prop:transition-delay]))|(initial)|(inherit)",
            initial: "all 0s ease 0s",
            values: [
                "[prop:transition-property]",
                "[prop:transition-duration]",
                "[prop:transition-timing-function]",
                "[prop:transition-delay]",
                "initial",
                "inherit",
            ],
        },
        "transition-delay": {
            moz: true,
            webkit: true,
            syntax: "([time])|(initial)|(inherit)",
            initial: "0s",
            values: ["[time]", "initial", "inherit"],
        },
        "transition-duration": {
            moz: true,
            webkit: true,
            syntax: "([time])|(initial)|(inherit)",
            initial: "0s",
            values: ["[time]", "initial", "inherit"],
        },
        "transition-property": {
            moz: true,
            webkit: true,
            syntax: "(none)|(all)|(property)|(initial)|(inherit)",
            initial: "all",
            values: ["none", "all", "property", "initial", "inherit"],
        },
        "transition-timing-function": {
            moz: true,
            webkit: true,
            syntax: "(linear)|(ease)|(ease-in)|(ease-out)|(ease-in-out)|(step-start)|(step-end)|([fn:steps])|([fn:cubic-bezier])|(initial)|(inherit)",
            initial: "ease",
            values: [
                "ease",
                "linear",
                "ease-in",
                "ease-out",
                "ease-in-out",
                "step-start",
                "step-end",
                "[fn:steps]",
                "[fn:cubic-bezier]",
                "initial",
                "inherit",
            ],
        },
        "unicode-bidi": {
            moz: false,
            webkit: false,
            syntax: "(normal)|(embed)|(bidi-override)|(isolate)|(isolate-override)|(plaintext)|(initial)|(inherit)",
            initial: "normal",
            values: [
                "normal",
                "embed",
                "bidi-override",
                "isolate",
                "isolate-override",
                "plaintext",
                "initial",
                "inherit",
            ],
        },
        "user-select": {
            moz: true,
            webkit: true,
            syntax: "(auto)|(none)|(text)|(all)",
            initial: "auto",
            values: ["auto", "none", "text", "all"],
        },
        "vertical-align": {
            moz: false,
            webkit: false,
            syntax: "(baseline)|([length])|(sub)|(super)|(top)|(text-top)|(middle)|(bottom)|(text-bottom)|(initial)|(inherit)",
            initial: "baseline",
            values: [
                "baseline",
                "[length]",
                "[percent]",
                "sub",
                "super",
                "top",
                "text-top",
                "middle",
                "bottom",
                "text-bottom",
                "initial",
                "inherit",
            ],
        },
        visibility: {
            moz: false,
            webkit: false,
            syntax: "(visible)|(hidden)|(collapse)|(initial)|(inherit)",
            initial: "visible",
            values: ["visible", "hidden", "collapse", "initial", "inherit"],
        },
        "white-space": {
            moz: false,
            webkit: false,
            syntax: "(normal)|(nowrap)|(pre)|(pre-line)|(pre-wrap)|(initial)|(inherit)",
            initial: "normal",
            values: [
                "normal",
                "nowrap",
                "pre",
                "pre-line",
                "pre-wrap",
                "initial",
                "inherit",
            ],
        },
        width: {
            moz: false,
            webkit: false,
            syntax: "(auto)|([length])|([percent])|(initial)|(inherit)",
            initial: "auto",
            values: ["auto", "[length]", "[percent]", "initial", "inherit"],
        },
        "word-break": {
            moz: false,
            webkit: false,
            syntax: "(normal)|(break-all)|(keep-all)|(break-word)|(initial)|(inherit)",
            initial: "normal",
            values: [
                "normal",
                "break-all",
                "keep-all ",
                "break-word",
                "initial",
                "inherit",
            ],
        },
        "word-spacing": {
            moz: false,
            webkit: false,
            syntax: "(normal)|([length])|(initial)|(inherit)",
            initial: "normal",
            values: ["normal", "[length]", "initial", "inherit"],
        },
        "word-wrap": {
            moz: false,
            webkit: false,
            syntax: "(normal)|(break-word)|(initial)|(inherit)",
            initial: "normal",
            values: ["normal", "break-word", "initial", "inherit"],
        },
        "writing-mode": {
            moz: false,
            webkit: false,
            syntax: "(horizontal-tb)|(vertical-rl)|(vertical-lr)",
            initial: "horizontal-tb",
            values: ["horizontal-tb", "vertical-rl", "vertical-lr"],
        },
        "z-index": {
            moz: false,
            webkit: false,
            syntax: "(auto)|([number])|(initial)|(inherit)",
            initial: "auto",
            values: ["auto", "[number]", "initial", "inherit"],
        },
    };
    getPossibleCssValues(prop) {
        let values = this.cssProperties[prop]?.values || [];
        values = values.filter((v) => !["inherit", "initial", "unset"].includes(v));
        values = values.filter((v) => !v.startsWith("["));
        values.unshift(null);
        return values;
    }
    getAppliedStyles(element) {
        if (!element)
            return [];
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
    }
    getElementsFromViewNode(node) {
        if (!node)
            return [];
        if (!node[1])
            return [];
        return document.querySelectorAll(`[path="${node[1].path}"]`);
    }
    isTagName(tag) {
        const tagNames = [
            "a",
            "abbr",
            "acronym",
            "address",
            "applet",
            "area",
            "article",
            "aside",
            "audio",
            "b",
            "base",
            "basefont",
            "bdi",
            "bdo",
            "blockquote",
            "body",
            "br",
            "button",
            "canvas",
            "caption",
            "cite",
            "code",
            "col",
            "colgroup",
            "data",
            "datalist",
            "dd",
            "del",
            "details",
            "dfn",
            "dialog",
            "div",
            "dl",
            "dt",
            "em",
            "embed",
            "fieldset",
            "figcaption",
            "figure",
            "font",
            "footer",
            "form",
            "frame",
            "frameset",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "head",
            "header",
            "hr",
            "html",
            "i",
            "iframe",
            "img",
            "input",
            "ins",
            "kbd",
            "label",
            "legend",
            "li",
            "link",
            "main",
            "map",
            "mark",
            "meta",
            "meter",
            "nav",
            "noframes",
            "noscript",
            "object",
            "ol",
            "optgroup",
            "option",
            "output",
            "p",
            "param",
            "picture",
            "pre",
            "progress",
            "q",
            "rp",
            "rt",
            "ruby",
            "s",
            "samp",
            "script",
            "section",
            "select",
            "small",
            "source",
            "span",
            "strike",
            "strong",
            "style",
            "sub",
            "summary",
            "sup",
            "svg",
            "table",
            "tbody",
            "td",
            "template",
            "textarea",
            "tfoot",
            "th",
            "thead",
            "time",
            "title",
            "tr",
            "track",
            "tt",
            "u",
            "ul",
            "var",
            "video",
            "wbr",
        ];
        return tagNames.includes(tag?.toLowerCase());
    }
    addPaths(compName, dom) {
        return (0, add_paths_1.default)(this, compName, dom);
    }
    encode(s) {
        if (!s)
            return null;
        // HTML encode
        s = s.replace(/&/g, "&amp;");
        s = s.replace(/</g, "&lt;");
        s = s.replace(/>/g, "&gt;");
        s = s.replace(/"/g, "&quot;");
        s = s.replace(/'/g, "&#39;");
        return s;
    }
}
exports.HtmlHelper = HtmlHelper;


/***/ }),

/***/ "../../../LiveIde/Classes/Params.ts":
/*!******************************************!*\
  !*** ../../../LiveIde/Classes/Params.ts ***!
  \******************************************/
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

/***/ "../../../LiveIde/Classes/StateTracker.ts":
/*!************************************************!*\
  !*** ../../../LiveIde/Classes/StateTracker.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StateValue = exports.StateTracker = void 0;
__webpack_require__(/*! ../../../Shared/Extensions */ "../../../../Shared/Extensions.ts");
const Extensions_Objects_Client_1 = __webpack_require__(/*! ../../../Shared/Extensions.Objects.Client */ "../../../../Shared/Extensions.Objects.Client.ts");
const VueHelper_1 = __webpack_require__(/*! ./VueHelper */ "../../../LiveIde/Classes/VueHelper.ts");
var StateValueType;
(function (StateValueType) {
    StateValueType[StateValueType["Cloned"] = 0] = "Cloned";
    // Some values cannot be cloned (Vue components, etc.)
    // We save them as () => value
    StateValueType["Pointer"] = "p";
})(StateValueType || (StateValueType = {}));
class StateValue {
    type;
    _value;
    constructor(value) {
        if (value == window)
            throw new Error("Cannot clone window");
        const storeAsPointer = () => {
            this._value = () => value;
            this.type = StateValueType.Pointer;
        };
        if (!Extensions_Objects_Client_1.Objects.isClonable(value)) {
            storeAsPointer();
            return;
        }
        try {
            this._value = Extensions_Objects_Client_1.Objects.clone(value);
            this.type = StateValueType.Cloned;
        }
        catch (ex) {
            storeAsPointer();
        }
    }
    static from(value) {
        if (value instanceof StateValue)
            return value;
        return new StateValue(value);
    }
    getDelta(oldValue) {
        if (this.type == StateValueType.Pointer ||
            oldValue.type == StateValueType.Pointer) {
            return StateValue.from(this.value);
        }
        try {
            const delta = Extensions_Objects_Client_1.Objects.subtract(this.value, oldValue.value);
            return StateValue.from(delta);
        }
        catch (ex) {
            return StateValue.from(this.value);
        }
    }
    get value() {
        if (this.type == StateValueType.Cloned)
            return this._value;
        return this._value();
    }
}
exports.StateValue = StateValue;
class StateTracker {
    vm;
    client;
    static _nextID = 1;
    static _maxChangesPerVue = 100;
    isPaused = 0;
    refChanges = new Map();
    changes = new Map();
    methods = {
        pause: {},
    };
    constructor(vm, client) {
        this.vm = vm;
        this.client = client;
    }
    static new(vueManager, client) {
        const st = new StateTracker(vueManager, client);
        return st;
    }
    track(vue, type, key, newValue, oldValue, args) {
        if (this.isPaused)
            return;
        if (!this.isKeyTrackable(key))
            return;
        if (!this.isTrackable(newValue))
            return;
        if (!this.isTrackable(oldValue))
            return;
        try {
            const isEvent = type == "e";
            const newStateValue = StateValue.from(newValue);
            const oldStateValue = StateValue.from(oldValue);
            const change = {
                id: StateTracker._nextID++,
                dt: Date.now(),
                uid: vue._uid,
                vueCompName: vue.$options._componentTag,
                type,
                key,
                args,
                newValue: newStateValue,
                oldValue: oldStateValue,
                delta: newStateValue.getDelta(oldStateValue),
            };
            this.addChange(change);
            return change;
        }
        catch (ex) {
            console.warn(`Error tracking state change for ${vue.$options_componentTag}.${key}`);
            console.warn(ex);
        }
    }
    isKeyTrackable(key) {
        if (["$asyncComputed", "_asyncComputed"].includes(key))
            return false;
        return true;
    }
    isTrackable(value) {
        if (!value)
            return true;
        if (Array.isArray(value))
            return value.all(this.isTrackable.bind(this));
        // HTML elements are not trackable
        if (value instanceof HTMLElement)
            return false;
        // Functions are not trackable
        if (typeof value == "function")
            return false;
        return true;
    }
    async apply(uid, change) {
        if (change.type != "d")
            return;
        this.pause();
        const vue = this.vm.getVue(uid);
        vue[change.key] = change.newValue.value;
        await vue.$nextTick();
        this.resume();
    }
    // Sometimes when refreshing keys in the app, the vue components are recreated
    // and lose their state.
    // This method restores the state from the state tracker.
    async restoreState() {
        throw new Error("Not implemented");
        const app = null;
        this.pause();
        const refKeys = this.vm.getRefKeys();
        const vuesByRef = VueHelper_1.VueHelper.getVuesByRef(app);
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
        this.vm.updateDataVariableUIDs(app);
        await app.$nextTick();
        this.resume();
    }
    addChange(item) {
        const isState = item.type == "p" || item.type == "d";
        const isMethod = item.type == "m";
        const vueItems = this.getVueChanges(item.uid);
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
                this.addChange(emptyItem);
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
        vueItems.push(item);
        if (vueItems.length > StateTracker._maxChangesPerVue)
            vueItems.shift();
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
    getVueChanges(uid) {
        if (!this.changes.has(uid)) {
            this.changes.set(uid, []);
        }
        return this.changes.get(uid) || [];
    }
    getRefChanges(refKeyOrUID) {
        const refKey = typeof refKeyOrUID == "string"
            ? refKeyOrUID
            : this.vm.getRefKey(refKeyOrUID);
        if (!refKey)
            return [];
        if (!this.refChanges.has(refKey)) {
            this.refChanges.set(refKey, []);
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

/***/ "../../../LiveIde/Classes/VueHelper.ts":
/*!*********************************************!*\
  !*** ../../../LiveIde/Classes/VueHelper.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VueHelper = void 0;
const Vue = window.Vue;
class VueHelper {
    static cid = 1;
    static toIdeComponent(vue) {
        if (!vue)
            return null;
        const compName = vue.$options._componentTag;
        if (!compName)
            return null;
        const vueComp = Vue.component(vue.$options._componentTag);
        const comp = {};
        comp.uid = vue._uid;
        comp.name = compName;
        comp.source = {
            dom: VueHelper.htmlToJson(vueComp.options.template),
        };
        return comp;
    }
    static htmlToJson(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, "text/html");
        function walk(node, path) {
            const cid = VueHelper.cid++;
            if (node.nodeName === "#text") {
                return { cid, tag: node.textContent || "", path };
            }
            let element = node;
            let tag = element.tagName.toLowerCase();
            // Handling multiple divs
            let siblings = Array.from(node.parentNode.childNodes).filter((n) => n.nodeName === node.nodeName);
            let siblingIndex = siblings.indexOf(node);
            if (siblings.length > 1) {
                tag += `#${siblingIndex + 1}`;
            }
            // Adding attributes to the JSON object
            let attributes = {};
            for (let i = 0; i < element.attributes.length; i++) {
                let attr = element.attributes[i];
                attributes[`${attr.name}`] = attr.value;
            }
            // Walking through child nodes
            let children = [];
            for (let i = 0; i < Array.from(node.childNodes).length; i++) {
                let child = node.childNodes[i];
                let childObj = walk(child, [...path, i]);
                if (childObj.tag !== "") {
                    children.push(childObj);
                }
            }
            let result = { cid, tag, path };
            if (Object.keys(attributes).length > 0) {
                result.attributes = attributes;
            }
            if (children.length > 0) {
                result.children = children;
            }
            return result;
        }
        return walk(doc.body.firstChild, []);
    }
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

/***/ "../../../LiveIde/Classes/VueManager.ts":
/*!**********************************************!*\
  !*** ../../../LiveIde/Classes/VueManager.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VueManager = void 0;
__webpack_require__(/*! ../../../Shared/Extensions */ "../../../../Shared/Extensions.ts");
const TwoWayMap_1 = __webpack_require__(/*! ../../../Shared/TwoWayMap */ "../../../../Shared/TwoWayMap.ts");
const VueHelper_1 = __webpack_require__(/*! ./VueHelper */ "../../../LiveIde/Classes/VueHelper.ts");
const StateTracker_1 = __webpack_require__(/*! ./StateTracker */ "../../../LiveIde/Classes/StateTracker.ts");
class VueManager {
    client;
    vues = {};
    vuesCount = 0;
    vuesCounts = {};
    // Tracking by uid or vue tree path are unreliable because vue recreates components
    // We use $refs to track components
    // Any ref that starts with a capital letter is a global reference
    vueRefsToUIDs = new TwoWayMap_1.TwoWayMap();
    constructor(client) {
        this.client = client;
    }
    static new(client) {
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
    getAncestors(vue, filter, maxCount = 10000) {
        if (typeof filter == "string") {
            const compName = filter;
            filter = (vue) => vue.$data._?.comp.name == compName;
        }
        const vues = [];
        while (vue.$parent && vues.length < maxCount) {
            vue = vue.$parent;
            if (filter(vue))
                vues.push(vue);
        }
        return vues;
    }
    getDescendant(vue, filter) {
        return this.getDescendants(vue, filter, 1)[0];
    }
    getDescendants(vue, filter = (vue) => true, maxCount) {
        if (!vue)
            return [];
        if (typeof filter == "string") {
            const compName = filter;
            filter = (vue) => vue.$data._?.comp.name == compName;
        }
        if (typeof filter == "number") {
            const uid = filter;
            filter = (vue) => vue._uid == uid;
        }
        const vues = [];
        for (const child of vue.$children || []) {
            if (filter(child))
                vues.push(child);
            if (vues.length >= maxCount)
                break;
            vues.push(...this.getDescendants(child, filter, maxCount));
            if (vues.length >= maxCount)
                break;
        }
        if (vues.length >= maxCount)
            vues.length = maxCount;
        return vues;
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
            return { type: "d", key: k, newValue: StateTracker_1.StateValue.from(vue.$data[k]) };
        }));
        fields.push(...Object.keys(vue.$props || {}).map((k) => {
            return { type: "p", key: k, newValue: StateTracker_1.StateValue.from(vue.$props[k]) };
        }));
        fields.push(...this.getComputedKeys(uid).map((k) => {
            return { type: "c", key: k, newValue: StateTracker_1.StateValue.from(vue[k]) };
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
    registerVue(vue) {
        if (!vue)
            return;
        if (this.vues[vue._uid])
            return;
        this.vues[vue._uid] = () => vue;
        const vueCompName = vue.$options._componentTag;
        this.vuesCounts[vueCompName] = (this.vuesCounts[vueCompName] || 0) + 1;
        this.vuesCount++;
        //const compName = vue.$data._.comp.name;
        //if (["e.", "ui."].some((prefix) => compName.startsWith(prefix))) return;
        for (const refKey of Object.keys(vue.$refs)) {
            if (refKey[0].isLowerCase())
                continue;
            this.vueRefsToUIDs.set(refKey, vue.$refs[refKey]._uid);
        }
    }
    unregisterVue(vue) {
        if (!vue)
            return;
        delete this.vues[vue._uid];
        const vueCompName = vue.$options._componentTag;
        //this.vuesCounts[vueCompName]--;
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

/***/ "../../../../Shared/DataWatcher.ts":
/*!*****************************************!*\
  !*** ../../../../Shared/DataWatcher.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


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

/***/ "../../../../Shared/Database/Graph.ts":
/*!********************************************!*\
  !*** ../../../../Shared/Database/Graph.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Graph = void 0;
const Extensions_Objects_Client_1 = __webpack_require__(/*! ../Extensions.Objects.Client */ "../../../../Shared/Extensions.Objects.Client.ts");
const Events_1 = __webpack_require__(/*! ../Events */ "../../../../Shared/Events.ts");
const findArg = (condition, ...args) => {
    if (typeof condition == "string") {
        const type = condition;
        condition = (arg) => typeof arg == type;
    }
    const predicate = condition;
    const arg = args.find((a) => predicate(a));
    return arg;
};
var Graph;
(function (Graph) {
    class Database {
        data;
        // #region nextID
        // Property that maps to this.data.nextID
        get nextID() {
            return this.data.nextID;
        }
        set nextID(value) {
            this.data.nextID = value;
        }
        // #endregion
        get nodes() {
            return this.data.nodes;
        }
        get links() {
            return this.data.links;
        }
        events = new Events_1.Events();
        // #region Constructor
        constructor(data) {
            this.data = data;
        }
        static async new(data) {
            return new Database(data);
        }
        // #endregion
        // #region Events
        onNodesChange(nodes) {
            for (const node of nodes) {
                this.events.emit("node.change", node);
            }
        }
        // #endregion
        addTemplate(name) {
            const template = this.data.templates[name];
            const node = this.addNode(template.type, template.data);
            for (const child of template.children) {
                this.addChildNode(node, child.type, child.data, child.children);
            }
            return node;
        }
        addNode(type, data, links = []) {
            data = JSON.parse(JSON.stringify(data || {}));
            const newData = {};
            const types = type.split(".");
            const commonData = Extensions_Objects_Client_1.Objects.clone(this.data.schema[types[0]][types[1]]._all.data);
            Object.assign(newData, commonData);
            let defaultData = this.data.schema[types[0]][types[1]];
            defaultData = defaultData[types[2]] ? defaultData[types[2]].data : {};
            defaultData = Extensions_Objects_Client_1.Objects.clone(defaultData);
            Object.assign(newData, defaultData);
            Object.assign(newData, data);
            let node = {
                id: this.getNextID(),
                type,
                data: newData,
            };
            const affectedNodes = [];
            for (const link of links) {
                if (link.from) {
                    affectedNodes.push(this.getNode(link.from));
                    link.to = node.id;
                }
                else {
                    if (link.to) {
                        affectedNodes.push(this.getNode(link.to));
                        link.from = node.id;
                    }
                }
            }
            this.nodes.push(node);
            this.links.push(...links);
            this.onNodesChange([node, ...affectedNodes]);
            let defaultChildren = this.data.schema[types[0]][types[1]];
            defaultChildren = defaultChildren[types[2]]
                ? defaultChildren[types[2]].children || []
                : [];
            for (const child of defaultChildren) {
                const childNode = this.addChildNode(node, child.type, child.data, child.children);
            }
            return node;
        }
        updateNodeField(node, field, value) {
            node = this.getNode(node.id) || node;
            Extensions_Objects_Client_1.Objects.deepSet(node.data, field, value);
            this.onNodesChange([node]);
        }
        replaceNode(oldNode, newNode) {
            this.replaceNodeLinks(oldNode, newNode);
            this.deleteNode(oldNode);
            this.onNodesChange([newNode]);
            return newNode;
        }
        replaceNodeLinks(oldNode, newNode) {
            const oldLinks = this.getNodeLinks(oldNode);
            for (const link of oldLinks) {
                this.replaceLinkNode(link, oldNode, newNode);
            }
        }
        replaceLinkNode(link, oldNode, newNode) {
            if (link.from == oldNode.id)
                link.from = newNode.id;
            if (link.to == oldNode.id)
                link.to = newNode.id;
        }
        addLink(from, type, to, data = {}) {
            const link = {
                id: this.getNextID(),
                from: from.id,
                to: to.id,
                type,
                data,
            };
            this.links.push(link);
            const affectedNodes = [from, to].map((n) => this.getNode(n.id));
            this.onNodesChange(affectedNodes);
            return link;
        }
        addChildNode(parent, typeOrNode, data, children = []) {
            const child = typeof typeOrNode == "object"
                ? typeOrNode
                : this.addNode(typeOrNode, data);
            this.addLink(child, "child.of", parent);
            for (const subChild of children) {
                this.addChildNode(child, subChild.type, subChild.data, subChild.children);
            }
            return child;
        }
        addChildNodes(parent, typeOrNode, data, count) {
            for (let i = 0; i < count; i++) {
                this.addChildNode(parent, typeOrNode, data);
            }
        }
        getNodes(a, b) {
            if (Array.isArray(a)) {
                const ids = a;
                const nodes = ids.map((id) => this.getNode(id));
                return nodes;
            }
            const fromOrTo = this.fromOrTo(a, b);
            const oppFromOrTo = this.getOppositeFromOrTo(fromOrTo);
            const links = this.getLinks(a, b);
            const nodes = links.map((l) => this.getNode(l[oppFromOrTo]));
            return nodes;
        }
        getLinkedNodes(node) {
            if (!node)
                return [];
            const links = this.links.filter((l) => l.from == node.id || l.to == node.id);
            const nodeIds = links.flatMap((l) => [l.from, l.to]).except(node.id);
            const nodes = nodeIds.map((id) => this.getNode(id));
            return nodes;
        }
        getLinkedNodes2(linkType, fromOrTo, node) {
            const links = this.links.filter((l) => l.type == linkType && l[fromOrTo] == node.id);
            const nodes = links.map((l) => this.getNode(l[this.getOppositeFromOrTo(fromOrTo)]));
            return nodes;
        }
        getLinks(a, b) {
            if (typeof a == "object" && typeof b == "object") {
                const links = this.links.filter((link) => this.linkIncludes(link, a) && this.linkIncludes(link, b));
                return links;
            }
            const fromOrTo = this.fromOrTo(a, b);
            const type = findArg("string", a, b);
            const node = findArg("object", a, b);
            if (!node)
                return [];
            const links = this.links.filter((l) => l.type == type && l[fromOrTo] == node.id);
            return links;
        }
        getNode(idOrPath, fromNode) {
            if (typeof idOrPath == "number") {
                const id = idOrPath;
                const node = this.nodes.find((n) => n.id == id);
                return node;
            }
            else {
                const path = idOrPath;
                const paths = path.split(".");
                const findPathPart = (parent, part) => {
                    const children = !parent
                        ? [...this.nodes]
                        : this.getLinkedNodes2("child.of", "to", parent);
                    const child = part.startsWith("[")
                        ? children[0]
                        : children.find((c) => c.data.name?.value == part || c.type == part);
                    return child || null;
                };
                let node = fromNode;
                for (const pathPart of paths) {
                    node = findPathPart(node, pathPart);
                }
                return node;
            }
        }
        getNodeLinks(node) {
            if (!node)
                return [];
            const links = this.links.filter((l) => l.from == node.id || l.to == node.id);
            return links;
        }
        linkIncludes(link, node) {
            if (!link || !node)
                return false;
            return link.from == node.id || link.to == node.id;
        }
        fromOrTo(a, b) {
            if (typeof a !== "string") {
                return "from";
            }
            else {
                return "to";
            }
        }
        getOppositeFromOrTo(fromOrTo) {
            if (fromOrTo == "from") {
                return "to";
            }
            else {
                return "from";
            }
        }
        getTypeArg(a, b) {
            if (typeof a !== "string") {
                return a.type;
            }
            else {
                return b;
            }
        }
        deleteNode(node) {
            this.deleteLinks(this.getNodeLinks(node));
            this.nodes.removeBy((n) => n.id == node.id);
        }
        deleteLinks(links) {
            for (const link of links) {
                this.links.removeBy((l) => l.id == link.id);
            }
        }
        getNextID() {
            return this.nextID++;
        }
    }
    Graph.Database = Database;
})(Graph || (exports.Graph = Graph = {}));


/***/ }),

/***/ "../../../../Shared/Events.ts":
/*!************************************!*\
  !*** ../../../../Shared/Events.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, exports) => {


// Passing events between components
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Events = void 0;
class Events {
    listeners = {};
    forward(events, prefix) {
        events.on("*", (name, ...args) => {
            this.emit(`${prefix}.${name}`, ...args);
        });
    }
    on(name, callback) {
        if (!this.listeners[name]) {
            this.listeners[name] = [];
        }
        this.listeners[name].push(callback);
    }
    emit(name, ...args) {
        if (this.listeners["*"]) {
            this.listeners["*"].forEach((callback) => {
                callback(name, ...args);
            });
        }
        if (this.listeners[name]) {
            this.listeners[name].forEach((callback) => {
                callback(...args);
            });
        }
    }
}
exports.Events = Events;


/***/ }),

/***/ "../../../../Shared/Extensions.Objects.Client.ts":
/*!*******************************************************!*\
  !*** ../../../../Shared/Extensions.Objects.Client.ts ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Objects = void 0;
__webpack_require__(/*! ./Extensions */ "../../../../Shared/Extensions.ts");
const _importMainFileToImplement = "This is not supported on the client side. Import Extensions.Objects to implement";
class Objects {
    static is(obj, type) {
        return (0)._is(obj, type);
    }
    static isPrimitive(obj) {
        return Objects.isPrimitiveType(Objects.getType(obj));
    }
    static getType(obj) {
        return (0)._getObjectType(obj);
    }
    static isPrimitiveType(type) {
        return [String, Number, Boolean, Date, RegExp].some((t) => t === type);
    }
    static getAllKeys(obj) {
        let keys = [];
        let currentObj = obj;
        const visitedObjects = new Set();
        while (currentObj && !visitedObjects.has(currentObj)) {
            keys = keys.concat(Object.getOwnPropertyNames(currentObj));
            visitedObjects.add(currentObj);
            currentObj = Object.getPrototypeOf(currentObj);
        }
        return keys;
    }
    static getAllEntries(obj) {
        const keys = Objects.getAllKeys(obj);
        return keys.map((key) => [key, obj[key]]);
    }
    static compare(obj1, obj2) {
        return (0)._compare(obj1, obj2);
    }
    static areEqual(obj1, obj2) {
        if (typeof obj1 != "object" || typeof obj2 != "object")
            return obj1 == obj2;
        if ((obj1 == null) != (obj2 == null))
            return false;
        if (obj1 == null && obj2 == null)
            return true;
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
    static eval(str) {
        try {
            return eval(str);
        }
        catch (ex) {
            throw new Error(`Error evaluating expression:\n\n${str}\n\n${ex.stack}`);
        }
    }
    static clone(obj) {
        if (obj == null || obj == undefined || typeof obj != "object")
            return obj;
        if (obj instanceof Date)
            return new Date(obj.getTime());
        if (obj instanceof RegExp)
            return new RegExp(obj.source, obj.flags);
        try {
            return Objects.json.parse(JSON.stringify(obj));
        }
        catch (ex) {
            throw ex;
        }
    }
    // JSDoc documentation
    /**
     * Return whether the object is clonable.
     * @param obj The object to check.
     * @returns true, false, or undefined if the object is clonable, not clonable, or unknown.
     **/
    static isClonable(obj) {
        if (obj == null || obj == undefined)
            return true;
        if (Objects.is(obj, String))
            return true;
        if (Objects.is(obj, Number))
            return true;
        if (Objects.is(obj, Boolean))
            return true;
        if (Objects.is(obj, Date))
            return true;
        if (Objects.is(obj, RegExp))
            return true;
        if (Objects.is(obj, Function))
            return false;
        if (Objects.is(obj, Array))
            return obj.every(Objects.isClonable);
        if (obj instanceof Element)
            return false;
        return undefined;
    }
    static subtract(target, source) {
        if (Array.isArray(target) && Array.isArray(source)) {
            const result = [];
            for (let i = 0; i < target.length; i++) {
                result.push(Objects.subtract(target[i], source[i]));
            }
            return result;
        }
        if (!Objects.is(target, Object))
            return target;
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
    static parseYaml(str, options) {
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
    static deepSet(obj, path, value) {
        const keys = path.split(".");
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
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
    static async try(func, onCatch) {
        try {
            return await func();
        }
        catch (ex) {
            if (typeof onCatch === "function")
                return await onCatch(ex);
            return onCatch;
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

/***/ "../../../../Shared/Extensions.ts":
/*!****************************************!*\
  !*** ../../../../Shared/Extensions.ts ***!
  \****************************************/
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
        const objType = Number.prototype._getObjectType(obj);
        if (objType === null)
            return obj instanceof type;
        if (objType !== type)
            return false;
        return true;
    };
    // #warning This is a hack to save the _is function somewhere we can access it
    // This is needed because we can't export or import anything from Extensions.ts
    Number.prototype._compare = function (obj1, obj2) {
        const compare = (obj1, obj2) => {
            if (obj1 === obj2)
                return 0;
            // Handle numbers
            if (typeof obj1 === "number" || typeof obj2 === "number") {
                if (obj1 == undefined)
                    obj1 = 0;
                if (obj2 == undefined)
                    obj2 = 0;
                if (typeof obj1 === "number" && typeof obj2 === "number") {
                    return obj1 - obj2;
                }
            }
            // Handle strings
            if (typeof obj1 === "string" || typeof obj2 === "string") {
                return (obj1 || "").localeCompare(obj2 || "");
            }
            // Handle dates
            if (obj1 instanceof Date && obj2 instanceof Date) {
                return obj1.getTime() - obj2.getTime();
            }
            // Handle arrays
            if (Array.isArray(obj1) && Array.isArray(obj2)) {
                if (obj1.length == 1 && obj2.length == 1)
                    return compare(obj1[0], obj2[0]);
                return 0;
            }
            throw new Error(`Cannot compare ${obj1} (${typeof obj1}) with ${obj2} (${typeof obj2})`);
        };
        return compare(obj1, obj2);
    };
    Number.prototype._getObjectType = function (obj) {
        if (typeof obj === "string" || obj instanceof String)
            return String;
        if (typeof obj === "number" && isFinite(obj))
            return Number;
        if (typeof obj === "boolean")
            return Boolean;
        if (Array.isArray(obj))
            return Array;
        if (obj !== null && typeof obj === "object" && !Array.isArray(obj))
            return Object;
        return null;
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
    Number.prototype.toPrecent = function () {
        return `${Math.round(this.valueOf() * 100)}${`%`.c("gray")}`;
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
    String.prototype.capitalize = function () {
        return this[0].toUpperCase() + this.slice(1);
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
    String.prototype.toSingleLine = function () {
        let s = this.toString();
        s = s.replace(/\r/g, " ");
        s = s.replace(/\n/g, " ");
        s = s.replace(/\t/g, " ");
        s = s.replace(/\s+/g, " ");
        return s.trim();
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
    String.prototype.htmlEncode = function () {
        return (this.toString()
            // Replace & with &amp;
            .replace(/&/g, "&amp;")
            // Replace < with &lt;
            .replace(/</g, "&lt;")
            // Replace > with &gt;
            .replace(/>/g, "&gt;")
            // Replace " with &quot;
            .replace(/"/g, "&quot;"));
    };
    String.prototype.textToHtml = function () {
        return (this.toString()
            .htmlEncode()
            // Replace new lines with <br />
            .replace(/\n/g, "<br />"));
    };
    String.prototype.htmlToText = function () {
        const nonContentTags = [
            "script",
            "style",
            "head",
            "title",
            "meta",
            "link",
            "object",
            "iframe",
            "noscript",
            "embed",
            "applet",
            "noframes",
            "param",
            "base",
            "basefont",
            "canvas",
            "svg",
            "math",
            "input",
            "textarea",
            "select",
            "option",
            "button",
            "img",
            "map",
            "area",
            "form",
            "fieldset",
            "legend",
            "label",
            "frameset",
            "frame",
            "bgsound",
            "marquee",
            "blink",
            "embed",
            "ilayer",
            "object",
            "audio",
            "video",
            "source",
            "track",
            "xml",
            "command",
            "keygen",
            "menu",
            "nav",
            "datalist",
            "output",
            "progress",
        ];
        let text = this.toString();
        for (const tag of nonContentTags) {
            const regex = new RegExp(`<${tag}[^>]*>.*?<\\/${tag}>`, "gs"); // Added 's' flag for the dot to match newline characters
            text = text.replace(regex, "\n");
            // Remove the tags that don't have a closing tag
            text = text.replace(new RegExp(`<${tag}[^>]*>`, "g"), "\n");
        }
        // Remove all remaining HTML tags
        text = text.replace(/<[^>]+>/g, "\n");
        // Remove repeating whitespaces
        text = text.replace(/[ \t]+/g, " ");
        // Remove repeating new lines
        text = text.replace(/(\n )+/g, "\n");
        text = text.replace(/\n+/g, "\n");
        text = text.trim(); // Trim leading and trailing whitespace
        return text;
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
    String.prototype.escapeRegExp = function () {
        return this.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
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
    Array.prototype.toMapValue = function (getValue) {
        const map = {};
        this.forEach((item) => {
            map[item] = getValue(item);
        });
        return map;
    };
    Array.prototype.all = function (predicate) {
        return this.findIndex((item) => !predicate(item)) == -1;
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
    Array.prototype.getPairs = function () {
        let pairs = [];
        for (let i = 0; i < this.length - 1; i++) {
            for (let j = i + 1; j < this.length; j++) {
                pairs.push([this[i], this[j]]);
            }
        }
        return pairs;
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
    Array.prototype.exceptLast = function (count) {
        return this.slice(0, this.length - count);
    };
    Array.prototype.sortBy = function (...projects) {
        return this.sort((a, b) => {
            const aVals = projects.map((project) => project(a));
            const bVals = projects.map((project) => project(b));
            return (0)._compare(aVals, bVals);
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
    Array.prototype.rotate = function (count = 1) {
        const arr = this;
        if (arr.length == 0 || count == 0)
            return [...arr]; // Return an empty array if the array is empty
        const rotations = count % arr.length; // Calculate the effective number of rotations
        if (rotations === 0) {
            return arr.slice(); // Return a copy of the original array if no rotations are needed
        }
        const rotatedPart = arr.slice(0, rotations); // Extract the elements to be rotated
        const remainingPart = arr.slice(rotations); // Extract the remaining elements
        return remainingPart.concat(rotatedPart); // Concatenate the two parts to get the rotated array
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

/***/ "../../../../Shared/Lock.ts":
/*!**********************************!*\
  !*** ../../../../Shared/Lock.ts ***!
  \**********************************/
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

/***/ "../../../../Shared/RepeatingTaskQueue.ts":
/*!************************************************!*\
  !*** ../../../../Shared/RepeatingTaskQueue.ts ***!
  \************************************************/
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

/***/ "../../../../Shared/TaskQueue.ts":
/*!***************************************!*\
  !*** ../../../../Shared/TaskQueue.ts ***!
  \***************************************/
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

/***/ "../../../../Shared/TwoWayMap.ts":
/*!***************************************!*\
  !*** ../../../../Shared/TwoWayMap.ts ***!
  \***************************************/
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

/***/ "../../../../Shared/WebScript/add.paths.ts":
/*!*************************************************!*\
  !*** ../../../../Shared/WebScript/add.paths.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const Extensions_Objects_Client_1 = __webpack_require__(/*! ../Extensions.Objects.Client */ "../../../../Shared/Extensions.Objects.Client.ts");
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

/***/ "../../../../Shared/WebScript/is.attribute.name.ts":
/*!*********************************************************!*\
  !*** ../../../../Shared/WebScript/is.attribute.name.ts ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports["default"] = (componentNames, name) => {
    if (name.startsWith("v-"))
        return true;
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

/***/ "../../../../Shared/WebScript/to.template.ts":
/*!***************************************************!*\
  !*** ../../../../Shared/WebScript/to.template.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const add_paths_1 = __importDefault(__webpack_require__(/*! ./add.paths */ "../../../../Shared/WebScript/add.paths.ts"));
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
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!********************************************************!*\
  !*** ../../../LiveIde/Website/script/1693494939476.ts ***!
  \********************************************************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
__webpack_require__(/*! ../../../../Shared/Extensions */ "../../../../Shared/Extensions.ts");
const HtmlHelper_1 = __webpack_require__(/*! ../../Classes/HtmlHelper */ "../../../LiveIde/Classes/HtmlHelper.ts");
const Events_1 = __webpack_require__(/*! ../../../../Shared/Events */ "../../../../Shared/Events.ts");
const Extensions_Objects_Client_1 = __webpack_require__(/*! ../../../../Shared/Extensions.Objects.Client */ "../../../../Shared/Extensions.Objects.Client.ts");
const TaskQueue_1 = __webpack_require__(/*! ../../../../Shared/TaskQueue */ "../../../../Shared/TaskQueue.ts");
const AnalyticsTracker_1 = __webpack_require__(/*! ../../Classes/AnalyticsTracker */ "../../../LiveIde/Classes/AnalyticsTracker.ts");
const ClientContext_1 = __webpack_require__(/*! ../../Classes/ClientContext */ "../../../LiveIde/Classes/ClientContext.ts");
const Params_1 = __webpack_require__(/*! ../../Classes/Params */ "../../../LiveIde/Classes/Params.ts");
const VueManager_1 = __webpack_require__(/*! ../../Classes/VueManager */ "../../../LiveIde/Classes/VueManager.ts");
const Graph_1 = __webpack_require__(/*! ../../../../Shared/Database/Graph */ "../../../../Shared/Database/Graph.ts");
const Flow_1 = __webpack_require__(/*! ../../Classes/Flow */ "../../../LiveIde/Classes/Flow.ts");
// To make it accessible to client code
const win = window;
win.Objects = Extensions_Objects_Client_1.Objects;
win.TaskQueue = TaskQueue_1.TaskQueue;
const generalMixin = {
    matchComp: (c) => true,
    data() {
        return {
            ui: {
                is: {
                    hovered: false,
                    mounted: false,
                },
            },
            handlers: {
                mouseover: null,
                mouseout: null,
            },
        };
    },
    mounted() {
        const self = this;
        self.ui.is.mounted = true;
        self.handlers.mouseover = (e) => {
            self.ui.is.hovered = true;
        };
        self.handlers.mouseout = (e) => {
            self.ui.is.hovered = false;
        };
        self.$el.addEventListener("mouseover", self.handlers.mouseover);
        self.$el.addEventListener("mouseout", self.handlers.mouseout);
    },
    unmounted() {
        const self = this;
        self.ui.is.mounted = false;
        self.$el.removeEventListener("mouseover", self.handlers.mouseover);
        self.$el.removeEventListener("mouseout", self.handlers.mouseout);
    },
};
const flowAppMixin = {
    data() {
        return {
            global: {
                active: {
                    node: null,
                },
            },
        };
    },
};
const flowAppComponentMixin = {
    matchComp: (c) => c.name.startsWith("flow."),
    computed: {
        $global() {
            return this.$root.global;
        },
        $gdb() {
            return this.$root.gdb;
        },
        $nodeDatas() {
            return this.$root.flow.user.app.runtimeData.nodeDatas;
        },
    },
};
const vueAppMixins = [flowAppMixin];
const webScriptMixins = [generalMixin, flowAppComponentMixin];
const mgHelpers = {
    url: {
        thread: (thread, full = false) => {
            if (!thread)
                return null;
            return mgHelpers.url.full(`/t/${thread._id}`, full);
        },
        builder: (builder, full = false) => {
            if (!builder)
                return null;
            return mgHelpers.url.full(`/b/${builder.urlName}`, full);
        },
        media: (media, full = false) => {
            if (!media)
                return null;
            return mgHelpers.url.full(`/m/${media._id}`, full);
        },
        generator: (generator, full = false) => {
            if (!generator)
                return null;
            return mgHelpers.url.full(`/${generator.urlName}`, full);
        },
        instance: (instance, full = false) => {
            if (!instance?.instanceID)
                return null;
            return mgHelpers.url.full(`/instance/${instance.instanceID}`, full);
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
                return mgHelpers.url.image(imageID);
            }
            const imageNode = Extensions_Objects_Client_1.Objects.traverseMap(item).find((a) => a.key == "imageID");
            if (imageNode)
                return mgHelpers.url.image(imageNode.value);
            console.log(item);
            throw new Error("Unknown item type");
        },
        image: (imageID, full = false, removeBackground = false) => {
            if (!imageID)
                return null;
            const noBg = removeBackground ? ".nobg" : "";
            return mgHelpers.url.full(`https://img.memegenerator.net/images/${imageID}${noBg}.jpg`, full);
        },
        item: (item, full = false) => {
            if (!item)
                return null;
            if (item.builderID)
                return mgHelpers.url.media(item, full);
            if ("text0" in item)
                return mgHelpers.url.instance(item, full);
            if (item.format)
                return mgHelpers.url.builder(item, full);
            if (item.displayName)
                return mgHelpers.url.generator(item, full);
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
const mgMixin = {
    match: (c) => c.name.startsWith("mg."),
    data() {
        return {
            url: mgHelpers.url,
            builders: {
                all: {},
                mainMenu: {},
            },
        };
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
    client.Vue.directive("show-parent-hover", {
        inserted(el) {
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
            el._mouseoverHandler = mouseoverHandler;
            el._mouseoutHandler = mouseoutHandler;
            el._parentElement = parent;
        },
        unbind(el) {
            // Retrieve the handlers and parent from the element
            const mouseoverHandler = el._mouseoverHandler;
            const mouseoutHandler = el._mouseoutHandler;
            const parent = el._parentElement;
            // Remove the handlers
            parent?.removeEventListener("mouseover", mouseoverHandler);
            parent?.removeEventListener("mouseout", mouseoutHandler);
        },
    });
    client.Vue.directive("drag", {
        bind(el, binding) {
            let isDragging = false;
            let startX = 0;
            let startY = 0;
            const handleMouseDown = (event) => {
                isDragging = true;
                startX = event.clientX;
                startY = event.clientY;
            };
            const handleMouseMove = (event) => {
                if (!isDragging)
                    return;
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
            el._handleMouseDown = handleMouseDown;
            el._handleMouseMove = handleMouseMove;
            el._handleMouseUp = handleMouseUp;
        },
        unbind(el) {
            // Remove the handlers when the directive is unbound
            el.removeEventListener("mousedown", el._handleMouseDown);
            document.removeEventListener("mousemove", el._handleMouseMove);
            document.removeEventListener("mouseup", el._handleMouseUp);
        },
    });
    client.Vue.directive("hover", {
        bind(el, binding) {
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
            el._handleMouseOver = handleMouseOver;
            el._handleMouseOut = handleMouseOut;
        },
        unbind(el) {
            // Remove the event listeners when the directive is unbound
            el.removeEventListener("mouseover", el._handleMouseOver);
            el.removeEventListener("mouseout", el._handleMouseOut);
        },
    });
    client.Vue.directive("follow-mouse", {
        bind(el, binding) {
            const isEnabled = binding.value === true || binding.value === "true";
            if (!isEnabled)
                return;
            el.style.transition = "none";
            // Function to update the position of the element
            const updatePosition = (event) => {
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
            el._updatePosition = updatePosition;
        },
        update(el, binding) {
            const isEnabled = binding.value === true || binding.value === "true";
            if (isEnabled) {
                document.addEventListener("mousemove", el._updatePosition);
            }
            else {
                document.removeEventListener("mousemove", el._updatePosition);
                el.style.pointerEvents = "auto";
            }
        },
        unbind(el) {
            document.removeEventListener("mousemove", el._updatePosition);
        },
    });
    client.Vue.directive("tooltip", {
        inserted(el, binding) {
            // Check if the styles are already added
            if (!document.getElementById("vue-tooltip-styles")) {
                const style = document.createElement("style");
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
        bind(el, binding) {
            let tooltipElem = null;
            let showTimer = null;
            el.addEventListener("mousemove", function (e) {
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
                // Position the tooltip to the right of the element
                const rect = el.getBoundingClientRect();
                const left = rect.right + 10;
                const top = rect.top + rect.height / 2 - 20;
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
        unbind(el) {
            // Clean up if the element is removed
            const tooltipElem = document.querySelector(".vue-tooltip");
            if (tooltipElem) {
                tooltipElem.remove();
            }
        },
    });
    await client.compileAll((c) => true, webScriptMixins);
    let vueApp = null;
    const isLocalHost = window.location.hostname == "localhost";
    const dbpHost = `https://db.memegenerator.net`;
    const dbp = null; // (await DatabaseProxy.new(`${dbpHost}/MemeGenerator`)) as any;
    const gdbData = await Extensions_Objects_Client_1.Objects.try(async () => await (await fetch(`/gdb.yaml`)).json(), { nodes: [], links: [] });
    const vueManager = await VueManager_1.VueManager.new(client);
    const gdb = await Graph_1.Graph.Database.new(gdbData);
    const flow = new Flow_1.Flow.Manager(vueManager, gdb);
    flow.user.app?.initialize();
    const getNewParams = async () => {
        return (await Params_1.Params.new(() => vueApp, client.config.params, window.location.pathname));
    };
    const params = await getNewParams();
    vueApp = new client.Vue({
        mixins: vueAppMixins,
        data: {
            events: new Events_1.Events(),
            vm: vueManager,
            client,
            dbp,
            gdb,
            flow,
            analytics: await AnalyticsTracker_1.AnalyticsTracker.new(),
            params: params,
            html: new HtmlHelper_1.HtmlHelper(),
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
            newCssRules: {},
        },
        async mounted() {
            await this.init();
            this.events.forward(gdb.events, "gdb");
            this.events.forward(flow.events, "flow");
            this.events.on("*", this.onAppEvent.bind(this));
        },
        methods: {
            async onAppEvent(name, ...args) {
                const self = this;
                self.$emit(name, ...args);
            },
            async init() {
                const self = this;
                self.newCssRules = await (await fetch(`/css-tool`)).json();
                self.compsDic = client.comps.toMap((c) => c.name.hashCode());
                self.compNames = client.comps.map((c) => c.name);
                await self.ensureBuilders();
                self.isAdmin = window.location.hostname == "localhost";
                document.addEventListener("scroll", () => {
                    self.$emit("scroll");
                });
                setTimeout(() => {
                    self.$emit("app-init");
                }, 100);
            },
            async getBuilder(urlNameOrID) {
                const self = this;
                await self.ensureBuilders();
                if (typeof urlNameOrID == "string") {
                    return Object.values(vueApp.builders.all).find((b) => b.urlName == urlNameOrID);
                }
                if (typeof urlNameOrID == "number") {
                    return self.builders.all[urlNameOrID];
                }
                throw new Error("Invalid builder ID");
            },
            async ensureBuilders() {
                const self = this;
                if (!self.dbp)
                    return;
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
            isComponentName(name) {
                if (!name)
                    return false;
                const self = this;
                return !!self.compsDic[name.hashCode()];
            },
            ideWatch(uid, name) {
                const ideWatches = this.ideWatches;
                const key = `${uid}-${name}`;
                if (ideWatches[key])
                    return;
                ideWatches[key] = { uid, name };
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
                const imageUrl = mgHelpers.url.itemImage(item2);
                window.alertify
                    .message(`<a href="${url}" onclick="vueApp.navigateTo(this.href); return false;" class="clickable"><img src="${imageUrl}" /></a><div class="opacity-50 text-center"></div>`)
                    .delay(0);
            },
            itemToUrl(item) {
                if (!item)
                    return null;
                if (typeof item == "string")
                    return item;
                if (item.instanceID)
                    return mgHelpers.url.instance(item);
                if (item.threadID)
                    return mgHelpers.url.thread({ _id: item.threadID });
                if (item.builderID && item.content)
                    return mgHelpers.url.media(item);
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
            async getMoreInstances(pageIndex) {
                const self = this;
                return await self.dbp.instances.select.popular("en", pageIndex, self.params.urlName);
            },
            textToHtml(text, options = {}) {
                if (!text)
                    return null;
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
                if (item.id)
                    return item.id;
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
                    c: "💡",
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
            getNodeVues(node) {
                if (!node)
                    return [];
                const self = this;
                const vues = self.vm.getDescendants(this, (v) => v.$props?.node?.id == node.id);
                return vues;
            },
        },
        watch: {
            newCssRules: {
                handler: async function (newCssRules) {
                    const self = this;
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
    window.vueApp = vueApp;
})();

})();

/******/ })()
;