

var liveData = {
  dbp: (new anat.dev.DatabaseProxy("db.memegenerator.net", "IDE")),
  watchedItems: [],
  pause: () => {
    for (item of liveData.watchedItems) item.dataWatcher.pause();
  },
  resume: () => {
    for (item of liveData.watchedItems) item.dataWatcher.resume();
  },
  new: {
    item: async (entity, data, options) => {
      var dbpDp = new DatabaseProxyDataPersister(liveData.dbp, entity, false, { _id: data._id }, null, data);
      var ld = new LiveData(dbpDp, options);
      return ld;
    }
  },
  get: {
    new: {
      id: async() => { return await liveData.dbp.get.new.id(); }
    },
    array: (entity, sortKey, options, itemOptions) => {
      var sort = {}; sort[sortKey] = 1;
      var dbpDp = new DatabaseProxyDataPersister(liveData.dbp, entity, true, null, sort);
      options = (options || {});
      options.track = (options.track || { state: false });
      options.on = (options.on || {});
      var onLoad = options.on.load;
      options.on.load = async (ldItems) => {
        if (onLoad) await onLoad(ldItems);

        // create live data watchers for every item in the array
        var items = ldItems.value;
        var setItem = (index) => {
          return ((ldItem) => { items[index] = ldItem.value; });
        };
        for (var i = 0; i < items.length; i++)
        {
          liveData.watchedItems.push(await liveData.new.item(entity, items[i], itemOptions));
        }
      };
      return new LiveData(dbpDp, options);
    },
    item: async (entity, _id, options) => {
      let promise = new Promise(function(resolve) {
        if (options?.on?.load)
        {
          onLoad = options.on.load;
          options.on.load = (liveData) => { onLoad(liveData); resolve(liveData); };
        }
        else
        {
          options = (options || {});
          options.on = (options?.on || {});
          options.on.load = (liveData) => { resolve(liveData); };
        }
        var dbpDp = new DatabaseProxyDataPersister(liveData.dbp, entity, false, { _id: _id });
        var ld = new LiveData(dbpDp, options);
      });
      return promise;
    }
  },
  watch: {
    item: async (entity, data, options) => {
      var item = (await liveData.new.item(entity, data, options));
      liveData.watchedItems.push(item);
    }
  },
  unwatch: {
    item: async (entity, _id) => {
      var item = liveData.watchedItems.find(a => a.isItem(entity, _id));
      if (!item) throw `Watched item ${entity}.${_id} not found.`;
      item.dataWatcher.stop();
      liveData.watchedItems.remove(item);
    }
  },
  create: {
    item: async (entity, fields) => {
      var dbEntity = liveData.dbp.entity(entity);
      var newItem = (await dbEntity.create(fields));
      return (await liveData.get.item(entity, newItem._id));
    }
  },
  delete: {
    item: async (entity, _id) => {
      var dbEntity = liveData.dbp.entity(entity);
      await dbEntity.delete(_id);
    }
  }
};

window.liveData = liveData;


function DefaultDataComparer()
{
  this.clone = (o1) => {
    if (o1 == null) return null;
    return util.clone(o1);
  }
  this.areEqual = (o1, o2) => {
    var result = (JSON.stringify(o1) == JSON.stringify(o2));
    return result;
  }
}

function DataWatcher(getData, onChange)
{
  this.isPaused = false;
  this.isStopped = false;
  this.checkInterval = 1000;

  this.dataComparer = new DefaultDataComparer();
  this.data = this.dataComparer.clone(getData());

  this.pause = () => {
    this.isPaused = true;
  };
  this.resume = () => {
    var newData = this.dataComparer.clone(getData());
    if (!this.dataComparer.areEqual(this.data, newData)) console.log(`ignoring changes:`, DeepDiff.diff(this.data, newData));
    this.data = newData;
    this.isPaused = false;
  };
  this.stop = () => {
    this.isStopped = true;
  }

  this.check = () => {
    if (this.isStopped) return;
    if (this.isPaused)
    {
      setTimeout(this.check, this.checkInterval);
      return;
    }
    var newData = this.dataComparer.clone(getData());
    if (!this.dataComparer.areEqual(this.data, newData))
    {
      onChange(newData, this.data);
      this.data = (newData);
    }
    setTimeout(this.check, this.checkInterval);
  }

  this.check();
}

function LiveData(dataPersister, options)
{
  if (!options) options = {};
  this.value = null;
  this.saveBufferDelay = 1000;
  this.saveBufferTimer = null;
  this.changeCallbackDelay = 600;
  this.changeCallbackTimer = null;
  this.dataPersister = dataPersister;
  this.is = this.dataPersister.is;
  this.isItem = this.dataPersister.isItem;
  this.onDataChanged = (newValue, oldValue) => {
    if (options.track?.state)
    {
      var diff1 = DeepDiff.diff(oldValue, newValue);
      var diff2 = DeepDiff.diff(newValue, oldValue);
      var path = diff1[0]?.path?.join(".");
      var icon = compDom.get.icon(path.split(".")[0]);
      path = `${icon} ${path}`;
      alertify.warning(`LiveData data changed.`);
      //window.stateTracker.track(this.value, path, diff1, diff2, {isDiff: true});
    }

    clearTimeout(this.changeCallbackTimer);
    this.changeCallbackTimer = setTimeout(() => {
      if (options.on?.changed) options.on?.changed(newValue);
    }, this.changeCallbackDelay);

    clearTimeout(this.saveBufferTimer);
    this.saveBufferTimer = setTimeout(() => {
      this.dataPersister.save(newValue);
    }, this.saveBufferDelay);
  }
  this.load = async() => {
    this.value = (await this.dataPersister.load());
    if (options.refresh) setTimeout(this.load, options.refresh);
  },
  this.init = async() => {
    await this.load();
    if (!Array.isArray(this.value)) this.dataWatcher = new DataWatcher(() => this.value, this.onDataChanged);
    if (options.on?.load) options.on.load(this);
  }
  this.init();
}

function LocalStorageDataPersister(key)
{
  this.load = () => {
    JSON.parse(localStorage.getItem(key) || null);
  }
  this.save = (value) => {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

function ActivityIndicator()
{
  this.active = 0;
  this.elapsed = 0;
  this.updateInterval = 1000;
  this.increase = (activityName) => {
    this[activityName] = ((this[activityName] || 0) + 1);
    this.active++;
  }
  this.decrease = (activityName) => {
    this[activityName] = ((this[activityName] || 0) - 1);
    this.active--;
  }
  this.update = () => {
    if (this.active) this.elapsed += this.updateInterval; else this.elapsed = 0;
  };
  setInterval(this.update, this.updateInterval);
}

// For lists, only loading,
// for single items, loading and saving
function DatabaseProxyDataPersister(dbp, entity, isArray, filter, sort, data)
{
  this.entity = entity;
  this.data = data;
  this.is = new ActivityIndicator();
  this.isItem = (entity, _id) => ((this.entity == entity) && (this.data._id == _id));
  this.load = async() => {
    if (data) return data;
    this.is.increase("loading");
    var result = (await dbp.entity(entity).list(filter, sort));
    if (!isArray) result = result[0];
    this.is.decrease("loading");
    return result;
  }
  this.save = async(item) => {
    if (isArray) return;
    util.traverse(item, (o,k) => {
      if (typeof(o[k]) == `function`) delete o[k];
    });
    await dbp.entity(entity).update(item._id, item);
    //alertify.message(`${entity} (${item._id}) saved`);
  }
}
