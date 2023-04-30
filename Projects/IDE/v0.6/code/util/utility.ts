import { msg } from "./msg";
import { JSONPath } from '~/lib/jsonpath-plus/dist/index-browser-esm.js';


declare global {
    interface Array<T> {
        last(): T;
        first(): T;
    }
}

Array.prototype.last = function () {
    return this[this.length - 1];
}

Array.prototype.first = function () {
    return this[0];
}


let Utility = {
    jsonPath: (JSONPath as Function),
    arrayToMap: (array: any[], keySelector: (a: any) => any, valueSelector: (map: any, item: any) => any = ((map, item) => item)) => {
        let map = ({} as any);
        for (let item of array) {
            map[keySelector(item)] = valueSelector(map, item);
        }
        return map;
    },
    app: {
        registerVue(vue: any) {
        },

        // Get the component tree
        // This is to better visualize the component hierarchy without the layout specifics
        // Includes components, component instances, component instance variables, and lists
        getComponentTree(root: any) {
            let compTreeRoot = { children: [] };
            // Check if the node is relevant
            let includeNode = (node: any) => {
                if (node.type == "folder") {
                    return false;
                    if (["data", "layout", "links"].includes(node.name)) return true;
                    return false;
                }
                if (["component", "component.instance", "layout.list",
                    "content.text", "content.image",
                    "component.instance.variable", "data.variable"
                ].includes(node.type)) {
                    return true;
                }
            }

            // Traverse the tree recursively. The tree is a tree of components, component instances, and lists
            // The tree is traversed in a depth first manner
            // If the node is relevant, add it to the tree
            // Otherwise, traverse its children recursively
            let traverse = (node: any, compTree: any) => {
                if (includeNode(node)) {
                    let newNode = { ...node };
                    newNode.children = [];
                    compTree.children.push(newNode);
                    compTree = newNode;
                }
                if (node.children) {
                    for (let child of node.children) {
                        traverse(child, compTree);
                    }
                }
            };
            // Traverse the tree
            traverse(root, compTreeRoot);
            return compTreeRoot;
        },

        nodeValueChanged(vue: any, value: any) {
            let appComp = Utility.app.getAppComponent(vue);
            appComp.nodeValueChanged(vue.node, value);
        },

        getAppApp(vue: any) {
            return Utility.app.findAncestor(vue, (ancestor: any) => ancestor.$data.isAppApp);
        },

        // Find the containing app component (app-layout-component)
        getAppComponent(vue: any) {
            return Utility.app.findAncestor(vue, (ancestor: any) => ancestor.$data.isAppComponent);
        },

        // Find the containing app component ancestors (app-layout-component)
        getAppComponents(vue: any) {
            return Utility.app.findAncestors(vue, (ancestor: any) => ancestor.$data.isAppComponent);
        },

        // Search for an ancestor vue component with a given predicate
        findAncestor(vue: any, predicate: any) {
            let ancestor = vue;
            while ((!predicate(ancestor)) && ancestor.$parent) {
                ancestor = ancestor.$parent;
            }
            if (!predicate(ancestor)) ancestor = null;
            return ancestor;
        },

        findAncestors(vue: any, predicate: any) {
            let ancestors: any[] = [];
            let ancestor = vue;
            while (ancestor) {
                if (predicate(ancestor)) ancestors.unshift(ancestor);
                ancestor = ancestor.$parent;
            }
            return ancestors;
        },

        // Values that are set by this node receiving a message
        // For example, a list node will receive a message from a data source node
        // or a text node will receive a message from a variable that received a message from a textbox node
        // Saving the node values here instead of in the vue component allows the state to persist
        node: reactive({ values: {} }),
    },

    is: {
        dictionary(obj: any) {
            return (typeof obj === `object`) && (obj !== null) && (!Array.isArray(obj));
        },
        array(obj: any) {
            return Array.isArray(obj);
        },
        proxy(obj: any) {
            return (obj?.constructor?.name == `Proxy`);
        }
    },

    // Returns a rate-limited version of the function
    // Limited by setTimeout()
    rateLimit(func: any, wait: number) {
        let timeout: any;
        return function (...args: any[]) {
            if (!timeout) {
                timeout = setTimeout(() => {
                    timeout = null;
                    func(args);
                }, wait);
            }
        };
    },

    // Proxify an object
    proxify(obj: any, getter: any, setter: any) {
        return new Proxy(obj, {
            get: getter,
            set: setter
        });
    },

    // Deep get property
    getObjProperty(obj: any, name: string | symbol): any {
        if (name == Symbol.toStringTag) return obj.toString();

        name = (name as string);

        let parts = name.split(`.`);
        let part = parts.shift();

        if (!part) throw new Error(`Invalid property name: ${name}`);

        if (parts.length) {
            return this.getObjProperty(obj[part], parts.join(`.`));
        } else {
            return obj[part];
        }
    },

    // Deep set property
    setObjProperty(obj: any, name: string, newValue: any) {
        let parts = name.split(`.`);
        let part = parts.shift();

        if (!part) throw new Error(`Invalid property name: ${name}`);

        if (parts.length) {
            obj[part] = (obj[part] || {});
            this.setObjProperty(obj[part], parts.join(`.`), newValue);
        } else {
            obj[part] = newValue;
        }
    },

    getCssClass(node: any, selection: any) {
        if (!node) return null;

        let cls: any = {};

        if (typeof (node?.type) == `string`) {
            for (let t of node?.type?.split(`.`)) cls[t] = true;
        }

        if (node.direction) cls[node.direction] = true;

        cls.hovered = (node?._id) && (node?._id == selection?.hovered?._id);
        cls.selected = (node?._id) && (node?._id == selection?.selected?._id);

        return cls;
    },

    getStyle(node: any) {
        if (!node) return null;

        let st: any = {};

        st[`box-shadow`] = this.toStyleShadow(node?.style?.shadow);
        st['background-color'] = node?.style?.background?.color;

        return st;
    },

    toStyleShadow(shadow: any) {
        if (!shadow) return null;

        return `${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.color}`;
    },

    getNodeCompName(type: any) {
        if (!type) return `app-layout-root`;
        return `app-${type.replaceAll(`.`, `-`)}`;
    },

    getChildFolder(node: any, name: string) {
        return this.getChildFolders(node, name)[0];
    },

    getChildFolders(node: any, name: string) {
        return node.children.filter((c: any) => (c.type == `folder`) && (c.name == name));
    },

    getChildNodes(node: any, types: string[] = []) {
        if (!Array.isArray(types)) types = [types];
        return node.children.filter((c: any) => (!types.length) || (types.includes(c.type)));
    },

    getFolderNodes(node: any, folder: string, types: string[] = []) {
        let folderNode = Utility.getChildFolder(node, folder);
        if (!folderNode) throw new Error(`Folder not found: ${folder}`);
        let nodes = Utility.getChildNodes(folderNode, types)
        return nodes;
    },

    getNewNode(type: string, props = {}) {
        return Object.assign({
            type: `${type}`
        }, props);
    },

    getNodeIconDesc(node: any, tree: any) {
        if (!node) return ``;

        return `${this.getNodeIcon(node.type)}${this.getNodeDesc(tree, node)}`;
    },

    getNodeIcon(type: string) {
        if (!type) return `❔`;

        let icons: Record<string, any> = {
            folder: '📁',
            component: '📦',
            'component.instance': '🎁',
            'component.instance.variable': '🎁🧊',
            layout: '⬜',
            'layout.list': '●●',
            'content.image': '🖼️',
            'content.text': '🆎',
            'input.text': '⬛',
            'data.variable': '🧊',
            'code.method': '🔴',
            'link': '🔗',
        };

        return (icons[type] || icons[type.split('.')[0]] || `❔`);
    },

    getNodeDesc(tree: any, node: any) {
        if (!node) return null;

        if (node.name) return node.name;

        if (node.type == `component.instance`) {
            return `${node.comp.name}`;
        }

        if (node.type == `link`) {
            return this.getNodeLinkDesc(tree, node);
        }

        if (node.type == `layout.panel`) {
            return `${node.direction}`;
        }

        if (!node.type) return '';

        return node.type.split(`.`).pop();
    },

    getNodeLinkDesc(tree: any, node: any) {
        if (!node) return null;

        if (node.type == `link`) {
            let from = tree.getNode(node.from);
            let to = tree.getNode(node.to);
            from = this.getNodeIconDesc(from, tree);
            to = this.getNodeIconDesc(to, tree);
            return `${from} 🠚 ${to}`;
        }

        return null;
    },

    async runMethod(method: any, args: any[] = []) {
        msg.alert(`${method.name} (${args})`)
        try {
            let started = Date.now();

            let func = eval(`(async function(${method.args}) { ${method.body} })`);

            let result = (await func.apply(null, args));

            let elapsed = (Date.now() - started);
            msg.alert(`${method.name} (${elapsed}ms)`);

            return result;
        }
        catch (ex: any) {
            msg.alert(`Error running method: ${method.name}: ${ex.message}`);
        }
    },

    async wait(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    areEqual(a: any, b: any) {
        if (a == b) return true;
        return (JSON.stringify(a) === JSON.stringify(b));
    },

    isNully(value: any) {
        return (value == null) || (value == undefined);
    }
}

export { Utility }
