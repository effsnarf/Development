function StateTracker()
{
  this.pointer = -1;
  this.items = [];
  this.list1 = null;
  this.trackingEnabled = true;

  this.track = (obj, propPath, newValue, oldValue, options = {}) => {
    if (!this.trackingEnabled) return;

    var newItem = {
      dt: Date.now(),
      obj: obj,
      propPath: propPath,
      newValue: newValue,
      options: options
    };
    newItem.oldValue =
      (typeof(oldValue) != "undefined") ? oldValue :
      this.findLastUpdate(newItem)?.newValue;

    if (this.items.length)
    {
      var lastItem = this.items[this.items.length - 1];
      if (this.canMerge(lastItem, newItem))
      {
        this.merge(lastItem, newItem);
        return;
      }
    }

    this.items.length = (this.pointer + 1);
    this.items.push(newItem);

    this.pointer = (this.items.length - 1);
    if (this.list1) this.list1.highlight(this.pointer);
  }

  this.goto = (index) => {
    this.trackingEnabled = false;
    if (index < this.pointer)
    {
      while (index < this.pointer)
      {
        this.execute(item => item.oldValue, () => this.pointer--);
      }
    }
    else {
      while (this.pointer <= index)
      {
        this.execute(item => item.newValue, () => this.pointer++);
      }
      if (this.pointer > index) this.pointer = index;
    }
    setTimeout(() => {
      this.trackingEnabled = true;
    }, 100);
  }

  this.execute = (valueSelector, pointerStep) => {
    var item = this.items[this.pointer];
    this.setProperty(item, valueSelector(item));
    pointerStep();
  }

  this.setProperty = (item, value) => {
    if (!item.obj) return;
    if (item.options?.isDiff)
    {
      value.forEach(c => {
        var change = {...c};
        DeepDiff.applyChange(item.obj, null, change);
      });
      return;
    }
    if (!item.propPath) return;
    util.setProperty(item.obj, item.propPath, value);
  }

  this.findLastUpdate = (item) => {
    var items = [...this.items];
    items.reverse();
    return items.find(a => (item.obj == a.obj) && (item.propPath == a.propPath));
  }

  this.canMerge = (oldItem, newItem) => {
    if (!newItem) debugger;
    if (oldItem.obj != newItem.obj) return false;
    if (oldItem.propPath != newItem.propPath) return false;
    if (oldItem.newValue == newItem.newValue) return true;
    if ((newItem.dt - oldItem.dt) > 1000) return false;
    return true;
  }

  this.merge = (oldItem, newItem) => {
    oldItem.dt = newItem.dt;
    oldItem.newValue = newItem.newValue;
  }

  this.replaceVues = (replaces) => {
    replaces.forEach(replace => {
      this.items.forEach(item => {
        if (item.obj?._uid == replace.oldUid) item.obj = replace.newVue;
      });
    });
    var newUids = replaces.map(r => r.newVue._uid);
    this.items.forEach((item, index) => {
      if (index > this.pointer) return;
      if (newUids.includes(item.obj?._uid)) this.setProperty(item, item.newValue);
    });
  }

  this.track(null, null, null);
}
