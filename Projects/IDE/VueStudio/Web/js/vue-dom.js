

var vueDom = {
    get: {
        ancestor: (descendant, vueCompName, depth = 0) => {
            if (depth > 30) return null;
            if (!descendant) return null;
            if (descendant.$options.name == vueCompName) return descendant;
            return vueDom.get.ancestor(descendant.$parent, vueCompName, (depth + 1));
        },
        sibling: {
            index: (node) => {
                if (!node.$parent) return 0;
                return node.$parent.$children.findIndex(c => (c == node));
            }
        },
        path: (node, path) => {
            if (!path) path = [];
            path.unshift(vueDom.get.sibling.index(node));
            if (!node.$parent) return path;
            return vueDom.get.path(node.$parent, path);
        },
        vues: {
            fromEl: (el, vues = []) => {
                if (!el) return vues;
                if (el.__vue__) vues.push(el.__vue__);
                vues.push(...vueDom.get.vues.fromEl(el.parentElement));
                return vues;
            }
        }
    },
    map: {
        tree: (node, proj, items = []) => {
            var n = proj(node);
            n.path = vueDom.get.path(node);
            items.push(n);
            node.$children.forEach(c => vueDom.map.tree(c, proj, items));
            return items;
        }
    },
    save: {
        tree: (root) => {
            var vues = vueDom.map.tree(root, (v => {
                return { uid: v._uid,
                    data: v.$data,
                    compName: v.$options.name
                    };
                }));
            return vues;
        }
    },
    restore: {
        tree: (root, vues) => {
            vueDom.map.tree(root, (node) => {
                var nodePath = vueDom.get.path(node);
                var old = vues.find(v => v.path.equals(nodePath));
                if ((!old) || (old.compName != node.$options.name))
                {
                    //console.warn(`Vue trees different, restored only until ${nodePath}`);
                    return {};
                }
                Object.keys(node.$data).forEach(k => { node.$data[k] = old.data[k]; });
                return {};
            });
        }
    }
}
