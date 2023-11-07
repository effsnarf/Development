

String.prototype.shorten = function(length) {
  var str = this;
  if (str.length > length) return `${str.substring(0, length)}…`;
  return str;
}

String.prototype.toIcon = function() {
  return compDom.get.icon(this);
}

String.prototype.hasUppercaseLetters = function() {
  var str = this;
  for (var i=0; i<str.length; i++){
    if (str.charAt(i) == str.charAt(i).toUpperCase() && str.charAt(i).match(/[a-z]/i)){
      return true;
    }
  }
  return false;
}





var compDom = {
  uniqueClientID: 1,
  newID: () => (compDom.uniqueClientID++),
  components: {
    add: (...comps) => {
      compDom.components.value.push(...comps);
      compDom.cache.nodes.refresh();
      compDom.cache.attrs.refresh();
    },
    removeBy: (condition) => {
      compDom.components.value.removeBy(condition);
    },
    value: []
  },
  cache: {
    nodes: {
      all: [],
      byUser: [],
      add: (node) => {
        compDom.cache.nodes.all.push(node);
        compDom.cache.nodes.byUser.push(node);
      },
      delete: (node) => {
        compDom.cache.nodes.all.removeByField("id", node.id);
        compDom.cache.nodes.byUser.removeByField("id", node.id);
      },
      refresh: async () => {
        compDom.cache.nodes.all = await compDom.get.all.nodes(null, false, false);
        compDom.cache.nodes.byUser = await compDom.get.all.nodes(null, true, false);
      }
    },
    attrs: {
      all: [],
      byUser: [],
      add: (attr) => {
        compDom.cache.attrs.all.push(attr);
        compDom.cache.attrs.byUser.push(attr);
      },
      delete: (attr) => {
        compDom.cache.attrs.all.removeByField("id", attr._id);
        compDom.cache.attrs.byUser.removeByField("id", attr._id);
      },
      refresh: async () => {
        compDom.cache.attrs.all = await compDom.get.all.attrs(null, false, false);
        compDom.cache.attrs.byUser = await compDom.get.all.attrs(null, true, false);
      }
    }
  },
  actions: {
    undo: async () => {
      var change = (await liveData.dbp.undo());
      compDom.actions.applyDbChangeToLocal(change);
    },
    redo: async () => {
      var change = (await liveData.dbp.redo());
      compDom.actions.applyDbChangeToLocal(change);
    },
    applyDbChangeToLocal: async (change) => {
      if (!change) return;
      if (change.type == "updated")
      {
        if (change.entity != "ComponentClasses") throw `Not implemented`;
        var comp = compDom.get.comp.list().find(c => (c._id == change.item._id));
        if (!comp) throw `Updated component not found.`;
        liveData.pause();
        // local objects contain arrow function properties used to
        // hold references to parent objects, like node.comp() returns
        // the node's component, to allow easy access but prevent saving
        // back to database (these are recalculated when needed on client);
        // when reapplying an undo or redo from the database to local memory,
        // we're careful not to delete these incredibly useful local arrow function
        // properties.
        var changes = DeepDiff.diff(comp, change.item).filter(a => (typeof(a.lhs) != "function"));
        changes.forEach(c => DeepDiff.applyChange(comp, comp, changes[0]));
        await viewDom.fixPaths(comp.view.node);
        liveData.resume();
        //
        ideVueApp.$emit("ide-comp-changed-2", comp);
      }
      if (change.type == "created")
      {
        if (change.entity != "ComponentClasses") throw `Not implemented`;
        var comps = compDom.components.value;
        var index = comps.findIndex(c => (c._id == change.item._id));
        if (index != -1) comps.splice(index, 1);
        var liveComp = (await liveData.get.item(change.entity, change.item._id, liveDataOptions.comp));
        compDom.components.value.push(liveComp.value);
        ideVueApp.onCompChanged(comp);
      }
      if (change.type == "deleted")
      {
        if (change.entity != "ComponentClasses") throw `Not implemented`;
        var comps = compDom.components.value;
        var index = comps.findIndex(c => (c._id == change.item._id));
        if (index == -1) return;
        var comp = comps[index];
        comps.splice(index, 1);
        vueUserComponentCompiler.unregisterFromVue(comp.name.kebabize());
      }
    }
  },
  add: {
    comp: () => {

    }
  },
  check: {
    existing: {
      item: (comp, name) => {
        if (comp.methods.find(m => (m.name == name))) throw `There is already a "${name}" method on ${comp.name}.`;
        if (comp.props.find(p => (p.props.enabled) && (p.name == name))) throw `There is already a "${name}" prop on ${comp.name}.`;
        if (comp.props.find(p => (!p.props.enabled) && (p.name == name))) throw `There is already a "${name}" data property on ${comp.name}.`;
      }
    }
  },
  can: {
    edit: {
      comp: (comp) => {
        var user = compDom.get.user();
        if (user._id == comp.user._id) return true;
        return false;
      }
    },
    vmodel: (node) => {
      var nodeComp = compDom.get.node.comp(node);
      if (!nodeComp) return false;
      if (nodeComp.props.find(p => (p.props.enabled) && (p.name == `value`))) return true;
      return false;
    }
  },
  to: {
    attrs: (obj) => {
      var attrs = [];
      Object.entries(obj).forEach(e => {
        attrs.push({ name: e[0], value: e[1], enabled: true });
      });
      return attrs;
    },
    item: (item) => {
      var type = compDom.get.type(item);
      var obj = {};
      obj[type] = item;
      return obj;
    },
    typedValue: (value) => {
      if (compDom.is.primitive(value)) return { typedValue: { type: typeof(value), value: value } };
      if (Array.isArray(value)) return { typedValue: { type: `array`, value: value } };
      if (value instanceof jQuery) return { typedValue: { type: `jquery`, get: () => value } };
      return { typedValue: { type: `unknown`, get: () => value } };
    }
  },
  are: {
    items: {
      equal: (item1, item2) => {
        var e1 = Object.entries(item1)[0];
        var e2 = Object.entries(item2)[0];
        if (e1[0] != e2[0]) return false;
        if ((e1[1]._id) && (e1[1]._id != e2[1]._id)) return false;
        if ((e1[1].id) && (e1[1].id != e2[1].id)) return false;
        return true;
      }
    }
  },
  fix: {
    comp: async (comp) => {
      if (!comp) return;

      var started = Date.now();

      if (comp.data) delete comp.data;
      
      await compDom.fix.methods(comp);
      await compDom.fix.options(comp);
      await compDom.fix.errors(comp);
      for (let prop of comp.props) await compDom.fix.prop(prop);
      await compDom.fix.styles(comp);
      var nodes = await compDom.get.all.nodes(comp);
      //console.log(`${nodes.length} nodes`);
      for (node of nodes) { await compDom.fix.node(node, comp); };

      var elapsed = (Date.now() - started);
      //console.log(`(${(elapsed / 1000).toFixed(2)}s)`, `Fixed ${comp.name}`);
    },
    options: (comp) => {
      comp.options = (comp.options || {});
    },
    errors: (comp) => {
      delete comp.errors;
      comp.view.errors = (comp.view.errors || []);
      comp.methods.forEach(method => { method.errors = (method.errors || []) });
    },
    methods: async (comp) => {
      for (method of comp.methods)
      {
        //delete method.comp;
        if (!method.id) method.id = (await compDom.get.new.id());
        method.options = (method.options || {});
        method.options.rateLimit = (method.options.rateLimit || { enabled: false, delay: 400 });
        method.options.cache = (method.options.cache || {});
      }
    },
    node: async (node, comp) => {
      //console.log(`Fixing node ${node.id}`);
      if (!node.id)
      {
        node.id = (await compDom.get.new.id());
      }

      node.comp = () => comp;

      for (attr of node.attrs)
      {
        //delete attr.node;
        if (!attr.id || (attr.id.toString().length == Date.now().toString().length)) attr.id = (await compDom.get.new.id());
        if (!(`bind` in attr)) attr.bind = false;
      }

      if (!node.children) node.children = [];

      //await compDom.ensure.node.attrs(node);

      var removeDuplicates = (isBind) => {
        var attrNames = node.attrs
        .filter(a => (a.bind == isBind))
        .map(a => a.name)
        .distinct();

        //if ((node.attrs.length > 100) && (node.comp().name == `IDE.Input.String`)) debugger;

        if (false)
        {
          for (attrName of attrNames)
          {
            while ((node.attrs.filter(a => (a.bind == isBind) && (a.name == attrName))).length > 1)
            {
              node.attrs.splice(node.attrs.findIndex(a => (a.bind == isBind) && (a.name == attrName) && (!a.value)), 1);
            }
          }
        }
      }

      removeDuplicates(true);
      removeDuplicates(false);
    },
    prop: async(prop) => {
      delete prop.comp;
      if (!prop.id) prop.id = (await compDom.get.new.id());
      if (prop.type == `UI.Icon`) prop.type = `IDE.UI.Icon`;
      if (prop.type)
      {
        // var propTypeComp = ideVueApp.getIdeComp(prop.type);
        // if (propTypeComp) prop.type = { comp: { _id: propTypeComp._id } };
      }
      if (prop.watch.handler && !prop.watch.method)
      {
        prop.watch.method = {
          args: "value, oldValue",
          body: prop.watch.handler,
        }
        delete prop.watch.handler;
      }
      prop.errors = (prop.errors || []);
      if (!("routeParam" in prop)) prop.routeParam = {enabled: false};
      if (!("example" in prop)) prop.example = { enabled: false, value: null };
      var keys = ["id", "type", "name", "default", "example", "props", "watch", "computed", "persisted"];
      keys.forEach(k => compDom.fix.reapply(prop, k));
      if (prop.rateLimit) prop.rateLimit.type = "RateLimit";
    },
    reapply: (obj, key) => {
      var value = obj[key];
      delete obj[key];
      obj[key] = value;
    },
    styles: async (comp) => {
      comp.styles = (comp.styles || []);
      if (!comp.styles.length) comp.styles.push({ name: "default", rules: [] });

      for (style of comp.styles)
      {
        if (!style.id) style.id = (await compDom.get.new.id());
        if (!style.rules)
        {
          const rules = css.parse(style.css||"").stylesheet.rules.filter(r => (r.type == `rule`));
          style.rules = rules.map(r => { return { selectors: r.selectors, declarations: r.declarations.filter(d => (d.type=='declaration')).map(d => { return { property: d.property, value: d.value, enabled: true } } ) } });
        }
      }
    },
  },
  item: {
    to: {
      itemPath: (item) => {
        var entry = Object.entries(item)[0][1];
        var itemPath = [entry.comp()._id, entry.id];
        return itemPath;
      },
    }
  },
  itemPath: {
    to: {
      item: (itemPath) => {
        if (nonNumber = itemPath.find(a => (typeof(a) != `number`))) {
          if (nonNumber?.ceid) {} else throw `itemPath should be ids, not names.`;
        }
        var comp = compDom.get.comp.byID(itemPath[0]);
        var method = comp.methods.find(m => (m.id == itemPath[1]));
        if (method)
        {
          method = util.with(method, `comp`, comp);
          if (itemPath.length == 2) return { method: method };

          if (itemPath[2])
          {
            var exp = method.code.elements[itemPath[2].ceid];
            exp = util.with(exp, `method`, method);
            return { exp: exp };
          }
        }
        var prop = comp.props.find(p => (p.id == itemPath[1]));
        if (prop)
        {
          prop = util.with(prop, `comp`, comp);
          return { prop: prop };
        }
      }
    },
  },
  is: {
    primitive: (obj) => {
      if (typeof(obj) == `string`) return true;
      if (typeof(obj) == `number`) return true;
      if (!obj) return true;
      return false;
    },
    number: (n) => {
      return (typeof(n) == "number") && (!isNaN(n - n));
    },
    empty: (value) => {
      if (value == null) return true;
      if (typeof(value) == "undefined") return true;
      if (value == "") return true;
      return false;
    },
    ide: {
      comp: (comp) => {
        if (comp.user._id != 1) return false;
        if (!comp.name.startsWith(`IDE.`)) return false;
        return true;
      }
    },
    comp: {
      // whether the node is another component (not html tag)
      node: (node) => {
        if (node.nodeComp?._id) return true;
      }
    },
    node: {
      ancestor: {
        disabled: (node) => {
          if (!node.parent) return null;
          if (!node.parent().enabled) return true;
          return compDom.is.node.ancestor.disabled(node.parent());
        }
      },
      // if the node is marked as enabled
      // and is not a descendant of a disabled ancestor
      enabled: (node) => {
        if (!node.enabled) return false;
        if (compDom.is.node.ancestor.disabled(node)) return false;
        return true;
      }
    },
    image: {
      url: (s) => {
        if (!s) return false;
        if (typeof(s) != `string`) return false;
        if (![`https`, `http`].some(a => s.startsWith(`${a}://`))) return false;
        if ([`jpeg`, `jpg`, `png`, `gif`, `webp`].some(a => s.endsWith(`.${a}`))) return true;
        return false;
      }
    },
    flow: {
      node: (node) => {
        if (compDom.is.comp.node(node)) return true;
        return false;
      }
    },
    item: {
      enabled: (item) => {
        if ((item.node) && (!item.node.enabled)) return false;
        if ((item.attr) && (!item.attr.enabled)) return false;
        return true;
      }
    }
  },
  serialize: {
    node: (node) => {
      return `${node.comp()._id}|${node.path.join(".")}`;
    },
    nodes: (nodes) => {
      return nodes.map(n => compDom.serialize.node(n)).join(",");
    }
  },
  deserialize: {
    node: (s) => {
      if (!s) return null;
      s = s.split("|");
      var compID = parseInt(s[0]);
      var nodePath = s[1].split(".").map(a => parseInt(a));
      return compDom.get.node.with(compID, nodePath);
    },
    nodes: (s) => {
      if (!s) return [];
      return s.split(",").map(compDom.deserialize.node);
    }
  },
  set: {
    attr: {
      value: async (node, attrName, value) => {
        var attr = node.attrs.find(a => (a.name == attrName));
        if (!attr)
        {
          attr = (await viewDom.createAttr(node, attrName, value));
        }
        if (!value)
        {
          compDom.delete.attr(attr);
          return;
        }
        attr.value = value;
      }
    }
  },
  get: {
    user: (user) => {
      return ideVueApp.$refs.ideUserAccount1?.user;
    },
    item: (compID, itemID) => {
      var comp = compDom.get.comp.byID(compID);
      if (!comp) throw `Component ${compID} not found.`;
      var method = comp.methods.find(m => (m.id == itemID));
      if (method) return { method: util.with(method, `comp`, comp) };
      var prop = comp.props.find(p => (p.id == itemID));
      if (prop) return { prop: util.with(prop, `comp`, comp) };
      var nodes = viewDom.filterTree(comp.view.node, n => (n.id == itemID));
      if (nodes.length) return { node: util.with(nodes[0], `comp`, comp) };
      throw `Item ${itemID} not found in component ${comp.name}.`;
    },
    arg: {
      names: (argsStr) => {
        if (!argsStr) argsStr = ``;
        return argsStr
          .split(`,`)
          .filter(a => a.trim())
          .map(a => a.getWords()[0]);
      }
    },
    drag: {
      item: (prop, objPath, value) => {
        if (!prop) return null;

        var objPathStr = (!objPath) ? `` : objPath.map(a => `['${a}']`).join();
        var fieldPath = `${util.toSingular(prop.name)}${objPathStr}`;

        var type = { tag: `div`, attrName: `v-text` };
        if (compDom.is.image.url(value)) type = { tag: `img`, attrName: `src` };
        if (typeof(value) == `number`) type = { tag: `ui-number`, attrName: `value` };

        var dragItem = {
          command: 'node.create',
          args: {
            node: {
              type: 'tag',
              tag: type.tag,
              attrs: [{
                name: type.attrName,
                value: fieldPath,
                bind: true,
                enabled: true
              }],
              children: [],
              enabled: true
            }
          }
        };

        return dragItem;
      }
    },
    flow: {
      tree: (item, depth = 0) => {
        var flowItem = {
          item: item,
          expanded: true,
          children: compDom.get.flow.children(item, depth)
        };
        return flowItem;
      },
      children: (item, depth = 0) => {
        return [];
        if (depth >= 3) return [];
        if (item.comp) return compDom.get.flow.children({ node: item.comp.view.node });
        var items = [];
        var type = Object.entries(item)[0][0];
        var getItems = compDom.get[type]?.flow?.items;
        if (!getItems) { console.warn(`Flow items not implemented for ${type}`); return []; };
        items.push(...getItems(item[type]));
        if (item?.prop?.name == `generators`) debugger;
        items = items.map(item => compDom.get.flow.tree(item, (depth + 1)));
        return items;
      }
    },
    code: {
      related: {
        items: async (comp, code) => {
          if ((!comp) || (!code)) return [];
          if (typeof(code) != `string`) return [];

          var items = [];

          var getItems = (words) => {
            var items = [];
            var methods = comp.methods.filter(m => words.includes(m.name));
            methods = methods.map(m => util.with(m, 'comp', comp));
            items.push(...methods.map(compDom.to.item));
            var props = comp.props.filter(p => words.includes(p.name));
            props = props.map(p => util.with(p, 'comp', comp));
            items.push(...props.map(compDom.to.item));
            return items;
          }

          var thisWords = code.matchAllRegexes(/this\.(\w+)/g).map(m => m[1]).distinct();

          items.push(...getItems(thisWords));

          if (!items.length) items.push(...getItems(code.getWords()));

          return items;
        }
      }
    },
    related: {
      items: async (item) => {
        if (!item) return ([]);
        var type = Object.keys(item)[0];
        var items = (await compDom.get[type].related.items(item[type]));
        return items;
      },
      nodes: (comp, word) => {
        if (!comp) return [];
        if (!word) return [];
        var nodes = viewDom.mapTree(comp.view.node, (n => n));
        nodes = nodes.map(n => compDom.search.nodeAttrs(n, word));
        nodes = nodes.filter(n => n.score);
        return nodes.map(n => util.with(n.node, "comp", comp));
      }
    },
    compiler: {
      warnings: () => {
        var warnings = [];

        return [
          { id: compDom.newID(), item: null, text: `Compiler warnings are disabled at the moment.` },
        ];

        var allProps = compDom.get.all.props();
        for (prop of allProps.filter(p => (p.props.enabled && p.computed.enabled)))
        {
          var warning = { id: compDom.newID(), item: { prop: prop }, text: `Property can't be both props and computed.` };
          warnings.push(warning);
        }

        var allNodes = compDom.get.all.nodes();
        for (node of allNodes.filter(compDom.is.node.enabled))
        {
          // v-for keys
          if (node.attrs.some(a => (a.name == "v-for")))
          {
            var keyAttr = (node.attrs.find(a => ["key", ":key"].includes(a.name) && (a.value)))
            if (!keyAttr)
            {
              var warning = { id: compDom.newID(), item: { node: node }, text: `v-for node doesn't have a key. Animations and other features may not work.` };
              warnings.push(warning);
            }
            else if (!keyAttr.enabled)
            {
              var warning = { id: compDom.newID(), item: { node: node }, text: `v-for node has a key but it's disabled.` };
              warnings.push(warning);
            }
          }

          // kebab-case for attr names
          var attrs = node.attrs.filter(a => (a.name||"").hasUppercaseLetters());
          for (attr of attrs)
          {
            var warning = { id: compDom.newID(), item: { attr: attr }, text: "Attribute names should be kebab case." };
            warnings.push(warning);
          }

          var nodeComp = compDom.get.node.comp(node);
          if (nodeComp)
          {
            for (attr of node.attrs.filter(a => (a.enabled) && (a.value)))
            {
              if (!attr.name) continue;
              if (attr.name.toLowerCase() == "key") continue;
              if (attr.name.toLowerCase().startsWith("v-")) continue;
              if (attr.name.startsWith("@")) continue;
              if (["ref", "class", "style"].includes(attr.name)) continue;
              var prop = (nodeComp.props.find(p => ((p.name||"").kebabize() == attr.name)));
              if (!prop)
              {
                //var warning = { id: compDom.newID(), items: [ node.comp(), attr ], text: `📦 ${node.comp().name} ➟ 📦 ${nodeComp.name} 🧊 ${attr.name} (missing).` };
                var warning = { id: compDom.newID(), items: [ { comp: node.comp() }, { attr: attr } ], text: `(linking to non existing property).` };
                warnings.push(warning);
              }
              if (prop)
              {
                if (!prop.props.enabled)
                {
                  var warning = { id: compDom.newID(), items: [ { node: node }, { prop: prop } ], text: `Not marked as props.` };
                  warnings.push(warning);
                }
              }
            }
          }
        }

        return warnings;
      }
    },
    all: {
      comps: (comp, filterByUser = false) => {
        if (comp) return [comp];
        var comps = compDom.get.comp.list();
        if (filterByUser)
        {
          var user = compDom.get.user();
          if ((user) && (user?._id != 1))
          {
            comps = comps.filter(c => (c.user._id == user._id));
          }
        }
        return comps;
      },
      methods: (comp, filterByUser = false) => {
        return compDom.get.all.comps(comp, filterByUser).flatMap(comp => comp.methods.map(m => util.with(m, "comp", comp)));
      },
      props: (comp, filterByUser = false) => {
        return compDom.get.all.comps(comp, filterByUser).flatMap(comp => comp.props.map(p => util.with(p, "comp", comp)));
      },
      nodes: async (comp, filterByUser = false, cached = true) => {
        if (false && cached && !comp)
        {
          return compDom.cache.nodes[(filterByUser ? "byUser" : "all")];
        }
        const comps = compDom.get.all.comps(comp, filterByUser);
        const nodes = (await comps.flatMap(comp => viewDom.mapTree(comp.view.node, node => util.with(node, "comp", comp))));
        return nodes;
      },
      attrs: async (comp, filterByUser = false, cached = true) => {
        if (false && cached && !comp)
        {
          return compDom.cache.attrs[(filterByUser ? "byUser" : "all")];
        }
        const allNodes = (await compDom.get.all.nodes(comp, filterByUser));
        const allAttrs = (await allNodes.flatMapAsync(node => node.attrs.map(attr => util.with(attr, "node", node)), 10));
        return allAttrs;
      }
    },
    new: {
      id: async () => {
        return await (liveData.get.new.id());
      },
      prop: async (name, isProps = false) => {
        return {
          "id": (await compDom.get.new.id()),
          "type" : null,
          "name" : name,
          "default" : {
              "enabled" : false,
              "value" : null
          },
          "routeParam": {
            "enabled": false
          },
          "example": {
            "enabled": false,
            "value": null
          },
          "props": {
            "enabled": isProps
          },
          "rateLimit": {
            "enabled": false,
            "type": "RateLimit",
            "value": null
          },
          "watch" : {
              "enabled" : false,
              "method": { args: `new${name.titleize()}, old${name.titleize()}`, body: "" },
              "deep" : false,
              "immediate": false,
          },
          "computed" : {
              "enabled" : false,
              get: { type: "method", body: "" },
              set: { type: "method", args: `new${name.titleize()}`, body: "" }
          },
          "persisted" : {
              "enabled" : false,
              load : { type: "method", body: "" },
              save: { type: "method", args: `new${name.titleize()}`, body: "" }
          }
        };
      },
      method: async (name) => {
        return {
          "id": (await compDom.get.new.id()),
          "args" : null,
          "name" : name,
          "body" : null,
          "code": {
            debugInBrowser: false
          }
        };
      }
    },
    bound: {
      prop: {
        names: (node) => {
          var comp = node.comp();
          var words = node.attrs
            .map(attr => attr.value)
            .flatMap(value => (value||"").getWords());
          var props = comp.props.filter(prop => words.includes(prop.name));
          return props.map(p => p.name);
        }
      }
    },
    type: (obj) => {
      if (typeof(obj) != "object") return typeof(obj);
      if (Array.isArray(obj)) return compDom.get.type(obj[0]);
      if (typeof(obj) == "function") return "func";
      if (obj.item) return compDom.get.type(obj.item);
      if ("default" in obj) return "prop";
      if (["args", "body"].every(p => (p in obj)) && ((obj.args == null) || (typeof(obj.args) == "string"))) return "method";
      if (["view", "props", "methods"].every(p => (p in obj))) return "comp";
      if (["type", "path", "children"].every(p => (p in obj))) return "node";
      if (["vue", "node", "comp"].every(p => (p in obj))) return "rnode";
      if (["name", "value", "enabled"].every(p => (p in obj))) return "attr";
      if (obj.type) return obj.type;
      // recognized but non draggable item types
      if (["groupID", "items"].every(p => (p in obj))) return null; // action group
      if (["undo", "redo"].every(p => (p in obj))) return null; // action
      debugger; throw `Unrecognized object type`;
    },
    icon: (name, tag) => {
      var icons = {
        comp: "📦",
        tag: "📁",
        view: "📁",
        node: "📁",
        compNode: "📦",
        prop: "🧊",
        method: "🔴",
        attr: "🔗",
        text: "🗚",
        "v-model": "🧊",
        "v-text": "🗚",
        "v-html": "< />",
        "v-for": "☰",
        "v-if": "❔",
        "v-show": "❔",
        "@": "⚡",
        "?": "❔"
      };
      if (!name) return null;
      if (name?.startsWith("@")) return icons["@"];
      //if (tag && (compDom.get.comp.b(tag))) return icons.comp;
      return (icons[name] || icons[`${name}s`] || null);
    },
    title: (obj) => {
      switch (compDom.get.type(obj)) {
        case "node": return (obj.tag || obj.text);
      }
      return obj.name;
    },
    suggestions: (comp, code, type) => {
      if (!comp) return [];
      if (!code) return [];

      var getSuggs = (words) => {
        var suggs = [];
        words = words.filter(w => (w != 'in') && (w != 'of'));
        words = words.filter(w =>
          (!comp.methods.find(m => (m.name == w))) &&
          (!comp.props.find(p => (p.name == w))));
        suggs.push(...words.map(w => { return { text: `➕ 🔴 ${w}()`, action: () => compDom.create.method(comp, w) } }));
        suggs.push(...words.map(w => { return { text: `➕ 🧊 ${w}`, action: () => compDom.create.prop(comp, w) } }));
        return suggs;
      }

      var suggs = [];

      var words =
        (type == "statements") ?
        code.matchAllRegexes(/this\.(\w+)/g).map(m => m[1]).distinct() :
        (type == "expression") ?
        code.getWords() :
        [];
      suggs.push(...getSuggs(words));

      return suggs;
    },
    attr: {
      type: (attr) => {
        if (!attr) return null;
        if (!attr.name) return null;
        if (attr.name.startsWith("@")) return "event";
        if (attr.name == "class") return "class";
        if (attr.name == "style") return "style";
        var prop = compDom.get.attr.prop(attr);
        if (prop)
        {
          if (prop.type) return prop.type;
        }
        return null;
      },
      // get the other component's property that this attribute refers to
      // (in case of comp node)
      prop: (attr) => {
        if (!attr.node) return null;
        var node = attr.node();
        if (node.type != "tag") return null;
        var comp = compDom.get.node.comp(node);
        if (!comp) return null;
        var prop = comp.props.find(p => ((p.props.enabled) && (p.name == attr.name)));
        return prop;
      },
      value: (node, attrName) => {
        return node.attrs.find(a => (a.name == attrName))?.value;
      },
      related: {
        items: async (attr) => {
          return (await compDom.get.code.related.items(attr.node().comp(), attr?.value));
        }
      },
      suggestions: (attr) => {
        if (!attr) return [];
        return compDom.get.suggestions(attr.node().comp(), attr.value, "expression");
      }
    },
    node: {
      flow: {
        items: (node) => {
          var items = [];
          var nodes = viewDom.filterTree(node,
            n => {
              if (n == node) return false;
              if (compDom.is.flow.node(n)) return true;
              return false;
            },
            (n => {
              if (n == node) return node.children;
              if (compDom.is.flow.node(n)) return [];
              return n.children;
            }));
          // don't include self node to prevent loop
          //nodes = nodes.filter(n => (n != item.node));
          items.push(...nodes.map(compDom.to.item));

          // props that are referenced from this node's attributes
          var props = compDom.get.node.relevant.props(node);
          items.push(...props.map(compDom.to.item));

          return items;
        }
      },
      words: (node) => {
        try
        {
          return node.attrs
            .flatMap(attr => (attr.value||``).getWords())
            .distinct();
        }
        catch (ex)
        {
          alertify.error(`(debugger): ${ex.string()}`);
          debugger;
          return [];
        }
      },
      name: (node) => {
        if (node.nodeComp)
        {
          var name = compDom.get.comp.byID(node.nodeComp._id)?.name;
          if (!name) return `[⚠️ comp ${node.nodeComp._id} ]`;
          return name.kebabize();
        }
        return `${(node.tag || `"${node.text}"`)}`;
      },
      title: (node, includeIcons = true) => {
        var title = compDom.get.node.name(node);
        if (!includeIcons) return text;
        var typeIcon = compDom.get.node.typeIcon(node);
        var icons = (compDom.get.node.icons(node).join(''));

        return `${typeIcon} ${title} ${icons}`; //📁
      },
      title2: (node) => {
        var shortLength = 10;
        var icons = (compDom.get.node.icons(node).join(''));
        var title2 = "";
        var classes = node.attrs.find(a => (a.name == "class"))?.value;
        if (!classes) classes = ``;
        if (classes.trim().startsWith(`{`)) { try { classes = util.string.getJsonKeys(classes).join(`, `); } catch { } };
        if (classes) title2 = `[🦠${classes.shorten(shortLength)}]`;
        [`v-model`, `v-text`, `name`, `v-slot:`].forEach(s => {
          let attr = node.attrs.find(a => (a.name?.startsWith(s)));
          var text = (attr?.value || attr?.name);
          if (text) text = text.split(`:`).reverse()[0];
          if (text) title2 = `⦗${text.shorten(shortLength)}⦘`;
        });
        var eventAttrs = node.attrs.filter(a => (a.name?.startsWith("@")));
        var event = ((eventAttrs.length != 1) ? null : eventAttrs[0]?.value);
        if (event) title2 = `⦗🔴${event}⦘`;
        var vfor = node.attrs.find(a => (a.name == "v-for"))?.value;
        if (vfor) title2 = `⦗${(vfor.split(" in ")[1] || "").shorten(shortLength)}⦘`;
        var vif = node.attrs.find(a => (a.name == "v-if"))?.value;
        if (vif) title2 = `⦗${vif.shorten(shortLength)}⦘`;
        var vshow = node.attrs.find(a => (a.name == "v-show"))?.value;
        if (vshow) title2 = `⦗${vshow.shorten(shortLength)}⦘`;

        return `${icons} ${title2}`;
      },
      short: {
        title: (node) => {
          var title = compDom.get.node.name(node);
          var typeIcon = compDom.get.node.typeIcon(node);
          //var icons = (compDom.get.node.icons(node).join(''));

          var vtext = node.attrs.find(a => (a.name == "v-text"))?.value;
          if (vtext) title = "";

          if (title == "ide-input-boolean") title = "✗✓";
          if (title.startsWith("ide-input-")) title = `[✏️${title.substring("ide-input-".length)}]`;

          return `${typeIcon} ${title}`; // 📁
        },
      },
      icons: (node) => {
        var attrIcons = node.attrs?.map(a => compDom.get.icon(a?.name));
        attrIcons = util.distinctItems(attrIcons);
        attrIcons = attrIcons.filter(a => a);
        return attrIcons;
      },
      typeIcon: (node) => {
        if (compDom.is.comp.node(node)) return compDom.get.icon("compNode");
        return node.type.toIcon();
      },
      field: {
        type: (path) => {
          var comp = compDom.get.comp.item(path[0]);
          if (compDom.get.prop.item(comp, path[1])) return "prop";
          if (compDom.get.method.item(comp, path[1])) return "method";
          return "unknown";
        },
        types: (path) => {
          var type = path[path.length - 1];
          switch (type) {
            case "default":
              return { enabled: "boolean", value: "value" };
            case "props":
              return { enabled: "boolean" };
            case "watch":
              return { enabled: "boolean", delay: "boolean", handler: "function(newValue, oldValue)", deep: "boolean" };
            case "computed":
              return { enabled: "boolean", getter: "function", setter: "function(newValue)" };
            case "persisted":
              return { enabled: "boolean", load: "function", save: "function" };
          }
          return {};
        },
        item: (path) => {
          var comp = compDom.get.comp.item(path[0]);
          var item =
            (compDom.get.prop.item(comp, path[1])) ??
            (compDom.get.method.item(comp, path[1])) ??
            null;
          return item;
        }
      },
      type: (path) => {
        path = [...path];
        var fieldType = compDom.get.node.field.type(path);
        path[0] = "comp";
        path[1] = fieldType;
        path.splice(1, 0, "dom");
        return path.join("-");
      },
      comp: (node) => {
        if (!node.nodeComp?._id) return null;
        return compDom.get.comp.byID(node.nodeComp._id);
      },
      item: (path) => {
        var item = compDom.get.node.field.item(path);
        item = item[path[2]];
        return item;
      },
      node: (path) => {
        var key = path.slice(2);
        var node = {
          type: compDom.get.node.type(path),
          icon: compDom.get.node.field.type(path),
          obj: compDom.get.node.field.item(path),
          key: key
          //comp: compDom.get.comp.item(path[0]),
        };
        node.value = util.getProperty(node.obj, node.key.join("."));
        node.fieldTypes = compDom.get.node.field.types(path);
        return node;
      },
      with: (compID, nodePath, vue) => {
        if (typeof(compID) != `number`) throw `get.node.with() has changed signature from (compName...) to (compID...).`;
        var comp = compDom.get.comp.byID(compID);
        if (!comp) throw `get.node.with() could not find comp with ID ${compID}.`;
        var node = viewDom.getNode(comp.view.node, nodePath);
        node = util.with(node, 'comp', comp);
        if (vue)
        {
          node = util.with(node, 'vueUID', vue._uid);
          node = util.with(node, 'vueData', vue.$data);
        }
        node.relevantProps = () => compDom.get.node.relevant.props(node);
        return node;
      },
      relevant: {
        props: (node) => {
          // warning
          if (!node.comp) return [];

          var words = node.attrs
            .map(attr => (attr.value||'').toString().getWords())
            .flatMap(a => a);

        var props = node.comp().props.filter(p => (words.includes(p.name)));

        return props.map(p => util.with(p, `comp`, node.comp()));
        }
      },
      cache: {
        key: (comp, node) => {
          return `${comp._id}.${node.id}`;
        }
      }
    },
    comp: {
      list: () => {
        return compDom.components.value;
      },
      byID: (_id) => {
        if (!_id) return null;
        return compDom.get.comp.list().find(c => (c._id == _id));
      },
      item: (compName) => {
        var msg = `compDom.get.comp.item(compName) is deprecated. use ideVueApp.getIdeComp instead.`;
        alertify.error(msg);
        throw msg;
      },
      event: {
        emits: async (comp) => {
          if (typeof(comp) == "string") comp = compDom.get.comp.item(comp);
          var strs = comp.methods.map(m => m.body);
          strs.push(...(await compDom.get.all.attrs(comp)).map(a => a.value));
          return strs.flatMap(compDom.get.event.emits)
            .map(s => (s||"").trim())
            .filter(s => s)
            .distinct();
        }
      },
      related: {
        items: async (comp) => {
          if (!comp) return [];
          var items = [];
          // contained in
          var nodes = await compDom.get.all.nodes();
          nodes = nodes.filter(n => (n.type == "tag"));
          nodes = nodes.filter(n => (n.nodeComp?._id == comp._id));
          items.push(...nodes.map(compDom.to.item));
          // contains
          var nodes = await compDom.get.all.nodes(comp);
          nodes = nodes.filter(compDom.is.comp.node);
          items.push(...nodes.map(compDom.get.node.comp).map(compDom.to.item));
          return items;
        }
      },
      name: {
        idName: (comp) => {
          if (!comp) return null;
          return `${comp.name.toLowerCase().kebabize()}-${comp._id}`;
        },
        vueName: (comp) => {
          return compDom.get.comp.name.idName(comp);
        }
      },
      options: {
        value: (comp, key, defaultValue) => {
          if (typeof(defaultValue) == `undefined`)
          {
            var defaults = {
              "show.example": true
            }
            if (defaults[key])
            return compDom.get.comp.options.value(comp, key, defaults[key]);
            else return compDom.get.comp.options.value(comp, key, null);
          }
          var keys = [`options`, ...key.split(`.`)];
          var node = comp;
          while (keys.length)
          {
            if (!(keys[0] in node)) return defaultValue;
            node = node[keys.shift()];
          }
          return util.getProperty(comp.options, key);
        }
      }
    },
    prop: {
      flow: {
        items: (prop) => {
          var items = [];
          var comp = prop.comp();

          if (prop.name == `generators`) debugger;

          // computed props
          var props = comp.props
            .filter(p => p.computed.enabled)
            .filter(p => (p.computed.get.body||``).includes(`this.${prop.name}`));
          props = props.map(p => util.with(p, 'comp', comp));
          items.push(...props.map(compDom.to.item));

          // nodes
          var nodes = viewDom.filterTree(comp.view.node, (node => {
            return false;
            if (node.attrs.find(attr => ((attr.value||``).getWords().includes(prop.name)))) return true;
            return false;
          }));
          nodes = nodes.map(n => util.with(n, 'comp', comp));
          items.push(...nodes.map(compDom.to.item));
          return items;
        }
      },
      item: (comp, propName) => {
        return comp.props.find(p => (p.name == propName));
      },
      defaultValue: (prop) => {
        if (prop.default.enabled) return JSON.parse(prop.default.value);
        return null;
      },
      field: {
        icon: (fieldName) => {
          switch (fieldName)
          {
            case "default": return "";
            case "example": return "✨";
            case "props": return "🡆";
            case "rateLimit": return "⌛";
            case "watch": return "🔴👀";
            case "computed": return "🔴💡";
            case "persisted": return "🔴💾";
            case "routeParam": return "🔗";
          }
          return null;
        }
      },
      related: {
        items: async (prop) => {
          items = [];
          // nodes that refer to this prop
          var nodes = (compDom.get.related.nodes(prop?.comp(), prop?.name));
          items.push(...nodes.map(compDom.to.item));
          // attributes that refer to this prop from all comp
          var attrs = await compDom.get.all.attrs();
          attrs = attrs.filter(a => (!compDom.is.empty(a.value)));
          attrs = attrs.filter(a => (a.node().tag == prop.comp().name.kebabize()));
          attrs = attrs.filter(a => ((a.name||"").getWords().includes(prop.name)));
          items.push(...attrs.map(compDom.to.item));
          // methods from this comp that mention this prop's name in their body
          var methods = compDom.get.all.methods(prop.comp()).filter(m => (m.body||``).getWords().includes(prop.name));
          items.push(...methods.map(compDom.to.item));
          // nodes from this comp
          //
          return items;
        }
      }
    },
    method: {
      path: (comp, method) => {
        return [`${comp.name}`, `${method.name}`];
      },
      item: (comp, methodName) => {
        return comp.methods.find(m => (m.name == methodName));
      },
      related: {
        nodes: (method) => {
          if (!method?.comp)
          {
            console.warn(`method.comp is missing.`);
            return [];
          }
          return compDom.get.related.nodes(method?.comp(), method?.name);
        },
        items: async (method) => {
          var items = [];
          // nodes from this comp
          var nodes = compDom.get.method.related.nodes(method);
          items.push(...nodes.map(compDom.to.item));
          // methods from this comp that mention this method's name in their body
          var methods = method.comp().methods.filter(m => (m.body||``).getWords().includes(method.name));
          items.push(...methods.map(compDom.to.item));
          // methods from this comp that are mentioned in this method's body
          var words = (method.body||"").getWords().filter(w => w).map(w => w.toLowerCase());
          var methods = method.comp().methods
            .filter(m => m.name)
            .filter(m => m.body)
            .filter(m => words.includes(method.name.toLowerCase()));
          items.push(...methods.map(compDom.to.item));
          // props from this comp that call this method from their computed / watched / persisted
          var props = method.comp().props
            .filter(p => {
              var propCodes = [p.watch.method?.body, p.computed.get?.body, p.computed.set?.body].filter(s => s);
              var propCodeWords = propCodes.flatMap(s => s.getWords());
              propCodeWords.includes(method.name);
            });
          items.push(...props.map(compDom.to.item));
          // props from this comp that are mentioned in this method's body
          var words = (method.body||"").getWords().filter(w => w).map(w => w.toLowerCase());
          var props = method.comp().props
            .filter(p => words.includes(p.name.toLowerCase()));
          items.push(...props.map(compDom.to.item));
          //
          return items;
        }
      }
    },
    value: {
      viewer: (node, attr) => {
        return compDom.get.value.uiComponent("viewer", node, attr);
      },
      defaultComponent: (node, attr) => {
        return compDom.get.value.uiComponent("", node, attr);
      },
      editor: (node, attr) => {
        return compDom.get.value.uiComponent("editor", node, attr);
      },
      uiComponent: (uiType, node, attr) => {
        var comp = compDom.get.node.comp(node);
        if (comp)
        {
          var prop = comp.props.find(p => (p.name == attr.name?.unkebabize()));
          if (prop)
          {
            // the attribute is a prop(s) of another component,
            // if might have a custom editor
            if (prop?.ui?.editor) return prop.ui.editor;
            var compNamePath = [`ide`, prop.type, uiType].filter(a=>a);
            var uiCompName = compNamePath.join(".").kebabize();
            if (compDom.get.comp.item(uiCompName)) return uiCompName;
          }
        }
        var uiCompName = `ide.${(attr.name)}.${uiType}`.kebabize();
        if (compDom.get.comp.item(uiCompName)) return uiCompName;
      },
      uiComponentBy: (type, uiType) => {
        var compNamePath = [`ide`, type, uiType].filter(a=>a);
        var uiCompName = compNamePath.join(".").kebabize();
        if (compDom.get.comp.item(uiCompName)) return uiCompName;
      },
    },
    event: {
      emits: (code) => {
        if (!code) return [];
        if (typeof(code) != `string`) return [];
        var regex = /(this\.|^|[^.a-z])\$emit\(["'`](.+)["'`]/g;
        return code.getRegexMatches(regex, 2);
      }
    },
    itemTypeByName: (comp, name) => {
      if (!name) return null;
      if (typeof(name) != "string") return null;
      var words = name.getWords();
      for (t of ["prop", "method"])
        if (comp[`${t}s`]
          .find(a => (words.includes(a.name)))) return t;
      return null;
    },
    nodes: (el, addParent = 2, filter) => {
      if (!el) return [];
      var nodes = [];
      var attrs = el.attributes;

      var componentHostID = ideVueApp.comps.ide.find(c => (c.name == `IDE.Component.Host`))._id;

      if (!attrs["ide-nodes"]?.value) return [];

      var nodes = compDom.deserialize.nodes(attrs["ide-nodes"].value);

      // ignore IDE.Component.Host
      nodes = nodes.filter(n => (n.comp()._id != componentHostID));

      // don't show ide component nodes in the nodes context window
      //nodes = nodes.filter(node => (!ideVueApp.comps.ide.find(c => (c._id == node.comp()._id))));

      //if (compName.toLowerCase().startsWith("ide-")) return [];

      var vues = vueDom.get.vues.fromEl(el);

      nodes.forEach(n => {
        var vue = vues.find(v => (n.comp().name.kebabize() == v.$options.name));
        if (vue)
        {
          n.vueUID = () => vue._uid;
          n.vueData = () => vue.$data;
        }
      });

      [...nodes].forEach(node => {
        // add node [text] children which are not detected from hovering over html elements
        var children = node.children.map(n => n.node).filter(n => (n.type == `text`));
        nodes.push(...children);
      });

      if (addParent)
      {
        // TODO: find out why comp is missing from some nodes and fix it
        var compIDs = nodes
          .filter(n => n.comp)
          .map(n => (n.comp()._id));
        // add child html element nodes
        // add parent html element nodes
        nodes.unshift(...compDom.get.nodes(el.parentElement, (addParent - 1)));
        // add parent component nodes
        var parentElement = el.parentElement;
        do
        {
          var parentNodes = compDom.get.nodes(parentElement, 0);
          parentElement = parentElement.parentElement;
        }
        while ((parentNodes.length) && (parentNodes[0]?.comp()._id == nodes[0].comp()._id));
        var nodeIDs = nodes.map(n => n.id);
        nodes.unshift(...parentNodes.filter(n => !nodeIDs.includes(n.comp()._id)));
      }

      nodes = nodes
        .map(n => n.id)
        .distinct()
        .map(id => nodes.find(n2 => (n2.id == id)));

      return nodes;
    },
    cssClasses: (comp, node) => {
      var matchCssClassNames = (s) => {
        if (!s) return [];
        return (s.getRegexMatches(/[\w\d-]+/g) || []);
      }
      var getClassNames = (node) => {
        var c = [];
        var attrs = node.attrs.filter(attr => (attr.name == "class") || (attr.name == ":class"));
        c.push(attrs.flatMap(a => matchCssClassNames(a.value)));
        return c.flatMap(a => a).filter(a => a);
      };
      var hasClass = (node, className) => {
        return getClassNames(node).includes(className);
      };
      var getNodes = (className) => {
        return viewDom.filterTree(node, (n => hasClass(n, className)));
      };
      var cnms = viewDom.mapTree(node, getClassNames).flatMap(a => a);
      cnms = util.distinctItems(cnms);
      cnms.sort();
      var cns = cnms.map(cnm => { return { className: cnm, nodes: getNodes(cnm) } });
      return cns;
    },
    vue: {
      info: {
        data: (vue) => {
          if (!vue) return {};
          var data = {...vue.$data, ...vue.$props};
          Object.keys(data)
            .filter(k => k.startsWith(`_`))
            .forEach(key => { delete data[key]; });
          return data;
        }
      }
    }
  },
  search: {
    get: {
      score: (item, regex, ...inputs) => {
        var result = item;

        var getScore = (regex, ...inputs) => {
          if (!regex) return false;
          if (typeof(regex) == `string`) regex = (new RegExp(regex));

          var scores = inputs.map(input => {
            if (!input) input = ``;
            if (!regex.test(input)) return 0;
            var score = Math.abs(input.length - regex.toString().length);
            if (score == 0) score = 1;
            return score;
          });
          scores = scores.filter(s => (s != 0));
          if (!scores.length) return false;
          return Math.min(...scores);
        }

        result.score = getScore(regex, ...inputs);

        return result;
      }
    },
    all: async (query, comp, onlyEnabled = false, wholeWord = false) => {
      var promise = new Promise(async (resolve) => {
        var escapeRegExp = (s) => {
          return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
        }
        if (!query)
        {
          resolve([]);
          return;
        }
        if (Array.isArray(query))
        {
          var allResults = [];
          for (q of query)
          {
            var results = (await compDom.search.all(q, comp, onlyEnabled));
            allResults.push(...results);
          }
          resolve(allResults);
          return;
        }
        var regex;
        if (wholeWord)
        {
          regex = (new RegExp(`\b${escapeRegExp(query)}\b`, `i`));
        }
        else
        {
          regex = (new RegExp(escapeRegExp(query), `i`));
        }

        var allComps = compDom.get.all.comps(comp, true);
        var allMethods = compDom.get.all.methods(comp, true);
        var allProps = compDom.get.all.props(comp, true);
        var allNodes = await compDom.get.all.nodes(comp, true);
        var allAttrs = await compDom.get.all.attrs(comp, true);
        var results = [];
        var comps = allComps.map(c => compDom.search.comp(c, regex));
        var methods = allMethods.map(m => compDom.search.method(m, regex));
        var props = allProps.map(p => compDom.search.prop(p, regex));
        var nodes = allNodes.map(n => compDom.search.node(n, regex));
        var attrs = allAttrs.map(a => compDom.search.attr(a, regex));
        results.push(...comps);
        results.push(...methods)
        results.push(...props);
        results.push(...nodes);
        results.push(...attrs);
        results = results.filter(r => (r.score));
        results = results.sortBy(r => r.score);
        results.forEach(result => { result.id = compDom.newID(); });
        if (onlyEnabled) results = results.filter(compDom.is.item.enabled);
        resolve(results);
        return;
      });
      return promise;
    },
    comp: (comp, regex) => {
      return compDom.search.get.score({ comp: comp }, regex, comp.name, comp.name.kebabize());
    },
    method: (method, regex) => {
      return compDom.search.get.score({ method: method }, regex, method.name, method.body);
    },
    prop: (prop, regex) => {
      return compDom.search.get.score({ prop: prop }, regex,
        prop.default?.value?.toString(),
        prop.watch.method?.body,
        prop.computed.get?.body,
        prop.computed.set?.body,
        prop.persisted.load?.body,
        prop.persisted.save?.body
        );
    },
    node: (node, regex) => {
      var getScore = () => {
        if (node.nodeComp) return false;
        switch (node.type)
        {
          case `tag`:
            if (score = compDom.search.get.score({node: node}, regex, node.tag).score) return score;
          case `text`:
            if (score = compDom.search.get.score({node: node}, regex, node.text).score) return score;
        }
        return false;
      }
      return { node: node, score: getScore() };
    },
    nodeAttrs: (node, regex) => {
      var getScore = () => {
        var attrScores = node.attrs.map(attr => compDom.search.attr(attr, regex));
        attrScores = attrScores.filter(a => a.score);
        if (attrScores.length) return Math.min(...attrScores.map(a => a.score));
        return false;
      }
      return { node: node, score: getScore() };
    },
    attr: (attr, regex) => {
      return compDom.search.get.score({ attr: attr }, regex, attr.name, attr.value);
    }
  },
  create: {
    comp: async (fromComp) => {

      var comp = await liveData.dbp.api.componentClasses.user.create();
      comp.last = (comp.last || {});
      comp.last.selected = Date.now();

      return comp;

      if (fromComp)
      {
        var obj = Object.assign({}, fromComp);
        delete obj._id;
        Object.assign(comp, obj);
        obj.name = `${fromComp.name}.Copy`;
      }

      return comp;
    },
    method: async (comp, name) => {
      compDom.check.existing.item(comp, name);
      comp.methods.push(await compDom.get.new.method(name));
    },
    prop: async (comp, name, isProps) => {
      compDom.check.existing.item(comp, name);
      comp.props.push(await compDom.get.new.prop(name, isProps));
    },
    func: async () => {
      var func = {
        name: `func`,
        desc: `calculates stuff`,
        args: [``],
        body: `return null;`,
        examples: []
      };
      await compDom.create.funcExample(func);
      var ld = (await liveData.create.item("Functions", func));
      return ld.value;
    },
    funcExample: async(func) => {
      var example = { args: {} };
      func.examples.push(example);
    }
  },
  delete: {
    item: async (item) => {
      var entry = Object.entries(item)[0];
      await compDom.delete[entry[0]](item[entry[0]]);
    },
    comp: async (comp) => {
      await liveData.dbp.api.componentClasses.user.delete(comp._id);
      ideVueApp.onCompDeleted(comp);
    },
    method: (method) => {
      var comp = method.comp();
      comp.methods = comp.methods.filter(m => (m.name != method.name));
    },
    prop: (prop) => {
      var comp = prop.comp();
      comp.props = comp.props.filter(p => (p.name != prop.name));
    },
    node: (node) => {
      viewDom.deleteNode(node.comp().view.node, node.path);
    },
    attr: (attr) => {
      viewDom.deleteAttr(attr);
    }
  },
  ensure: {
    ids: async (arr) => {
      var items = arr.filter(a => (!compDom.is.number(a.id)));
      for (var i = 0; i < items.length; i++)
      {
        items[i].id = (await compDom.get.new.id());
      }
    },
    node: {
      attrs: async (node) => {
        if (!node) return;
        if (!node.attrs.find(a => (a.name == `class`))) await viewDom.createAttr(node, `class`);

        await compDom.ensure.compNode.compAttrs(node);

        for (attr of node.attrs) if (!attr.id) attr.id = (await compDom.get.new.id());
        node.attrs = node.attrs.sortBy(compDom.sort.attr);
      }
    },
    compNode: {
      compAttrs: async (node) => {
        if (!node) return;
        // remove empty attributes
        var isEmptyAttr = (a) => (!a.name && !a.value);
        while (node.attrs.find(isEmptyAttr)) node.attrs.splice(node.attrs.findIndex(isEmptyAttr), 1);
        var compNodeComp = compDom.get.node.comp(node);
        if (!compNodeComp) return;
        for (prop of compNodeComp.props.filter(p => (p.props.enabled)))
        {
          if (!node.attrs.some(at => (at.name == prop.name.kebabize())))
          {
            viewDom.createAttr(node, prop.name.kebabize(), null, false)
          }
        }
        var eventNames = await compDom.get.comp.event.emits(compNodeComp);
        for (eventName of eventNames)
        {
          if (!node.attrs.some(at => (at.name == `@${eventName}`)))
          {
            viewDom.createAttr(node, `@${eventName}`, null, false);
          }
        }
        if (node.attrs.find(n => (n.name == `value`)) && node.attrs.find(n => (n.name == `@input`)))
        {
          if (!node.attrs.find(n => (n.name == `v-model`)))
          {
            viewDom.createAttr(node, `v-model`, null, false);
          }
        }
      }
    }
  },
  sort: {
    attr: (attr) => {
      if (attr.name == `class`) return `_1_class`;
      if (attr.name == `style`) return `_2_style`;
      return attr.name.getWords()[0];
    }
  },
  stringify: {
    css: {
      rules: (rules) => {
        if (!rules?.length) return null;
        return rules.map(r => `${r.selectors.join(', ')}\n{\n${r.declarations.map(d => `  ${d.property}: ${d.value};`).join('\n')}\n}`).join('\n\n');
      }
    }
  },
  resolve: (obj) => {
    if (!obj) return obj;
    obj = JSON.parse(JSON.stringify(obj));
    if (obj.comp?.name) obj.comp.item = compDom.get.comp.item(obj.comp.name);
    if (obj.method?.name) obj.method.item = compDom.get.method.item(obj.comp.item, obj.method.name);
    if (obj.prop?.name) obj.prop.item = compDom.get.prop.item(obj.comp.item, obj.prop.name);
    return obj;
  },
  wrap: (obj, contextArr) => {
    var context = {};
    for (var i = 0; i < (contextArr.length / 2); i++) context[contextArr[i * 2]] = contextArr[i * 2 + 1];
    return {
      item: obj,
      context: context
    };
  },
  unwrap: (obj) => {
    if (typeof(obj) != "object")
    {
      return { type: typeof(obj), icon: null, title: null, item: obj };
    }
    if (Array.isArray(obj))
    {
      var unwrapped = compDom.unwrap(obj[0]);
      unwrapped.value = obj[1];
      return unwrapped;
    }
    if (obj.method)
    {
      var unw = compDom.unwrap(obj.method);
      Object.assign(unw.extra = {}, obj);
      delete unw.extra.method;
      return unw;
    }
    if (obj.item)
    {
      var unw = compDom.unwrap(obj.item);
      unw.context = obj.context;
      return unw;
    }
    var type = compDom.get.type(obj);
    var icon = compDom.get.icon(type, obj.tag);
    var title = compDom.get.title(obj);
    return { type: type, icon: icon, title: title, item: obj };
  },
}


var bindToFunctions = (obj, path, func, rootObj) => {
  if (!rootObj) rootObj = obj;
  if (!Array.isArray(path)) path = [path];
  Object.entries(obj).forEach(e => {
      var path2 = [...path, e[0]];
      var key = path2.join(`.`);
      if (typeof(e[1]) == `object`) bindToFunctions(e[1], path2, func, rootObj);
      if (typeof(e[1]) != `function`) return;

      let minLogDuration = 50;

      if (e[1].constructor.name == `AsyncFunction`)
      {
        var timeouts = {
          ".get.related.items": 2000
        };
        if (!timeouts[key])
        {
          obj[e[0]] = (async function (...args) {
            let started = Date.now();
            try
            {
              var result = (await e[1](...args));
            }
            finally
            {
              let stopped = Date.now();
              let elapsed = (stopped - started);
              if (elapsed > minLogDuration) console.warn(elapsed, key);
            }
            return (result);

        }).bind(rootObj);
        }
        else
        {
          obj[e[0]] = (async function (...args) {
            let promise = new Promise(async (resolve) => {
              var timeout = (Math.random() * timeouts[key]);
              setTimeout(async () => {
                let started = Date.now();
                try
                {
                  var result = (await e[1](...args));
                  resolve(result);
                }
                finally
                {
                  let stopped = Date.now();
                  let elapsed = (stopped - started);
                  if (elapsed > minLogDuration) console.warn(elapsed, key);
                }
              }, timeout);
              });
              return promise;
        }).bind(rootObj);
        }
      }
      else
      {
          obj[e[0]] = (function (...args) {
            let started = Date.now();
            try
            {
              var result = (e[1](...args));
              return result;
            }
            finally
            {
              let stopped = Date.now();
              let elapsed = (stopped - started);
              if (elapsed > minLogDuration) console.warn(elapsed, key);
            }
          }).bind(rootObj);
      }
  });
}



//bindToFunctions(compDom);

//ide.performance.bindToFunctions(compDom, [`compDom`]);




var myExports = compDom;

if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = myExports;
  }
}
