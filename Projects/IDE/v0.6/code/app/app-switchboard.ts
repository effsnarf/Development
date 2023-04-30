
// TODO: This needs to be refactored
// TODO 1: Nodes/NodePaths need to be standardized across the app, possible using jsonpath
// TODO 2: AppSource class encapsulates the app source tree, exposes its structure in a usable manner (getLinks, getPages, getComponents, etc)
// TODO 3: Strongly typed classes for app structure (Components, Links, etc)
// TODO 4: AppState encapsulates the runtime state of the app, with nested undo/redo to drilldown specific locations
// TODO 5: AppSwitchboard is responsible for propagating value changes through links
// TODO 6: AppMvc connects the app state to the mvc runtime (Vue in this case)
// TODO 7: AppRuntime is the main class that ties everything together (undoable actions that can be debugged in retrospect)

import { Utility } from "~/code/util/utility";
import { Logger } from "~/code/util/logger";
import { msg } from "~/code/util/msg";
import { Events } from "~/code/util/events";
import { TaskQueue } from "~~/code/util/task-queue";
import { PersistedObject } from "../persisted/persisted-object";
import { PersistedTree, Node, NodePath } from "../persisted/persisted-tree";
import { AppTree } from "./app-tree";
const util = Utility;

declare global {
    interface Array<T> {
        stringifyIds(): string;
        toNodePath(tree: PersistedTree): NodePath;
    }

    interface String {
        toNodePathDescs(tree: PersistedTree): string[];
    }
}

Array.prototype.stringifyIds = function () {
    return this.map((item: any) => item._id).join(`.`);
}

Array.prototype.toNodePath = function (tree: PersistedTree) {
    return NodePath.fromNodes(tree, this);
}

String.prototype.toNodePathDescs = function(tree: PersistedTree): string[] {
    let nodes = this.split(`.`)
        .map(id => parseInt(id))
        .map(id => { return { id, desc: Utility.getNodeIconDesc(tree.getNode(id), tree) }; })
        .map(item => `${item.desc} (${item.id})`)
        ;
    return nodes;
}

// Maintains a list of node paths -> runtime mvc components
class RuntimeMvcComps {
    private byPaths: Map<string, RuntimeMvcComp[]> = new Map();
    private byCompIds: Map<number, string> = new Map();

    get compCount() {
        return this.byCompIds.size;
    }

    get(path: string) {
        return (this.byPaths.get(path) || []);
    }

    add(path: string, comp: RuntimeMvcComp) {
        this.byPaths.set(path, [...(this.byPaths.get(path) || []), comp]);
        this.byCompIds.set(comp.uid, path);
    }

    delete(uid: number) {
        let path = this.byCompIds.get(uid);
        if (path) {
            this.byPaths.set(path, (this.byPaths.get(path) || []).filter(c => c.uid != uid));
            this.byCompIds.delete(uid);
        }
    }
}

// The switchboard will use this interface to communicate with the MVC runtime
class RuntimeMvcComp {
    public getVue: () => any;
    // The unique id of the component in the MVC runtime
    public uid: number;
    // The path to the application node in the context of our architecture
    public nodePath: any[];
    // The application node in the context of our architecture
    public node: any;

    constructor(vue: any) {
        this.getVue = () => vue;
        this.uid = vue._.uid;
        this.nodePath = vue.nodePath;
        this.node = vue.node;
    }

    static async fromVue(vue: any) {
        let mvcComp = new RuntimeMvcComp(vue);
        return mvcComp;
    }
}

// Switchboard class
//
// Maintains a list of data nodes that link to each other
// A data node is a variable, a method, an input, any app part that references data
//
// A link is a connection between two data nodes
// Whenever a data node changes, the switchboard will update the linked data nodes
// In case of a variable, the linked data nodes will be updated with the new value and will propogate the change
// In case of a method, the method will be evaluated and the result will be propogated to the linked data nodes
// The list of changes to evaluate and propogate is maintained in a queue
//
// The switchboard is a singleton, there is only one switchboard per app
// The switchboard is also responsible for linking between the switchboard model and the specific MVC runtime
class AppSwitchboard {
    // The application source
    private appSource: PersistedTree;
    private appTree: AppTree;
    private rtMvcComps: RuntimeMvcComps = new RuntimeMvcComps();
    private methods: Map<string, any> = new Map();
    private methodArgs: Map<string, Map<string, any>> = new Map();
    private values: Map<string, any> = new Map();
    private links: Map<string, string[]> = new Map();

    public events = new Events();

    constructor(appSource: PersistedTree) {
        this.appSource = appSource;
        this.appTree = new AppTree(appSource);
        this.init();
    }

    static async construct(appSource: PersistedTree) {
        let sb = new AppSwitchboard(appSource);
        return sb;
    }

    // Initialize the switchboard
    async init() {
        let pages = this.appSource.findNodePath(n => (n.name == `pages`));

        this.appTree.findRuntimeLinks(pages.getIds(), pages, this.createLink.bind(this));
    }

    createLink(link: any) {
        let from1 = link.from.path.join(`.`).toNodePathDescs(this.appSource);
        let to1 = link.to.path.join(`.`).toNodePathDescs(this.appSource);

        let desc = `${from1.last()} -> ${to1.last()}`;

        Logger.log(`🔗`, `app-switchboard`, `createLink`, desc, { _id: link._id, from: from1, to: to1 });

        let from = link.from.path.join(`.`);
        let to = link.to.path.join(`.`);

        this.links.set(from, [...(this.links.get(from) || []), to]);
        //console.log(`${from} -> ${to}`);

        if (link.to.node.type == `code.method`) {
            this.methods.set(to, link.to.node);
            this.methodArgs.set(to, new Map());
            //console.log(`${to} -> method ${link.to.node.name}`);
        }
    }

