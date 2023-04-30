// AppTree class
//
// Methods specific to the app tree

import { Logger } from "~/code/util/logger";
import { Node, NodePath, PersistedTree } from "~/code/persisted/persisted-tree";

class AppTree {
    private appSource: PersistedTree;
    private is: AppTreeNodeTypeChecker = new AppTreeNodeTypeChecker();

    constructor(appSource: PersistedTree) {
        this.appSource = appSource;
    }

    // Traverse the app source tree, find all the links and construct their full path
    // In runtime, components can be nested inside component instances, inside other components, etc.
    // We need to identify the link data nodes in the context of the app runtime
    findRuntimeLinks(context: number[], comp: NodePath, cb: Function, alreadyFound: Map<string, boolean> = new Map()) {
        // Make sure we don't create the same link twice
        let callCb = (link: any) => {
            let key = JSON.stringify({ from: link.from.path, to: link.to.path });
            if (alreadyFound.has(key))
            {
                Logger.log(`🚫🔗`, `link`, `findRuntimeLinks`, `(duplicate)`, link);
                return;
            }
            alreadyFound.set(key, true);
            cb(link);
        }

        // In this component, find all component instances
        let layoutPs = comp.find((n: any) => (n.name == `layout`));
        let compInsts = this.appSource
            .getNodePaths(layoutPs)
            .filter(this.is.componentInstance);

        // Find the links in the current component
        let linkPs = comp.find((n: any) => (n.name == `links`));
        let links = this.appSource
            .getNodePaths(linkPs)
            .filter(this.is.link)
            .map(l => l.last);

        let toLink = (_id: (number | null), from: number[], to: number[]) => {
            return {
                _id,
                from: {
                    path: from,
                    node: this.appSource.getNode(from.last())
                },
                to: {
                    path: to,
                    node: this.appSource.getNode(to.last())
                }
            }
        }

        // For each component instance refernce in this component
        // 1. Create a runtime link from its comp inst variables to the component variables
        // 2. Create links from the component's links
        for (let compInst of compInsts) {
            let path = [...context, compInst.last._id];
            // 1. Component instance variables
            let compInstVars = compInst.findAll((n: any) => (n.type == `component.instance.variable`));
            for (let compInstVar of compInstVars) {
                // Link from the internal component to the component instance variable
                let from = [...path, compInst.last.comp._id, compInstVar.last.var._id];
                let to = [...path, compInstVar.last._id];
                callCb(toLink(null, from, to));
                // And in the other direction, to allow passing data from outside into components
                callCb(toLink(null, to, from));
            }
            // 2. Component links
            // Find the component
            let compInstComp = this.appSource.findNodePath((n: any) => (n._id == compInst.last.comp._id));
            //console.group(compInstComp.last.name);
            // Build more links recursively
            this.findRuntimeLinks([...path, compInstComp.last._id], compInstComp, cb, alreadyFound);
            //console.groupEnd();
        }

        // Check if the id is a component instance variable, and if so, adds the component instance id to the path
        let getPath = (context: number[], id: number | string) => {
            let path = [...context];
            // In case of deep links, the id is a string (e.g. `1.2.3`), and we add it to the context
            if (typeof id == `string`) {
                let ids = id.split(`.`).map(i => parseInt(i));
                id = (ids.pop() || 0);
                path.push(...ids);
            }
            let nodePath = comp.find((n: Node) => (n._id == id));
            if (nodePath?.last.type == `component.instance.variable`) {
                path.push(nodePath.beforeLast._id);
            }
            path.push(id);
            return path;
        }

        for (let link of links) {
            let from = getPath(context, link.from);
            let to = getPath(context, link.to);
            callCb(toLink(link._id, from, to));
        }
    }

    onlyStructureNodes(nodePath: NodePath): NodePath {
        return NodePath.fromNodes(nodePath.tree, nodePath.nodes.filter(this.is.structure));
    }
}

class AppTreeNodeTypeChecker {
    componentInstance(nodePath: NodePath) {
        return (nodePath.last.type == `component.instance`);
    }

    variable(nodePath: NodePath) {
        return (nodePath.last.type == `component.instance.variable`);
    }

    link(nodePath: NodePath) {
        return (nodePath.last.type == `link`);
    }

    structure(node: Node) {
        if ([`folder`, `layout`].find(t => (node as Node).type?.startsWith(t))) return false;
        return true;
    }

    dataNode(node: Node | NodePath) {
        if (node instanceof NodePath) node = node.last;

        if ([`folder`, `layout`].find(t => (node as Node).type.startsWith(t))) return false;

        return true;
    }
}


export { AppTree as AppTree };
