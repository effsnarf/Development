// #region 🛠 Utility
if (typeof require != "undefined") {
    var fetch = require("node-fetch");
  }
  
  String.prototype.untitleize = function () {
    return `${this[0].toLowerCase()}${this.substr(1)}`;
  };
  
  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  let _fetchItemID = 1;
  const _fetchQueue = [];

  const getNextFetchItem = (alreadyAttempted) => {
    const getItem = () => {
      if (alreadyAttempted) {
        return _fetchQueue.filter(item => (item.attempt > 0))[0];
      }
      else {
        return _fetchQueue.filter(item => (item.attempt == 0))[0];
      }
    }
    const item = getItem();
    console.log(item);
  }

  const removeFetchItem = (id) => {
    const index = _fetchQueue.findIndex(item => (item.id == id));
    if (index >= 0) _fetchQueue.splice(index, 1);
  }

  const processFetchQueue = async (alreadyAttempted) => {
    const nextTimeout = 100;
    const item = getNextFetchItem(alreadyAttempted);
    if (!item) return setTimeout(processFetchQueue, nextTimeout);

    try
    {
      item.attempt++;
      const response = await _fetch(...item.args);
      removeFetchItem(item.id);
      item.resolve(response);
    }
    catch (ex)
    {
      alertify.error(`<h3>${item.args[0]}</h3>Error fetching data:\n${ex.message}.\nprocessFetchQueue(true) to retry.`);

      item.reject(ex);
    }
    finally
    {
      setTimeout(processFetchQueue, nextTimeout);
    }
  };
    
  var _fetch = fetch;
  fetch = (...args) => {
    return new Promise((resolve, reject) => {
      _fetchQueue.push({ id: _fetchItemID++, attempt: 0, args, resolve, reject });
    });
  };

  processFetchQueue();
  // #endregion

  var anat = anat || {};
  var dev = anat.dev || (anat.dev = {});
  
  anat.dev.DatabaseProxy = function (host, database, protocol, userID) {
    this.protocol = protocol || "https";
    this.host = host;
    this.database = database.replace("_DataEvents", "");
    this.userID = userID;
    this.urlBase = `${this.protocol}://${this.host}/${this.database}`;
    this.fetchOptions = { credentials: "include" };
    this.logToConsole = false;
  
    this.on = {
      error: [],
    };
  
    // #region 🛠 Utility
    var traverse = (obj, callback, path, depth) => {
      if (!obj) return;
      if (typeof obj != "object") return;
      if (!depth) depth = 0;
      if (Array.isArray(obj)) {
        obj.forEach((a) => traverse(a, callback));
        return;
      }
      Object.keys(obj).forEach((key) => {
        var path2 = path ? `${path}.${key}` : key;
        callback(obj, key, path2);
        traverse(obj[key], callback, path2, depth + 1);
      });
    };
  
    var dateTimeReviver = (value) => {
      try {
        if (typeof value === "string") {
          var dt = new Date(value);
          if (dt.toString() == "Invalid Date") return value;
          if (dt.toISOString() == value) return dt;
        }
        return value;
      } catch {
        return value;
      }
    };
  
    var parseJSON = (str) => {
      if (!str) return null;
      var obj = JSON.parse(str);
      traverse(obj, (o, key) => (o[key] = dateTimeReviver(o[key])));
      return obj;
    };
  
    this.cache = {
      enabled: false,
      timeout: 5000,
      items: {},
    };
  
    this.fetchUrlJson = async (url, options) => {
      var now = new Date().valueOf();
  
      if (this.userID) {
        url += `${url.includes("?") ? "&" : "?"}userID=${userID}`;
      }

      if (options?.cache) {
        const fetchContent = async () => {
          var str = await (await fetch(url, this.fetchOptions)).text();
          const data = parseJSON(str);
          Local.cache.set(url, { dt: Date.now(), data: data });
          return data;
        };
        if (await Local.cache.has(url)) {
          setTimeout(fetchContent, 0);
          return (await Local.cache.get(url)).data;
        }
        else
        {
          return await fetchContent();
        }
      }
  
      if (this.cache.enabled) {
        if (this.cache.items[url]) {
          if (now - this.cache.items[url].dt < this.cache.timeout) {
            if (this.logToConsole) console.log(`returning from cache:`, url);
            return this.cache.items[url].data;
          } else {
            delete this.cache.items[url];
          }
        }
      }
  
      if (this.logToConsole) console.log(`fetching ${url}`, this.fetchOptions);
      var str = await (await fetch(url, this.fetchOptions)).text();
      try {
        var data = parseJSON(str);
  
        if (this.cache.enabled) this.cache.items[url] = { dt: now, data: data };
  
        //if (this.logToConsole) console.log(data, ` returned from `, url);
  
        return data;
      } catch (ex) {
        throw str;
      }
    };

    // #endregion
  
    var StoreQueue = function () {
      this.items = {};
  
      this.get = (key) => {};
  
      this.set = (key, value) => {};
    };
  
    this.store = {
      queue: {},
      items: {},
      worker: () => {
        Object.keys(this.store.queue).forEach((key) => {
          var value = this.store.queue[key];
          delete this.store.queue[key];
          this.store.setToServer(key, value);
        });
        setTimeout(this.store.worker, 400);
      },
      getItem: async (key) => {
        var item = this.store.items[key];
        if (!item) {
          item = this.store.items[key] = {
            key: key,
            value: await this.store.getFromServer(key),
          };
        }
        return item;
      },
      get: async (key) => {
        return (await this.store.getItem(key)).value;
      },
      set: async (key, value) => {
        var item = await this.store.getItem(key);
        item.value = value;
        this.store.queue[key] = value;
      },
      getFromServer: async (key) => {
        var result = await fetch(
          `${this.urlBase}/keys/get?key=${encodeURI(key)}`,
          this.fetchOptions
        );
        return JSON.parse(await result.text());
      },
      setToServer: async (key, value) => {
        try {
          var response = await fetch(
            `${this.urlBase}/keys/set?key=${encodeURI(key)}`,
            Object.assign(
              {
                method: "POST",
                body: JSON.stringify(value),
              },
              this.fetchOptions
            )
          );
  
          return JSON.parse(await response.text());
        } catch (ex) {
          var error = `Failed to save key "${key}": ${ex.toString()}}`;
          alertify.alert(error);
          this.on.error.forEach((e) => e(error));
        }
      },
    };
    this.store.worker();
  
    this.app = {
      event: async (action, entity, args) => {
        this.queries.call("AppEvents.create", {
          entity: entity,
          action: action,
          args: args,
        });
      },
    };
  
    var dbProxy = this;
  
    var EntityMethods = function (entity) {
      (this._buildUrl = (
        find,
        sort,
        fields,
        skip,
        limit,
        sample,
        group,
        options,
        isCount
      ) => {
        if (!find) find = {};
        var countUrl = isCount ? "/count" : "";
        var url = `${dbProxy.urlBase}/${entity}${countUrl}?find=${encodeURI(
          JSON.stringify(find)
        )}`;
        if (sort) url += `&sort=${encodeURI(JSON.stringify(sort))}`;
        if (fields) url += `&fields=${encodeURI(JSON.stringify(fields))}`;
        if (skip) url += `&skip=${skip}`;
        if (limit) url += `&limit=${limit}`;
        if (sample) url += `&sample=${sample}`;
        if (group) url += `&group=${encodeURI(JSON.stringify(group))}`;
        if (options)
          url += Object.keys(options)
            .map((k) => `&${k}=${options[k]}`)
            .join();
        return url;
      }),
        (this.listOne = async (find, sort, fields, skip) => {
          var limit = 1;
          var items = await this.list(find, sort, fields, skip, limit);
          if (items.length) return items[0];
          return null;
        });
      this.list = async (
        find,
        sort,
        fields,
        skip,
        limit,
        sample,
        group,
        options
      ) => {
        //alertify.warning(`Fetching ${entity}`);
        var url = this._buildUrl(
          find,
          sort,
          fields,
          skip,
          limit,
          sample,
          group,
          options
        );
        return await dbProxy.fetchUrlJson(url, dbProxy.fetchOptions);
      };
  
      this.count = async (
        find,
        sort,
        fields,
        skip,
        limit,
        sample,
        group,
        options
      ) => {
        var url = this._buildUrl(
          find,
          sort,
          fields,
          skip,
          limit,
          sample,
          group,
          options,
          true
        );
        return parseInt(await dbProxy.fetchUrlJson(url, dbProxy.fetchOptions));
      };
  
      this.distinct = async (field, find) => {
        var url = `${dbProxy.urlBase}/${entity}/distinct/${field}`;
        if (find) url += `&find=${encodeURI(JSON.stringify(find))}`;
        return await dbProxy.fetchUrlJson(url, dbProxy.fetchOptions);
      };
  
      this.create = async (fields) => {
        var url = `${dbProxy.urlBase}/${entity}/create?`;
        if (dbProxy.userID) url += `userID=${dbProxy.userID}`;
        else {
          var token = await dbProxy.get.token("user");
          url += `tokenID=${token._id}`;
        }
        var result = await fetch(
          url,
          Object.assign(
            {
              method: "POST",
              body: JSON.stringify(fields),
            },
            dbProxy.fetchOptions
          )
        );
  
        var res = await result.text();
  
        try {
          return JSON.parse(res);
        } catch (ex) {
          throw `Error parsing: ${res}`;
        }
      };
  
      this.update = async (_id, fields = {}, tokenID) => {
        if (!_id) throw `_id not provided.`;
        fields = JSON.parse(JSON.stringify(fields));
        var url = `${dbProxy.urlBase}/${entity}/update?_id=${encodeURI(_id)}`;
        if (dbProxy.userID) url += `&userID=${dbProxy.userID}`;
        if (tokenID) url += `&tokenID=${tokenID}`;
        var result = await fetch(
          url,
          Object.assign(
            {
              method: "POST",
              body: JSON.stringify(fields),
            },
            dbProxy.fetchOptions
          )
        );
  
        var json = await result.text();

        if (!json?.length) return null;
  
        try {
          return JSON.parse(json);
        } catch (ex) {
          throw json;
        }
      };
  
      this.save = async (fields) => {
        var url = `${dbProxy.urlBase}/${entity}/save`;
        if (dbProxy.userID) url += `&userID=${dbProxy.userID}`;
        var result = await fetch(
          url,
          Object.assign(
            {
              method: "POST",
              body: JSON.stringify(fields),
            },
            dbProxy.fetchOptions
          )
        );
  
        return JSON.parse(await result.text());
      };
  
      this.delete = async (_id) => {
        var url = `${dbProxy.urlBase}/${entity}/delete?_id=${encodeURI(_id)}`;
        if (dbProxy.userID) url += `&userID=${dbProxy.userID}`;
        await fetch(url, dbProxy.fetchOptions);
      };
  
      this.vote = async (_id, score) => {
        if (!_id) throw `_id not provided.`;
        var url = `${dbProxy.urlBase}/${entity}/vote?_id=${encodeURI(
          _id
        )}&score=${score}`;
        if (dbProxy.userID) url += `&userID=${dbProxy.userID}`;
        return await fetch(url, dbProxy.fetchOptions);
      };
  
      this.startTask = async (_id) => {
        var response = await fetch(
          `${dbProxy.urlBase}/${entity}/startTask?_id=${encodeURI(_id)}`,
          dbProxy.fetchOptions
        );
        var result = await response.text();
        return result;
      };
  
      this.killTask = async (_id) => {
        var response = await fetch(
          `${dbProxy.urlBase}/${entity}/killTask?_id=${encodeURI(_id)}`,
          dbProxy.fetchOptions
        );
        var result = await response.text();
        return result;
      };
  
      this.call = async (_id, args) => {
        if (!args) args = {};
        if (typeof args == "object") args = Object.keys(args).map((a) => args[a]);
        var url = `${dbProxy.urlBase}/${entity}/${_id}?args=${encodeURI(
          JSON.stringify(args)
        )}`;
        if (dbProxy.logToConsole)
          console.log(`calling ${entity}/${_id}(${JSON.stringify(args)})`);
        return dbProxy.fetchUrlJson(url);
      };
    };
  
    this.entity = (entityName) => new EntityMethods(entityName);
  
    this.getEntityNames = async () => {
      return await this.fetchUrlJson(this.urlBase, { ...this.fetchOptions, cache: true });
    };
    this.callApiMethod = async (entity, group, method, args) => {
      var argsStr = args
        .map((a) => `${a.name}=${JSON.stringify(a.value || null)}`)
        .join(`&`);
      var url = `${
        this.urlBase
      }/api/${entity}/${group}/${method}?&_uid=${Date.now()}&${argsStr}`;
      var result = await this.fetchUrlJson(url, this.fetchOptions);
      return result;
    };
    this.getApiMethods = async () => {
      var result = await this.fetchUrlJson(
        `${this.urlBase}/api`,
        { ...this.fetchOptions, cache: true }
      );
      return result;
    };
    this.createEntityMethods = async () => {
      (await this.getEntityNames()).forEach((entityName) => {
        this[entityName.untitleize()] = this.entity(entityName);
      });
    };
    this.createApiMethods = async () => {
      this.api = {};
      var apiMethods = await this.getApiMethods();
      apiMethods.forEach((e) => {
        var entityName = e.entity.untitleize();
        this.api[entityName] = {};
        e.groups.forEach((g) => {
          this.api[entityName][g.name] = {};
          g.methods.forEach((m) => {
            this.api[entityName][g.name][m.name] = async (...args) => {
              let result = (await this.callApiMethod(
                e.entity,
                g.name,
                m.name,
                (m.args || []).map((a, i) => {
                  return { name: a, value: args[i] };
                }),
                { ...m }
              ));
                          if (m.then)
                          {
                              let thenArgs = [`api`, ...(m.then.args||[])];
                              let then = (eval(`async (${thenArgs.join(`,`)}) => { ${m.then.body} }`));
                              if (m.then.chainResult)
                              {
                                  result = (await then(this.api, result));
                              }
                              else
                              {
                                  then(this.api, result);
                              }
                          }
                          return result;
            };
          });
        });
      });
    };
  
    this.newIds = new LocalPersistedArray("newIds");
  
    this._getNewID = async (count) => {
      var url = `${dbProxy.urlBase}/get/new/id?count=${
        count || 1
      }&_u=${Date.now()}`;
      var result = await dbProxy.fetchUrlJson(url);
      return result.id || result;
    };
    this._getNewIDs = async (count) => {
      var result = await this._getNewID(count);
      if (typeof result == `number`) return [result];
      return result;
    };
    this.ensureNewIds = async () => {
      let minNewIDs = 1000;
      while (this.newIds.length < minNewIDs)
        this.newIds.push(
          ...(await this._getNewIDs(minNewIDs - this.newIds.length))
        );
      setTimeout(this.ensureNewIds, 1000);
    };
    this.ensureNewIds();
  
    this.logout = async () => {
      var url = `${dbProxy.urlBase}/logout`;
      await dbProxy.fetchUrlJson(url);
      return true;
    };
  
    this.get = {
      new: {
        id: async () => {
          var self = this;
          var tryToResolve = (resolve) => {
            if (!self.newIds.length) throw "No new ids available";
            var newID = self.newIds.splice(0, 1)[0];
            resolve(newID);
            return newID;
          };
          const promise = new Promise((resolve, reject) => {
            if (!tryToResolve(resolve))
              setTimeout(() => tryToResolve(resolve), 100);
          });
          return promise;
        },
      },
      user: async () => {
        var url = `${dbProxy.urlBase}/get/user`;
        var user = await dbProxy.fetchUrlJson(url);
        return user;
      },
      token: async (type) => {
        return JSON.parse(
          await (
            await fetch(
              `${dbProxy.urlBase}/get/token?type=${type}`,
              dbProxy.fetchOptions
            )
          ).text()
        );
      },
      googleLogin: async (googleCredential) => {
        var url = `${dbProxy.urlBase}/get/googleLogin`;
        var result = await fetch(
          url,
          Object.assign(
            {
              method: "POST",
              body: JSON.stringify({ credential: googleCredential }),
            },
            dbProxy.fetchOptions
          )
        );
  
        return JSON.parse(await result.text());
      },
    };
    this.set = {
      user: async (userID) => {
        var url = `${dbProxy.urlBase}/set/user?userID=${userID}`;
        var user = await dbProxy.fetchUrlJson(url);
        return user;
      },
    };
  
    this.undo = async () => {
      var url = `${dbProxy.urlBase}/undo?_u=${Date.now()}`;
      var result = await dbProxy.fetchUrlJson(url);
      return result;
    };
    this.redo = async () => {
      var url = `${dbProxy.urlBase}/redo?_u=${Date.now()}`;
      var result = await dbProxy.fetchUrlJson(url);
      return result;
    };
  
    this.jobs = new EntityMethods("jobs");
    this.jobs.start = async (_id) => {
      this.jobs.call(_id);
      alert("todo: job.start");
    };
    this.jobs.cancel = async (_id) => {
      alert("todo: job.cancel");
    };
  
    this.entities = new EntityMethods("entities");
    this.runningJobs = new EntityMethods("runningJobs");
    this.queries = new EntityMethods("queries");
    // backwards compatibility, differnt method args
    var entityUpdate = this.queries.update;
    this.queries.update = async (_id, args, code) => {
      return entityUpdate(_id, { args: args, code: code });
    };
  };
  
// #region 📤 exports
  if (typeof(module) != `undefined`)
  {
    module.exports = async ({ app }, inject) => {
      // Inject in Vue, context and store.
    
      let dbp = new anat.dev.DatabaseProxy(`db.memegenerator.net`, `MemeGenerator`);
      await dbp.createEntityMethods();
      await dbp.createApiMethods();
    
      inject("dbp", dbp);
    };
  }
// #endregion