// This version is for public clients like Meme Generator
// Doesn't have direct access to the database, but can still use the API
class DatabaseProxy {
  private constructor(private urlBase: string) {}

  static async new(urlBase: string) {
    const dbp = new DatabaseProxy(urlBase);
    await dbp.init();
    return dbp;
  }

  private async init() {
    const api = await this.createApiMethods();
    for (const key of Object.keys(api)) {
      (this as any)[key] = api[key];
    }
  }

  private async callApiMethod(
    entity: string,
    group: string,
    method: string,
    args: any[]
  ): Promise<any> {
    const argsStr = args
      .map((a) => `${a.name}=${JSON.stringify(a.value || null)}`)
      .join("&");
    const url = `${
      this.urlBase
    }/api/${entity}/${group}/${method}?&_uid=${Date.now()}&${argsStr}`;
    const result = await (await fetch(url)).json();
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
              })
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
    const result = await (await fetch(`${this.urlBase}/api`)).json();
    return result;
  }
}

export { DatabaseProxy };
