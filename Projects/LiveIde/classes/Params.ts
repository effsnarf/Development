const Vue = (window as any).Vue;

interface ParamItem {
  name: string;
  get: Function;
  watch: Function;
  immediate: boolean;
  ref: any;
}

class Params {
  private _items: ParamItem[] = [];
  data: any = {};

  private constructor(public $root: any, private _config: any) {}

  static async new(rootVue: any, config: any, url: string) {
    const params = new Params(rootVue, config);
    await params.init();
    await params.refresh(url);
    return params;
  }

  private async init() {
    for (const dataVar of Object.entries(this._config.data)) {
      this.data[dataVar[0]] = Vue.ref(dataVar[1]);
    }

    for (const param of Object.entries(this._config.params)) {
      const paramConf = param[1] as any;
      const get = eval(`(${paramConf.get})`);
      const watch = eval(`(${paramConf.watch.handler})`);
      const immediate = paramConf.watch.immediate;

      const paramItem = {
        name: param[0],
        get,
        watch,
        immediate,
        ref: Vue.ref(),
      };
      this._items.push(paramItem);
      (this as any)[paramItem.name] = paramItem.ref;
      Vue.watch(
        paramItem.ref,
        async (newValue: any) => {
          await paramItem.watch.apply(this, [newValue]);
        },
        { immediate: paramItem.immediate }
      );
    }
  }

  private async refresh(url: string) {
    for (const item of this._items) {
      item.ref.value = await item.get.apply(this, [url]);
    }
  }
}

export { Params };
