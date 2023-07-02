// This version is for public clients like Meme Generator
// Doesn't have direct access to the database, but can still use the API

// Lowercase the first letter of a string
(String.prototype as any).untitleize = function () {
  return this.charAt(0).toLowerCase() + this.slice(1);
};

class DatabaseProxy {
  private fetchAsJson: (url: string) => Promise<any>;

  private constructor(
    private urlBase: string,
    _fetchAsJson?: (url: string) => Promise<any>
  ) {
    this.fetchAsJson =
      _fetchAsJson ||
      (async (url: string) => {
        const response = await fetch(url);
        const text = await response.text();
        if (!text?.length) return null;
        try {
          return JSON.parse(text);
        } catch (e) {
          throw new Error(text);
        }
      });
  }

  static async new(
    urlBase: string,
    _fetchAsJson?: (url: string) => Promise<any>
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
          const item = await this.fetchAsJson(url);
          //localStorage.setItem(url, JSON.stringify(item));
          return item;
        };
        //const cachedItem = JSON.parse(localStorage.getItem(url) || "null");
        const cachedItem = null;
        if (!cachedItem) return await fetchItem();
        // Fetch in the background
        fetchItem();
        return cachedItem;
      }
      return await this.fetchAsJson(url);
    }
    // Check the local cache
    //const cachedItem = JSON.parse(localStorage.getItem(url) || "null");
    const cachedItem = null;
    if (cachedItem) DatabaseProxy.setValue(options.$set, cachedItem);
    // Fetch in the background
    const item = await this.fetchAsJson(url);
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
    const options = extraArgs.find((a) => a.$set) || {};

    const argsStr = args
      .map((a) => `${a.name}=${JSON.stringify(a.value || null)}`)
      .join("&");
    const url = `${this.urlBase}/api/${entity}/${group}/${method}?${argsStr}`;
    const result = await this.fetchJson(url, options);
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
}

export { DatabaseProxy };
