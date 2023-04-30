import { Node, NodePath } from "~/code/persisted/persisted-tree";

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


export { AppTreeNodeTypeChecker }
