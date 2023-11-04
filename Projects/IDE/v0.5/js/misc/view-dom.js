if (typeof(require) != "undefined")
{
  var util = require("../../../Anat.dev/DatabaseProxy/utility.js");

  var compDom = require("./comp-dom.js");
}




Array.prototype.equals = function(arr2) {
  return (JSON.stringify(this) == JSON.stringify(arr2));
}




var viewDom = {

  toIndirect: (obj) => {
    if (Array.isArray(obj)) return obj.map(a => viewDom.toIndirect(a));
    return { get: () => obj };
  },

  getElementInfo: (el) => {
    var attrs = [];
    for (var i = 0; i < el.attributes.length; i++)
    {
      var attr = el.attributes[i];
      attrs.push({ name: attr.name, value: attr.value });
    }

    return {
      tag: el.tagName.toLowerCase(),
      attrs: attrs,
      getEl: () => el
    };
  },

  toDomElements: (el) => {
    if (!el) return [];
    var els = [];
    if (el instanceof HTMLElement) els.push(el);
    if (el instanceof jQuery)
      els.push(...el.get());
    if (Array.isArray(el)) els.push(...el.map(viewDom.toDomElements));
    return els;
  },

  countNodes: (node) => {
    if (!node) return null;
    var count = 0;
    viewDom.traverse(node, (n => count++));
    return count;
  },

  createAttr: async (node, name = null, value = null, enabled = true) => {
    var attr = { id: (await compDom.get.new.id()), name: name, value: value, enabled: enabled, bind: false };
    node.attrs.push(attr);
    return attr;
  },
  deleteAttr: function(attr) {
    if (attr.node) attr.node().attrs.remove(attr);
  },
  copyAttr: function(attr, destNode) {
    destNode.attrs.push(attr);
  },
  moveAttr: function(attr, destNode) {
    destNode.attrs.push(attr);
    viewDom.deleteAttr(attr);
  },
  getVue: (el) => {
    do
    {
      var vue = el.__vue__;
      if (vue)
      {
        while (!vue.$options.name) vue = vue.$parent;
        return vue;
      }
      el = el.parentElement;
    }
    while (el);
  },
  getRuntimeNode: (vnode) => {
    //if ((nodePath) && (typeof(nodePath) == "string")) nodePath = JSON.parse(nodePath);
    nodePath = JSON.parse($(vnode.elm).attr("ide-node-path") || null);
    if (!nodePath) return null;
    var vue = vnode.context;
    var comp = compDom.get.comp.item(vue.$options.name);
    // check if we're in a nested component
    // but the parent is not the ide's component host
    if (vnode?.parent?.componentInstance)
    {
      var parentComp = compDom.get.comp.item(vnode.parent.context.$options.name);
      if (parentComp) comp = parentComp;
    }
    if (!comp)
    {
      console.warn(`Component ${comp.name} not found.`);
      return null;
    }
    var node = viewDom.getNode(comp.view.node, nodePath);
    if (!node)
    {
      console.warn(`Invalid IDE node.`);
      return null;
    }
    var rnode = {
      vue: vue,
      vnode: vnode,
      comp: { name: comp.name, item: comp },
      node: { path: nodePath, item: node }
    }
    return rnode;
  },
  getNodeElements: (node) => {
    if (!node) return $();
    var comp = node.comp();
    if (comp.name.startsWith(`IDE.`)) return $();
    var nodePath = `${comp._id}|${node.path.join(`.`)}`;
    var selector = `[ide-nodes*="${nodePath}"]`;
    var $els = $(selector);
    $els = $els.filter((i, el) => {
      if ($(el).parents(`.ide-tree`).length) return false;
      if ($(el).attr(`ide-nodes`)?.split(`,`).includes(nodePath)) return true;
      return false;
    });
    return $els;
  },
  rnodeEquals: (rnode1, rnode2) => {
    if (rnode1.comp.item.name != rnode2.comp.item.name) return false;
    if (rnode1.vue.uid != rnode2.vue.uid) return false;
    if (rnode1.node.item.path != rnode2.node.item.path) return false;
    return true;
  },
  traverse: function(node, cb) {
    cb(node);
    for (child of node.children) viewDom.traverse(child.node, cb);
},
  mapTree: function(node, proj, getChildNodes = ((n) => n.children), getNodeItem = ((n) => n.node)) {
    var items = [];
    items.push(proj(node));
    for (child of getChildNodes(node)) items.push(...viewDom.mapTree(getNodeItem(child), proj, getChildNodes, getNodeItem));
    return items;
  },
  filterTree: function(node, predicate, getChildNodes, getNodeItem) {
    var nodes = viewDom.mapTree(node, n => n, getChildNodes, getNodeItem);
    var filtered = nodes.filter(predicate);
    return filtered;
  },
  // same as filterTree but only for the node's children, without applying the filter to the root
  filterTreeChildren: function(node, predicate, getChildNodes = ((n) => n.children), getNodeItem = ((n) => n.node)) {
    return getChildNodes(node)
      .flatMap(child => viewDom.filterTree(getNodeItem(child), predicate, getChildNodes, getNodeItem));
  },
  nodeToHaml: function(comp, node, indent = 0, cbNode = (n => n), isRootNode = false) {
    node = util.clone(node);
    // default node settings
    if (!("enabled" in node)) node.enabled = true;
    if (!node.enabled) return "";
    if (!node.type) node.type = (node.tag ? "tag" : node.text ? "text" : null)
    cbNode(node);
    node.attrs?.forEach(attr => { if (!("enabled" in attr)) attr.enabled = true; });

    var s = [];

    // "slots" node compiles to several "slot" nodes.
    //
    // template v-slot:* is a compile time binding, not a runtime binding
    // so we can't use dynamic v-for `slot-${i}` slot names.
    //
    // a "slots" node will be replaced by the compiler with as many "slot" nodes
    // as needed by other components using it.
    //
    // for example:
    //
    // - UI.Pages
    //   - slots
    // - MG.Pages
    //   - UI.Pages
    //     - MG.Search.Page
    //     - MG.Generator.Page
    //
    // - the compiler will detect that MG.Pages uses UI.Pages with two sub component nodes
    // and will replace UI.Pages' "slots" with two "slot" tags named "slot-1" and "slot-2"
    // and will wrap the "MG.Search.Page" and "MG.Generator.Page" nodes each with a
    // "template" tag with v-slot:slot-1 and v-slot:slot-2 attributes.
    //
    // - this allows us to place components within each other in design time,
    // transparently using vue's "template" and "slot" mechanism and tags.
    if (node.tag == `slots`)
    {
      // make sure we have enough compile time slots for everyone who uses this component
      // with subnodes placed into it
      var childNodeCounts = compDom.get.all.nodes()
        .filter(n => (n.nodeComp?._id == comp._id))
        .map(n => n.children.length);
      var maxSlots = Math.max(...childNodeCounts);
      // however, this doesn't really work because we need to recompile this comp
      // if a dependent comp changes
      // so I'm just adding a lot of vue slots
      maxSlots = 100;
      // replace "slots" with enough "slot" tags
      for (var i = 0; i < maxSlots; i++)
      {
        s.push(`%slot{name: "slot-${i}"}`);
      }
      s = s.map(l => `${"".padStart(indent * 2)}${l}`);
      return s.join("\n");
    }

    // `m-list-animation` attribute renders to changing the parent to `transition-group` tag
    if (node.children?.length == 1)
    {
      var animAttr = node.children[0].node.attrs.find(a => (a.enabled) && (a.name == `m-list-animation`));
      if (animAttr)
      {
        if (compDom.is.comp.node(node))
        {
          alertify.error(`${comp.name}: Parent node of animated v-for node must be an html tag node, not a component.`);
        }
        else
        {
          // replace the parent with Vue's `transition-group` tag
          var attrName = `name`;
          if (animAttr.bind) attrName = `:name`;
          node.attrs.push({ name: attrName, value: animAttr.value, enabled: true });
          node.attrs.push({ name: `tag`, value: node.tag, enabled: true });
          node.tag = `transition-group`;
        }
      }
    }

    var includeAttr = (attr) => {
      if (!attr.enabled) return false;
      if (attr.name == `m-list-animation`) return false;
      return true;
    };

    switch (node.type) {
      case "text":
        s.push(node.text);
        break;
      case "tag":
        var tag = node.tag;
        var nodeComp = compDom.get.node.comp(node);
        // attributes
        var nodeAttrs = (node.attrs || []);
        attrs = nodeAttrs
          .filter(includeAttr)
          .map(a => {
            var name = a.name;
            var value = a.value;
            if (!name) return null;
            if ((value == null) || (typeof(value) == "undefined")) return `"${name}": ""`;
            var addColon = false;
            if (a.bind)
            {
              if ((!(["v-", "@", "#", ":"].find(c => name.startsWith(c)))))
                addColon = true;
            }
            if (typeof(value) == "object")
            {
              addColon = true;
              //value = value.toString();
              value = (JSON.stringify(value)).replaceAll('"', "'");
            }
            name = util.html.escape(name);
            //if (value != util.html.escape(value)) console.log(value, util.html.escape(value));

            if (addColon) name = `:${name}`;
            return `"${name}": "${value}"`;
          })
          .filter(a => a);
        // component nodes
        if (nodeComp)
        {
          nodeCompName =
            (nodeComp.name.startsWith(`IDE.`)) ?
              compDom.get.comp.name.vueName(nodeComp) :
            (compiler.mode == `production`) ?
              nodeComp.name.kebabize() :
              compDom.get.comp.name.vueName(nodeComp);
          //tag = nodeCompName;
          tag = `component`;
          attrs.push(`"is": "${nodeCompName}"`);
        }
        // path
        if (node.path)
        {
          var nodes = [util.with(node, "comp", comp)];
          // my component nodes, when rendered by vue, have two nodes from different components
          // sharing the same HTML node, because vue merges the root component node
          // with the container html node, so we need to inform the debugger about both of them
          if (nodeComp)
          {
            // add the root node of the child component
            var nodeCompRootNode = viewDom.getNode(nodeComp.view.node, [0]);
            if (nodeCompRootNode) nodes.push(util.with(nodeCompRootNode, "comp", nodeComp));
          }
          if (compiler.mode != `production`)
          {
            attrs.push(`"ide-nodes": "${compDom.serialize.nodes(nodes)}"`);
          }
        }

        // root node comp class
        if (isRootNode)
        {
          var compClass = `${compDom.get.comp.name.idName(comp)}`;
          var regex = /^"class": "[^\:]/g;
          var index = attrs.findIndex(a => regex.test(a));
          if (index != -1)
          {
            attrs[index] = attrs[index].replace(`"class": "`, `"class": "${compClass} `);
          }
          else
          {
            attrs.push(`"class": "${compClass}"`);
          }
        }

        // todo: drop components into components' rendered HTML
        //attrs.push(`"v-ide-drop": "[['comp'], $root.onDrop]"`);
        s.push(`%${tag}{${attrs.join(`, `)}}`);
        break;
      default:
      throw `Not implemented: ${node.type}`;
    }
    s = s.map(l => `${"".padStart(indent * 2)}${l}`);

    if ((false) && (node.tag == "slot"))
    {
      // wrap with IDE element that you can drop components into
      // the dragged item is dropped into the slot component's rendered HTML,
      // but the target node is this node's parent
      var attrs = {
        class: "ide-node-slot",
        //"v-ide-drop": `[['comp'], function(e, rnode) { $root.debug(rnode); return; $root.$emit('ide-node-drop-slot', rnode, e); }]`
      }
      attrs = Object.entries(attrs).map(e => { return { name: e[0], value: e[1] } });
      var wrap = { tag: "div", path: node.path, attrs: attrs };
      s.unshift(this.nodeToHaml(comp, wrap, (indent - 1), cbNode));
      s = s.map(l => `${"".padStart(1 * 2)}${l}`);
      indent++;
    }

    var nodeComp = compDom.get.node.comp(node);
    var nodeCompHasSlotsTag = null;
    if (compDom.get.all.nodes()
      .filter(n => (n.comp()._id == nodeComp?._id))
      .some(n => (n.tag == `slots`)))
    {
      nodeCompHasSlotsTag = true;
    }

    indent += 1;
    node.children?.forEach((child, i) => {
      var wrap = null;
      if (compDom.is.comp.node(node))
      {
        if (!(node.children[0]?.node?.tag == `template`))
        {
          // components that are placed inside other components are automatically
          // wrapped with a vue "template" tag with "slot-{n}" slot names
          var attrs = [];
          wrap = { tag: "template" };
          var slotName = child.node.slotName;
          // if we're using a component that has "slots",
          // auto number the "template" slot names
          if (nodeCompHasSlotsTag) slotName = `slot-${i}`;
          // take #slotname from comp node, if exists
          // these are all shortcuts to what you would normally put in a vue <template> tag
          if (slotNameAttr = node.children[i]?.node?.attrs?.find(a => (a.name?.startsWith(`#`))))
          {
            slotName = slotNameAttr.name.substr(1);
          }
          if (slotName) attrs.push({name:`v-slot:${slotName}`, value:``});
          wrap.attrs = attrs;
          //var boundProps = node.attrs.filter(attr => (attr.bind) || (attr.name.startsWith(":")));
          //attrs.push({ name: "slot-scope", value: `{ ${boundProps.map(p => p.value).join(", ")} }` });
          //if (boundProps.length) debugger;
        }
      }
      if (wrap)
      {
        s.push(...this.nodeToHaml(comp, wrap, indent, cbNode).split(`\n`));
        indent++;
      }
      s.push(...this.nodeToHaml(comp, child.node, indent, cbNode).split(`\n`));
      if (wrap) indent--;
    });

    s = s.join("\n");

    s = s.replace(/ >/g, `>`);

    return s;
  },
  getPathTree: function(node, indent = 0) {
    if (!node) debugger;
    var s = [];
    s.push(`%${JSON.stringify(node.path)}`);
    s = s.map(l => `${"".padStart(indent * 2)}${l}`);
    indent += 1;
    node.children.forEach(child => { s.push(this.getPathTree(child.node, indent)); });
    return s.join("\n");
  },
  hamlToNodes: async function(haml) {
    return (await this.htmlToNodes(util.haml(haml, false)));
  },
  htmlToNodes: async function(html) {
    if (!html) return {};
    var dom = $(html);
    if (dom.length != 1) dom = $(`<div>${html}</div>`);
    return (await this.toNode(dom[0], []));
  },
  toNode: async function(dom, path = [], childIndex = 0) {
    var node = {};
    node.id = (await compDom.get.new.id());
    node.enabled = true;
    node.expanded = true;
    node.path = [...path];
    node.path.push(childIndex)
    if (dom.data)
    {
      node.type = "text";
      node.text = dom.data.trim();
      if (!node.text) return null;
      node.attrs = [];
    }
    else
    {
      node.type = "tag";
      node.tag = dom.tagName.toLowerCase();
      node.attrs = [...dom.attributes].map(a => this.toNodeAttr(a));
    }
    var childNodeIndex = 0;
    node.children = [];
    for (c of [...dom.childNodes])
    {
      var childNode = (await this.toNode(c, node.path, childNodeIndex));
      if (!childNode) continue;
      if (node.type != "text") childNodeIndex++;
      node.children.push({ node: childNode });
    }
    return node;
  },
  toNodeAttr: function(attr) {
    var node = {
      name: attr.name,
      value: attr.value,
      enabled: true
    };
    return node;
  },
  getNode: function(node, path) {
    if (!node.path) debugger;
    if (node.path.equals(path)) return node;
    for (var i = 0; i < node.children.length; i++)
    {
      var node2 = viewDom.getNode(node.children[i].node, path);
      if (node2) return node2;
    }
    return null;
  },
  getNodeParent: function(node, path) {
    if (!path) throw `Path is ${path}`;
    if (node.children.find(n => n.node.path?.equals(path))) return node;
    for (c of node.children)
    {
      var parent = viewDom.getNodeParent(c.node, path);
      if (parent) return parent;
    }
    return null;
  },
  getNodeParentByRef: function(root, node) {
    return viewDom.filterTree(root, n => (n.children.find(c => (c.node.id == node.id))))[0];
  },
  getNewNode: async function(comp, parentNode, type, tag, text = "text", nodeCompID) {
    var newNode = { id: (await compDom.get.new.id()), type: type, enabled: true };
    if (type == "tag") newNode.tag = (tag || this.getNewChildTag(parentNode.tag));
    if (type == "text") newNode.text = text;
    newNode.nodeComp = null;
    if (nodeCompID) newNode.nodeComp = { _id: nodeCompID };
    newNode.attrs = [];
    newNode.children = [];

    newNode.attrs.push(...compDom.to.attrs({ "class": "" }));

    if (compDom.is.comp.node(newNode))
    {
      if (comp._id == nodeCompID)
      {
        newNode.attrs.push(...compDom.to.attrs({ "v-if": "false" }));
        var msg = alertify.message(`Node created with (v-if: false) to prevent a recursion overflow. Edit it to create a valid stop condition.`);
        msg.delay(0);
      }
    }
    newNode = util.with(newNode, 'comp', comp);
    return { node: newNode };
  },
  getNewChildTag: function(parentTag) {
    var tags = {
      "ul": "li",
      "ol": "li",
      "table": "tbody",
      "tbody": "tr",
      "tr": "td"
    };
    var entries = Object.entries(tags);
    return (tags[parentTag] || "div");
    return "div";
  },
  createNode: async function(comp, node, path, type, tag, text, nodeCompID) {
    var started = Date.now();
    var parentNode = this.getNode(node, path);
    if (parentNode.tag == "slot") return null;
    if (!tag) tag = viewDom.getNewChildTag(parentNode.tag);
    var newNode = (await this.createNode2(comp, node, path, type, tag, text, nodeCompID).node);
    await compDom.ensure.node.attrs(newNode);
    viewDom.fixPaths(node);
    return newNode;
  },
  createNode2: async function(comp, node, path, type = "tag", tag = "div", text = "(text)", nodeCompID)
  {
    if (node.path.equals(path))
    {
      var newNode = (await this.getNewNode(comp, node, type, tag, text, nodeCompID));
      newNode.node.path = [...node.path, 0];
      node.children.unshift(newNode);
      node.expanded = true;
      return newNode;
    }
    var child = node.children.find(n => (n.node.path.equals(path)));
    if (child)
    {
      var newNode = (await this.getNewNode(comp, child.node, type, tag, text, nodeCompID));
      newNode.node.path = [...child.node.path, 0];
      child.node.children.unshift(newNode);
      child.node.expanded = true;
      return newNode;
    }
    for (var i = 0; i < node.children.length; i++)
    {
      var child = node.children[i];
      var newNode = (await viewDom.createNode2(comp, child.node, path, type, tag, text, nodeCompID));
      if (newNode) return newNode;
    }
    return false;
  },
  deleteNode: async function(node, path) {
    if (path.join("") == "0") throw `Can't delete root node;`;
    var result = this.deleteNode2(node, path);
    viewDom.fixPaths(node);
    return result;
  },
  deleteNode2: function(node, path)
  {
    if (node.children.find(n => (n.node.path.equals(path))))
    {
      node.children = node.children.filter(n => (!n.node.path.equals(path)));
      return true;
    }
    for (var i = 0; i < node.children.length; i++)
    {
      var child = node.children[i];
      if (viewDom.deleteNode2(child.node, path)) return true;
    }
    return false;
  },
  createNewNode: async function(comp, root, destPath, newNode, pos)
  {
    var newNode = JSON.parse(JSON.stringify(newNode));
    newNode.id = (await compDom.get.new.id());
    var destNode = this.getNode(root, destPath);
    var destNodeParent = this.getNodeParent(root, destNode.path);
    if (pos == "after")
    {
      if (destNode.children.length) pos = null;
    }
    if (pos == "after")
    {
      var index = destNode.path[destNode.path.length - 1];
      index = (index + 1);
      destNodeParent.children.splice(index, null, { node: newNode });
    }
    else
    {
      destNode.children.unshift({ node: newNode });
    }
    this.fixPaths(root);
  },
  copyNode: async function(roots, destPath, srcPath, pos) {
    await viewDom.moveNode(roots, destPath, srcPath, pos, { copy: true });
  },
  moveNode: async function(roots, destPath, srcPath, pos, options) {
    var srcRoot = roots;
    var destRoot = roots;
    if (Array.isArray(roots)) { destRoot = roots[0]; srcRoot = roots[1]; }
    if ((destRoot == srcRoot) && destPath.equals(srcPath)) return;
    var srcNode = this.getNode(srcRoot, srcPath);
    var destNode = this.getNode(destRoot, destPath);
    var srcNodeParent = this.getNodeParent(srcRoot, srcNode.path);
    var destNodeParent = this.getNodeParent(destRoot, destNode.path);
    var newNode = JSON.parse(JSON.stringify(srcNode));
    if (options?.copy)
    {
      newNode.id = (await compDom.get.new.id());
      for (attr in newNode.attrs) attr.id = (await compDom.get.new.id());
    }
    srcNode.removeWhenDone = true;
    if (pos == "after")
    {
      if (destNode.children.length) pos = null;
    }
    if (pos == "after")
    {
      var index = destNode.path[destNode.path.length - 1];
      index = (index + 1);
      destNodeParent.children.splice(index, null, { node: newNode });
    }
    else
    {
      destNode.children.unshift({ node: newNode });
    }
    if (!options?.copy)
    {
      srcNodeParent.children = srcNodeParent.children.filter(c => (!c.node.removeWhenDone));
    }
    this.fixPaths(destRoot);
  },
  isIgnoreNodeIndex: function(node) {
    // warning: Might not work in real world complex scenarios
    // This basically test whether the HTML node is a text node,
    // in which case we ignore it in our index count,
    // or a tag node, in which case we count it, becase
    // we can match it to a compile time Vue template node.
    //return false;
    return ("data" in node);
  },
  getNodeSiblingIndex: function(root, node) {
    if (root?.id == node.id) return 0;
    var parent = (root) ? (viewDom.getNodeParentByRef(root, node)) : node.parent();
    return parent.children.findIndex(c => (c.node.id == node.id));
  },
  getNodeDescendantsCount: function(node) {
    return (node.children.length) + node.children.map(n => viewDom.getNodeDescendantsCount(n.node)).sum();
  },
  getNodeTreeIndex: function(node) {
    if (!node.parent) return 0;
    var sIndex = viewDom.getNodeSiblingIndex(null, node);
    var treeIndex = (viewDom.getNodeTreeIndex(node.parent()) + 1 + sIndex);
    if (sIndex > 0) treeIndex += node.parent().children.slice(0, (sIndex)).map(n => viewDom.getNodeDescendantsCount(n.node)).sum();
    return treeIndex;
  },
  getNodePath: function(root, node, path) {
    if (!path) path = [];
    path.unshift(viewDom.getNodeSiblingIndex(root, node));
    var parent = viewDom.getNodeParentByRef(root, node);
    if (!parent) return path;
    return viewDom.getNodePath(root, parent, path);
  },
  getNodePathByElement: function(el, path) {
    return JSON.parse($(el).attr("ide-node-path") || null);
  },

  fixPaths: function(rootNode) {
    this.traverse(rootNode, node => {
      node.path = viewDom.getNodePath(rootNode, node);
    });
    this.fixParents(rootNode);
    this.fixTreeIndexes(rootNode);
  },

  fixParents: function(node) {
    for (child of node.children)
    {
      child.node.parent = () => node;
      viewDom.fixParents(child.node);
    }
  },

  fixTreeIndexes: function(rootNode) {
    this.traverse(rootNode, node => {
      node.treeIndex = viewDom.getNodeTreeIndex(node);
    });
  },

  ui: {
    getAttrNames: function(node, enabledIcon) {
      return node.attrs
        .filter(a => (a.name != "class") && (a.name != "style"))
        .map(a => {
          var cm = (!enabledIcon) ? "" : (a.enabled ? "✔️" : `✔`)
          var s = `${cm}🧳 ${a.name}`;
          return s;
        }).join(", ");
    },
    getAttrCssClass: function(attr) {
      var c = {};
      if (!attr.enabled)
      {
        c["opacity-50"] = true;
        c["grayscale-10"] = true;
      }
      return c;
    }
  }
};




var myExports = viewDom;

if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = myExports;
  }
}