    async mvcRuntimeChangedNodeValue(uid: number | null, nodePath: string, value: any) {
        let nps = nodePath.toNodePathDescs(this.appSource);
        Logger.log(`🧊`, `app-switchboard`, `mvcRuntimeChangedNodeValue`, nps.last(), { uid, nps, value });

        if (this.updateValue(nodePath, value)) {
           await this.propogate(nodePath, value);
        }
    }

    async propogate(nodePath: string, value: any)
    {
        //console.log(`[${uid}] - ${nodePath} = ${value}`);
        // Find the relevant links
        let tos = (this.links.get(nodePath) || []);

        if (!tos.length) {
            //Logger.log(`🚫`, `app-switchboard`, `propogate`, `${nodePath.toNodePathDescs(this.appSource).last()} (no links)`, { nodePath, value })
            return;
        }

        for (let to of tos) {
            let desc = `${nodePath.toNodePathDescs(this.appSource).last()} -> ${to.toNodePathDescs(this.appSource).last()}`;
            Logger.log(`▶🔗`, `app-switchboard`, `propogate`, desc, { from: nodePath, to, value });
            // If sending to a method
            if (this.methods.get(to)) {
                // [value] is sent to the method's args
                let args = this.methodArgs.get(to);
                // Currently only one argument is supported
                args?.set(`arg1`, value);
                // Invoke the method outside the thread of iterating through the links
                // So that other links can be updated while potentially long-running methods are running
                let runMethod = async () => {
                    // TODO: Make this optional
                    // Clear the result of the method for propagated links
                    this.propogate(to, null);
                    // Invoke the method
                    let result = (await this.invokeMethod(to));
                    // Replace [value] with the method's result
                    value = result;
                    // Update the value in the switchboard
                    if (this.updateValue(to, value)) {
                        // Propogate the change to other links
                        await this.propogate(to, value);
                    }
                };
                setTimeout(runMethod, 0);
            }
            else {
                // Update the value in the switchboard
                if (!this.updateValue(to, value)) continue;
                // Propogate the change to other links
                await this.propogate(to, value);
            }
        }
    }

    // TODO: SearchInstances is invoked multiple times
    async mvcRuntimeClicked(uid: number, nodePath: string, dataItems: any[]) {
        Logger.log(`🖱️`, `app-switchboard`, `mvcRuntimeClicked`, nodePath.toNodePathDescs(this.appSource).last(), { uid, nodePath, dataItems });

        //console.log(`[${uid}] - ${nodePath} clicked`);
        await this.mvcRuntimeChangedNodeValue(uid, nodePath, dataItems[0]);
    }

    updateValue(nodePath: string, value: any) {
        Logger.log(`✏️`, `app-switchboard`, `updateValue`, nodePath.toNodePathDescs(this.appSource).last(), { value });
        // If the value is already the same, skip updating and propagation
        if (Utility.areEqual(value, this.values.get(nodePath))) return false;
        // Update the value in the switchboard
        this.values.set(nodePath, value);
        // Update the value in the UI MVC component
        let mvcComps = this.rtMvcComps.get(nodePath);
        //console.log(`Notifying ${mvcComps?.length || 0} MVC components`);
        for (let mvcComp of mvcComps) mvcComp.getVue().setNodeValue(value);
        // Notify any listeners
        this.events.emit(`node-update`, nodePath, { value: value });
        return true;
    }

    // Invoke a method
    async invokeMethod(methodPath: string) {
        this.events.emit(`node-update`, methodPath, { state: `running` });
        try {
            // Get the method
            let method = this.methods.get(methodPath);
            // Get the method's arguments
            let args = this.methodArgs.get(methodPath);
            // Change the args to an array
            let argsValues = Array.from(args?.values() || []);
            // Compile the method
            let compiled = this.compileMethod(method);
            // Invoke the method
            let started = performance.now();
            let isRunning = true;
            //msg.alert(`${method.name}(${argsValues.join(', ')})`);
            // Start a timer that updates the elapsed time
            let updateElapsed = () => {
                this.events.emit(`node-update`, methodPath, { elapsed: Math.round(performance.now() - started) });
                if (isRunning) setTimeout(updateElapsed, 100);
            };
            updateElapsed();
            let result = await compiled.apply(null, argsValues);
            let ended = performance.now();
            isRunning = false;
            let elapsed = (ended - started).toFixed(0);
            //console.log(result);
            //msg.alert(`${method.name}(${argsValues.join(', ')}) (${elapsed}ms)`);
            // Return the result
            return result;
        }
        finally {
            this.events.emit(`node-update`, methodPath, { state: `idle` });
        }
    }

    // Compile a method
    compileMethod(method: Node) {
        try {
            let compiled = eval(`(async function(${method.args}) { ${method.body} })`);
            return compiled;
        }
        catch (ex) {
            throw new Error(`Error compiling method: ${ex}`);
        }
    }

    // Register an MVC component with the switchboard
    // The switchboard will use this interface to communicate with the MVC runtime
    register(mvcComp: RuntimeMvcComp) {
        //console.log(`register (${mvcComp.uid}, ${mvcComp.nodePath.map(n => (n._id)).join('.')})`);
        let nodePath = mvcComp.nodePath.stringifyIds();
        this.rtMvcComps.add(nodePath, mvcComp);
        let file = mvcComp.getVue().$options.__file.split('/').last();
        //console.log(this.rtMvcComps.compCount);
    }

    // Unregister an MVC component with the switchboard
    unregister(uid: number) {
        //console.log(`unregister (${uid})`);
        this.rtMvcComps.delete(uid);
        //console.log(this.rtMvcComps.compCount);
    }
}

export { RuntimeMvcComp, AppSwitchboard };
