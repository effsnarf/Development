import { Utility } from "~/code/util/utility";
import { Actionable } from "../action-stack/actionable";
import { IdentityProvider } from "~/code/identity-provider/identity-provider";
import { Database } from "~/code/database/database";
import { LocalStorageDatabase } from "~/code/database/local-storage-database";
import { ModuleManager } from "~/code//module-manager";
import { ActionStack } from "~/code//action-stack/action-stack";
import { PersistedTree } from "~/code/persisted/persisted-tree";
import { PersistedObject } from "../persisted/persisted-object";
import { AppSwitchboard } from "../app/app-switchboard";

class Workspace extends Actionable {
    db!: Database;
    appStateDb!: Database;
    actionStack!: ActionStack;
    tree1!: PersistedTree;
    treeUiState1!: PersistedObject;
    switchboard!: AppSwitchboard;

    vars!: PersistedObject;

    constructor() {
        super();
    }

    async init() {
        let mm = new ModuleManager();
        let identDb = new LocalStorageDatabase(`local.storage.identity.database`, null);
        let ident = (await IdentityProvider.construct(identDb, 'database.unique.id'));
        this.db = new LocalStorageDatabase(`local.storage.database`, ident);
        this.appStateDb = new LocalStorageDatabase(`local.storage.app-state.database`, ident);

        this.actionStack = (await ActionStack.construct(mm, this.db, `test-actions`));

        this.tree1 = (await PersistedTree.construct(this.db, `tree1`));
        this.treeUiState1 = (await PersistedObject.construct(this.db, `treeUiState1`));

        this.switchboard = (await AppSwitchboard.construct(this.tree1));

        this.vars = (await PersistedObject.construct(this.db, `vars`, {
            selected: {
                node: null
            }
        }));

        mm.register(`workspace`, this);
        mm.register(`database`, this.db);
        mm.register(`tree1`, this.tree1);

        // Forward do(), undo(), redo() methods to the action stack
        [`do`, `undo`, `redo`].forEach((actionName) => {
            (this as any)[actionName] = async (...args: any[]) => {
                return (await (this.actionStack as any)[actionName](...args));
            }
        });

        this.actionStack.registerKeyboardShortcuts();

        if (this.actionStack.items.length) {
            await this.actionStack.undo();
            await this.actionStack.redo();
        }

        // Create the app node structure
        if (!this.tree1.get().children?.length) {
            if (confirm(`Create app structure?`)) {
                await this.createAppStructureNodes();
            }
        }
    }

    async createAppStructureNodes() {
        let pages = (await this.createFolderNode(null, `pages`));
        let components = (await this.createFolderNode(null, `components`));

        let test = (await this.createNode({ type: 'component', name: 'test' }, components));
    }

    static async construct() {
        let workspace = new Workspace();
        await workspace.init();
        return workspace;
    }

    async set(variableName: string, value: any) {
        let oldValue = this.vars.getProperty(variableName);
        let action = (await this.vars.setProperty(variableName, value));

        return this.action({
            redo: [`✏`, `set`, [...arguments], action.redo.result],
            undo: [`✏`, `set`, [variableName, oldValue]],
        })
    }

    get(variableName: string) {
        return this.vars.getProperty(variableName);
    }

    async onLayoutDrop(dragItem: any, dropItem: any) {
        await this.createNode(dragItem, dropItem);
    }

    async createNode(node: any, parent: any) {
        // If the drop item is a component, we create a component instance node
        if ((node.type == `component`) && (node.children?.length)) {
            node = {
                type: `component.instance`,
                comp: {
                    _id: node._id,
                    name: node.name,
                }
            };
        };

        let actionName = `Create ${node.type} node`;

        this.actionStack.doGroup(actionName, async () => {
            let newNode = (await this.actionStack.do('tree1', 'createNode', [parent?._id, node]));

            // For component nodes, create subfolders
            if (newNode.type == `component`) {
                // Create component subfolders
                await this.createFolderNode(newNode._id, `layout`);
                await this.createFolderNode(newNode._id, `style`);
                await this.createFolderNode(newNode._id, `data`);
                await this.createFolderNode(newNode._id, `methods`);
                await this.createFolderNode(newNode._id, `links`);
            }

            // For component instance nodes, create variable nodes to expose the component's properties to the app
            if (newNode.type == `component.instance`) {
                let compNodes = Utility.getChildFolder(this.tree1.get(), `components`);
                let compNode = compNodes.children.find((c: any) => (c._id == newNode.comp._id));
                let varNodes = Utility.getChildFolder(compNode, `data`);
                let linkNodes = Utility.getChildFolder(compNode, `links`);
                // Get all the [from] and [to] ids from the links
                let linkedVarIds = linkNodes.children.map((l: any) => ([l.from, l.to])).flat();
                // Include only the linked variables
                varNodes = varNodes.children.filter((v: any) => linkedVarIds.includes(v._id));
                // Create a variable node on the component instance for each variable
                for (let varNode of varNodes) {
                    await this.actionStack.do('tree1', 'createNode', [newNode._id, {
                        type: `component.instance.variable`,
                        name: varNode.name,
                        var: {
                            _id: varNode._id,
                            name: varNode.name,
                        }
                    }]);
                }
            }
        });
    }

    async createFolderNode(parentID: any, name: string) {
        let node = (await this.actionStack.do('tree1', 'createNode', [parentID, {
            type: 'folder',
            name: name,
            children: []
        }]));

        return node;
    }

    async onPropChange(nodeID: any, prop: any, value: any) {
        let node = (await this.tree1.getNode(nodeID));
        if (node?.type == `link`) {
            if ([`from`, `to`].includes(prop)) {
                if (!value.includes(`.`)) {
                    value = parseInt(value);
                }
            }
        }
        await this.actionStack.do('tree1', 'updateNode', [nodeID, prop, value]);
    }

    getDemoNode() {
        return {
            _id: 'demo',
            type: 'layout.panel',
            direction: 'horizontal',
            style: {
                shadow: {
                    x: 0,
                    y: 0,
                    blur: 4,
                    color: '#ffffff30',
                },
            },
            children: []
        };
    }

    getShadowOptions() {
        return [1, 2, 3, 4].map(x => {
            return {
                x: (-Math.pow(2, x)),
                y: (Math.pow(2, x)),
                blur: 2,
                color: '#ffffff80',
            };
        });
    }

    getColorOptions() {
        return [
            '#ff000080',
            '#00ff0080',
            '#ffff0080',
            '#3498db80' // nice shade of blue
        ];
    }

}


export { Workspace };
