// This version is for public clients like Meme Generator
// Doesn't have direct access to the database, but can still use the API

import { Data } from "../../../Shared/Data";

// Lowercase the first letter of a string
(String.prototype as any).untitleize = function () {
  return this.charAt(0).toLowerCase() + this.slice(1);
};

class DatabaseProxy {
  private fetchAsJson: (url: string, ...args: any[]) => Promise<any>;
  private newIds: Data.LocalPersistedArray;

  get dbName() {
    return this.urlBase.split("/").pop();
  }

  get = {
    user: async () => {
      var url = `${this.urlBase}/get/user`;
      var user = await this.fetchAsJson(url);
      return user;
    },
    token: async (type: string) => {
      return JSON.parse(
        await (
          await this.fetchAsJson(`${this.urlBase}/get/token?type=${type}`)
        ).text()
      );
    },
    new: {
      id: async () => {
        var self = this;
        var tryToResolve = (resolve: Function) => {
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
  };

  private constructor(
    private urlBase: string,
    _fetchAsJson?: (url: string, ...args: any[]) => Promise<any>
  ) {
    this.newIds = Data.LocalPersistedArray.new(`${this.dbName}/new.ids`);
    this.fetchAsJson =
      _fetchAsJson ||
      (async (url: string, ...args: any[]) => {
        const response = await fetch(url, ...args);
        const text = await response.text();
        if (!text?.length) return null;
        return JSON.parse(text);
      });
  }

  static async new(
    urlBase: string,
    _fetchAsJson?: (url: string, ...args: any[]) => Promise<any>
  ) {
    const dbp = new DatabaseProxy(urlBase, _fetchAsJson);
    await dbp.init();
    return dbp;
  }

  private async init() {
    const api = await this.createApiMethods();
    for (const key of Object.keys(api)) {
      (this as any)[key] = api[key];
    }
    await this.ensureNewIDs();
  }

  private async _getNewID(count: number) {
    var url = `${this.urlBase}/get/new/id?count=${count || 1}&_u=${Date.now()}`;
    var result = await this.fetchAsJson(url);
    return result.id || result;
  }

  private async _getNewIDs(count: number) {
    var result = await this._getNewID(count);
    if (typeof result == `number`) return [result];
    return result;
  }

  private async ensureNewIDs() {
    let minNewIDs = 10;
    while (this.newIds.length < minNewIDs)
      this.newIds.push(
        ...(await this._getNewIDs(minNewIDs - this.newIds.length))
      );
    setTimeout(this.ensureNewIDs.bind(this), 1000);
  }

  private static setValue(obj: any, value: any) {
    if (Array.isArray(obj)) {
      obj[0][obj[1]] = value;
    } else {
      obj.value = value;
    }
  }

  private async fetchJson(url: string, options: any = {}) {
    // $set also implies cached
    if (!options.$set) {
      if (options.cached) {
        // Even though we're returning from the cache,
        // we still want to fetch in the background
        // to update for the next time
        const fetchItem = async () => {
          const item = await this.fetchAsJson(url, options);
          //localStorage.setItem(url, JSON.stringify(item));
          return item;
        };
        //const cachedItem = Objects.json.parse(localStorage.getItem(url) || "null");
        const cachedItem = null;
        if (!cachedItem) return await fetchItem();
        // Fetch in the background
        fetchItem();
        return cachedItem;
      }
      return await this.fetchAsJson(url, options);
    }
    // Check the local cache
    //const cachedItem = Objects.json.parse(localStorage.getItem(url) || "null");
    const cachedItem = null;
    if (cachedItem) DatabaseProxy.setValue(options.$set, cachedItem);
    // Fetch in the background
    const item = await this.fetchAsJson(url, options);
    // Update the local cache
    //localStorage.setItem(url, JSON.stringify(item));
    DatabaseProxy.setValue(options.$set, item);
    return item;
  }

  private async callApiMethod(
    entity: string,
    group: string,
    method: string,
    args: any[],
    extraArgs: any[]
  ): Promise<any> {
    // We're using { $set: [obj, prop] } as a callback syntax
    // This is because sometimes we use the local cache and also fetch in the background
    // in which case we'll need to resolve twice which is not possible with a promise
    const options = extraArgs.find((a) => a?.$set) || {};

    let url = `${this.urlBase}/api/${entity}/${group}/${method}`;

    const isHttpPost = group == "create";

    if (isHttpPost) {
      const data = {} as any;
      args.forEach((a) => (data[a.name] = a.value));
      const isCreateCall = url.includes("/create/one");
      if (isCreateCall) {
        data._uid = DatabaseProxy.getRandomUniqueID();
      }
      const fetchOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        mode: "no-cors",
      };
      let result = await this.fetchJson(url, fetchOptions);
      // If we got an _id back, select the item
      // This is because when POSTing from localhost I'm having trouble getting the actual object back
      const _id = parseInt(result);

      if (isCreateCall && (!result || typeof result != "object")) {
        if (_id) {
          const idFieldName = `${entity
            .substring(0, entity.length - 1)
            .toLowerCase()}ID`;
          result = await this.callApiMethod(
            entity,
            "select",
            "one",
            [{ name: idFieldName, value: _id }],
            []
          );
        } else {
          result = await this.callApiMethod(
            entity,
            "select",
            "one",
            [{ name: "_uid", value: data._uid }],
            []
          );
        }
      }

      return result;
    }

    const argsStr = args
      .map((a) => `${a.name}=${JSON.stringify(a.value || null)}`)
      .join("&");
    const getUrl = `${url}?${argsStr}`;
    const result = await this.fetchJson(getUrl, options);
    return result;
  }

  private async createApiMethods(): Promise<any> {
    const api = {} as any;
    const apiMethods = await this.getApiMethods();
    apiMethods.forEach((e: any) => {
      const entityName = e.entity.untitleize();
      api[entityName] = {};
      e.groups.forEach((g: any) => {
        api[entityName][g.name] = {};
        g.methods.forEach((m: any) => {
          api[entityName][g.name][m.name] = async (...args: any[]) => {
            let result = await this.callApiMethod(
              e.entity,
              g.name,
              m.name,
              (m.args || []).map((a: any, i: number) => {
                return { name: a, value: args[i] };
              }),
              args.slice((m.args || []).length)
            );

            if (m.then) {
              const thenArgs = [`api`, ...(m.then.args || [])];
              const then = eval(
                `async (${thenArgs.join(`,`)}) => { ${m.then.body} }`
              );
              if (m.then.chainResult) {
                result = await then(api, result);
              } else {
                then(api, result);
              }
            }

            return result;
          };
        });
      });
    });
    return api;
  }

  private async getApiMethods(): Promise<any> {
    const result = await this.fetchJson(`${this.urlBase}/api`, {
      cached: true,
    });
    return result;
  }

  private static getRandomUniqueID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
      const random = (Math.random() * 16) | 0;
      const value = char === "x" ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }
}

export { DatabaseProxy };
