let LocalStoragePersisted = function(key, getTrackedValue) {
  this.load = () => (JSON.parse(localStorage.getItem(key)) || getTrackedValue());
  this.save = () => localStorage.setItem(key, JSON.stringify(this.value));

  this.value = this.load();

  let check;
  let checkInterval = 400;
  check = () => {
    let newValue = getTrackedValue();
    if (JSON.stringify(newValue) != JSON.stringify(this.value))
    {
      this.value = newValue;
      this.save();
    }

    setTimeout(check, checkInterval);
  };

  setTimeout(check, checkInterval);
}


let Events = function() {
    this.handlers = {};

    this.on = function(eventName, handler) {
        this.handlers[eventName] = (this.handlers[eventName] || []);
        this.handlers[eventName].push(handler);
    }

    this.emit = function(eventName, ...args) {
        this.handlers[eventName] = (this.handlers[eventName] || []);
        for (handler of this.handlers[eventName]) handler(...args);
    }
}


let GraphDatabase = function () {
  this.nextItemID = 1;
  this.items = [];
  this.deletedItems = [];
  this.updateUndos = [];
  this.previewFields = {};
  this.hasChangedTimer = null;

  let persistedNextItemID = (new LocalStoragePersisted(`Graph.nextItemID`, () => this.nextItemID));
  let persistedItems = (new LocalStoragePersisted(`Graph.items`, () => this.items));
  let persistedDeletedItems = (new LocalStoragePersisted(`Graph.deletedItems`, () => this.deletedItems));
  let persistedUpdateUndos = (new LocalStoragePersisted(`Graph.updateUndos`, () => this.updateUndos));
  
  this.nextItemID = persistedNextItemID.value;
  this.items = persistedItems.value;
  this.deletedItems = persistedDeletedItems.value;
  this.updateUndos = persistedUpdateUndos.value;

  this.events = new Events();

  this.hasChanged = function() {
    clearTimeout(this.hasChangedTimer);

    this.hasChangedTimer = setTimeout(() => {
        this.events.emit(`change`);
    }, 100);
  }

  this.clear = function () {
    this.items = [];
    this.nextItemID = 1;

    this.hasChanged();
  };

  this.setItems = function(items) {
    this.items = util.clone(items);
    this.hasChanged();
  };

  this.get = function (_id, original = false) {
    if (!_id) return null;

    let item = this.items.find((it) => it._id == _id);

    if (!original) item = this.addPreviewFields(item);

    return item;
  };

  this.getPreviewFields = function(_id) {
    let fields = (this.previewFields[_id] || (this.previewFields[_id] = {}))
    return fields;
  };

  this.setPreviewFields = function (_id, key, value) {
    if (typeof(key) == `object`)
    {
      Object.entries(key)
        .forEach(e => this.setPreviewFields(_id, e[0], e[1]));
      return;
    }

    let fields = this.getPreviewFields(_id);
    if (key)
    {
      if (value) fields[key] = value; else delete fields[key];
    }
    else
    {
      if (value != null)
      {
        for (e of Object.entries(value)) fields[e[0]] = e[1];
      }
      else
      {
        for (e of Object.entries(fields)) delete fields[e[0]];
      }
    }
    this.hasChanged();
  };

  this.addPreviewFields = function(item) {
    item = util.clone(item);
    let fields = this.getPreviewFields(item._id);
    for (let field of Object.entries(fields)) util.setProperty(item, field[0], field[1]);
    return item;
  }

  this.getDetails = function (item) {
    let obj = { ...item };

    `_id, dt, from, to, rel, type`
      .split(`,`)
      .map((s) => s.trim())
      .forEach((s) => {
        delete obj[s];
      });

    return (
      Object.entries(obj)
        //.map(e => `${e[0]}: ${e[1]}`)
        .map((e) => `${e[1]}`)
        .join(`, `)
    );
  };

  this.getLinkNodes = function (rel, direction, filter, nodeDirection, fields) {
    let links = this.getLinks(rel, direction, filter);

    let nodes = links.map((link) => this.get(link[nodeDirection]));

    if (fields) {
      if (typeof fields == `string`) {
        return nodes.map((node) => node[fields]);
      } else throw `Not implemented`;
    }

    return nodes;
  };

  this.getLinks = function (rel, direction, filter) {
    if (!filter) return [];

    let links = (rel) ?
      this.items.filter((it) => (it.rel == rel)) :
      this.items.filter((it) => (it.rel));

    if (filter) {
      if (typeof filter == `number`) {
        links = links.filter((link) => link[direction] == filter);
      } else {
        links = links.filter(filter);
      }
    }

    return links;
  };

  this.getNodes = function (filter) {
    let nodes = this.items
     .filter((it) => !it.rel)
     .filter(filter)
     .map(it => this.get(it._id));

    return nodes;
  };

  this.getLatest = function (count) {
    return [...this.items].reverse().slice(0, count);
  };

  this.undeleteItems = async function (count) {
    let items = [];

    while (count--) items.push(this.deletedItems.pop());

    items.reverse();

    this.items.push(...items);

    await this.updateNextItemID();

    this.hasChanged();
  };

  this.uncreateLatest = async function (nodes = 0, links = 0) {
    let index = this.items.length - 1;
    let ids = [];

    let nodeIDs = [];

    while ((nodes || links) && (index >= 0)) {
      let item = this.items[index];

      if (nodes && item.type) {
        ids.push(item._id);
        nodeIDs.push(item._id);
        nodes--;
      } else if (links && item.rel) {
        ids.push(item._id);
        links--;
      }
      index--;
    }

    let looseLinks = this.items.filter(it => (it.rel && ((nodeIDs.includes(it.from)) || (nodeIDs.includes(it.to)))));
    ids.push(...looseLinks.map(it => it._id));

    ids = ids.distinct();

    this.items = this.items.filter((it) => !ids.includes(it._id));

    await this.updateNextItemID();

    this.hasChanged();
  };

  this.uncreateLatestNodes = async function(nodes = 0) {
    let index = (this.items.length - 1);
    let ids = [];

    let nodeIDs = [];

    while ((nodes) && (index >= 0)) {
      let item = this.items[index];

      if (nodes && item.type) {
        ids.push(item._id);
        nodeIDs.push(item._id);
        nodes--;
      }
      index--;
    }

    let looseLinks = this.items.filter(it => (it.rel && ((nodeIDs.includes(it.from)) || (nodeIDs.includes(it.to)))));
    ids.push(...looseLinks.map(it => it._id));

    ids = ids.distinct();

    this.items = this.items.filter((it) => !ids.includes(it._id));

    await this.updateNextItemID();

    this.hasChanged();
  }

  this.update = async function (_id, fields) {
    let item = await this.get(_id, true);

    this.updateUndos.push(util.clone(item));

    if ((Object.keys(fields).length == 2) && (fields.name)) fields = Object.fromEntries([[fields.name, fields.value]]);

    for (let field of Object.keys(fields))
    {
      util.setProperty(item, field, fields[field]);
    }

    this.hasChanged();
  };

  this.updateNextItemID = function () {
    this.items = this.items.sortBy((it) => it._id);

    if (this.items.length) {
      this.nextItemID = this.items[this.items.length - 1]._id + 1;
    } else {
      this.nextItemID = 1;
    }

    this.hasChanged();
  };

  this.undoLastUpdate = function () {
    let undoData = this.updateUndos.pop();

    let item = this.items.find((it) => it._id == undoData._id);

    Object.assign(item, undoData);

    this.hasChanged();
  };

  this.addLink = function (from, to, rel, props) {
    let _id = this.nextItemID++;
    let dt = Date.now();
    let link = { _id, dt, from, to, rel, ...props };

    this.items.push(link);

    this.hasChanged();

    return link;
  };

  this.addNode = function (type, props) {
    let _id = this.nextItemID++;
    let dt = Date.now();
    let node = { _id, dt, type, ...props };
    this.items.push(node);

    this.hasChanged();

    return node;
  };

  this.deleteItems = async function (ids) {
    let items = this.items.filter((it) => ids.includes(it._id));

    this.deletedItems.push(...items);

    this.items = this.items.filter((it) => !ids.includes(it._id));

    await this.updateNextItemID();

    this.hasChanged();
  };

  this.deleteLinks = async function (rel, direction, filter) {
    let links = await this.getLinks(rel, direction, filter);

    let ids = links.map((l) => l._id);

    await this.deleteItems(ids);

    this.hasChanged();

    return ids.length;
  };
};

var myExports = GraphDatabase;

if (typeof exports !== "undefined") {
  if (typeof module !== "undefined" && module.exports) {
    exports = module.exports = myExports;
  }
}

if (typeof window != `undefined`) {
  window.GraphDatabase = GraphDatabase;
}
