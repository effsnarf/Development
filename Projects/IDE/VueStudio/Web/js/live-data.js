

var liveData = {
  dbp: null,
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
    items: async (conditionOrItems) => {
      let condition = conditionOrItems;
      if (Array.isArray(condition)) {
        let ids = condition;
        if (typeof(ids[0]) != "number") ids = ids.map(a => a._id);
        condition = (item) => ids.includes(item.value._id);
      }
      const items = liveData.watchedItems.filter(condition);
      for (item of items) item.dataWatcher.stop();
      liveData.watchedItems.removeBy(condition);
    },
    item: async (entity, _id) => {
      var item = liveData.watchedItems.find(a => a.isItem(entity, _id));
      if (!item) throw `Watched item ${entity}.${_id} not found.`;
      item.dataWatcher.stop();
      // Remove the item from the watched items array
      var index = liveData.watchedItems.indexOf(item);
      liveData.watchedItems.splice(index, 1);
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


const waitUntil = async (condition, interval = 100) => {
  while (!condition()) await new Promise(resolve => setTimeout(resolve, interval));
}


(async() => {
  await waitUntil(() => (window.DatabaseProxy));
})();


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
  this.checkInterval = 100;

  this.dataComparer = new DefaultDataComparer();
  this.data = this.dataComparer.clone(getData());

  this.pause = () => {
    this.isPaused = true;
  };
  this.resume = () => {
    var newData = (getData());
    if (!this.dataComparer.areEqual(this.data, newData)) console.log(`ignoring changes:`, DeepDiff.diff(this.data, newData));
    newData = this.dataComparer.clone(newData);
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
    var newData = (getData());
    if (!this.dataComparer.areEqual(this.data, newData))
    {
      const oldData = this.dataComparer.clone(this.data);
      newData = this.dataComparer.clone(newData);
      onChange(newData, oldData);
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
    // Track the exact changes that were made to the data
    {
      var diff1 = DeepDiff.diff(oldValue, newValue);
      var diff2 = DeepDiff.diff(newValue, oldValue);
      if (diff1)
      {
        var path = diff1[0]?.path?.join(".");
        var icon = compDom.get.icon(path.split(".")[0]);
        path = `${icon} ${path}`;
        const changeInfo = `${diff1[0]?.path.last()} = ${JSON.stringify(diff1[0]?.rhs)?.shorten(50)}`;
        //alertify.warning(changeInfo);
        if (options.track?.state)
        {
          //window.stateTracker.track(this.value, path, diff1, diff2, {isDiff: true});
        }
      }
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

// For lists, only load is supported, save is not supported.
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

    // Remove functions
    util.traverse(item, (o,k) => {
      if (typeof(o[k]) == `function`) delete o[k];
    });
    
    // Update local database

    // Save to remote database
    await dbp.entity(entity).update(item._id, item);

    //alertify.message(`${entity} (${item._id}) saved`);
  }
}



