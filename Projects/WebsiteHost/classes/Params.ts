const Vue = (window as any).Vue;

interface ParamItem {
  name: string;
  get: Function;
  ref: any;
}

class Params {
  private _items: ParamItem[] = [];

  private constructor(private getRootVue: () => any, private _config: any) {}

  static async new(getRootVue: () => any, config: any, url: string) {
    const params = new Params(getRootVue, config);
    await params.init();
    await params.refresh(url);
    return params;
  }

  async init() {
    for (const param of Object.entries(this._config.params)) {
      const paramConf = param[1] as any;
      const get = eval(`(${paramConf.get})`);
      const ref = Vue.ref({ value: null });

      const paramItem = {
        name: param[0],
        get,
        ref,
      };
      this._items.push(paramItem);
      (this as any)[paramItem.name] = paramItem.ref;

      const rootVue = this.getRootVue();
    }
  }

  async refresh(url: string) {
    for (const item of this._items) {
      item.ref.value = await item.get.apply(this, [url]);
    }
  }
}

export { Params };
