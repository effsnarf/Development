import { Objects } from "./Extensions.Objects.Client";
import { Events } from "./Events";
import { Reflection } from "./Reflection";
import {
  DatabaseProxy,
  EntityMethods,
} from "../Apps/DatabaseProxy/Client/DbpClient";

const deepDiff: Data2.DeepDiffInterface = (window as any).DeepDiff;

namespace Data2 {
  export interface RemoteObjectOptions {
    allowNull: boolean;
  }

  export interface StoredValue {
    key: string;
    value?: any;
    items?: any[];
    totalCount?: number;
  }

  export interface DeepDiffInterface {
    diff(lhs: any, rhs: any): any;
    applyChange(obj: any, change: Change): void;
  }

  export interface Change {
    type: string;
    path: string[];
    lhs: any;
    rhs: any;
  }

  export class VueObj {
    events = new Events({ sync: true });

    constructor(
      private _vue: any,
      private _key: string,
      initialValue: any
    ) {
      let oldValue = Objects.clone(initialValue);
      _vue.$data[_key] = initialValue;
      _vue.$watch(
        _key,
        (newValue: any) => {
          // #TODO slow
          const changes = deepDiff.diff(oldValue, newValue);
          if (!changes) return;
          oldValue = Objects.clone(newValue);
          this.events.emit("modified", newValue, changes);
        },
        { deep: true }
      );
    }
  }

  // emits changes on every array operation
  export class Array {
    private _isSyncing = true;
    public events = new Events({ sync: true });

    constructor(private items: any[]) {
      (items as any).totalCount = null;
      Reflection.bindClassMethods(
        items,
        this.beforeMethod.bind(this),
        this.afterMethod.bind(this)
      );
    }

    get totalCount() {
      return (this.items as any).totalCount;
    }

    set totalCount(value: number) {
      (this.items as any).totalCount = value;
    }

    getItems() {
      return [...this.items];
    }

    setItems(items: any[]) {
      this._isSyncing = false;
      this.items.clear();
      this.items.push(...items);
      this._isSyncing = true;
    }

    private beforeMethod = (
      className: string,
      methodName: string,
      args: any[]
    ) => {
      if (!this._isSyncing) return;
      if (!["push", "splice"].includes(methodName)) return;
      this.events.emit(methodName, ...args);
    };

    private afterMethod = (
      beforeResult: any,
      className: string,
      methodName: string,
      args: any[],
      returnValue: any
    ) => {};
  }

  abstract class Store {
    protected _events = new Events();
    private _loadedKeys = [] as string[];

    onAllLoaded(keys: string[], callback: Function) {
      const onLoaded = (key: string, obj: any) => {
        this._loadedKeys.push(key);
        // if all keys are loaded
        if (keys.every((key) => this._loadedKeys.includes(key))) {
          callback();
          this._events.off("loaded", onLoaded);
        }
      };
      this._events.on("loaded", onLoaded);
    }

    vue = {
      reactive: async (
        vue: any,
        key: string,
        defaultValue: any,
        options: RemoteObjectOptions = { allowNull: true }
      ): Promise<VueObj> => {
        // load the value from storage
        let storedValue = (await this.getFromStore(key, defaultValue, options))
          .value;
        if (!options.allowNull) {
          if (storedValue === null) storedValue = defaultValue;
        }
        const vueObj = new VueObj(vue, key, storedValue);
        // hook into the vue events to save to storage
        vueObj.events.on(
          "modified",
          async (newValue: any, changes: Data2.Change[]) => {
            await this.setToStore(key, newValue, changes);
          }
        );
        // emit loaded event
        this._events.emit("loaded", key, vueObj);
        return vueObj;
      },
    };

    async array(
      key: string,
      appArray: any[],
      viewItemsCount: number
    ): Promise<Data2.Array> {
      // load the array from storage
      const arrayObj = new Data2.Array(appArray);
      await this.updateViewItems(arrayObj, key, viewItemsCount);
      // hook into the array events to save to storage
      arrayObj.events.on("*", async (method: string, ...args: any[]) => {
        if (["after.array.op"].includes(method)) return;
        await this._arrayOperation(arrayObj, key, method, args);
        await this.updateViewItems(arrayObj, key, viewItemsCount);
      });
      // emit loaded event
      this._events.emit("loaded", key, appArray);
      return arrayObj;
    }

    // load the sliding view from storage
    // the client only keeps a sliding view of the array
    async updateViewItems(
      arrayObj: Data2.Array,
      key: string,
      maxItems: number
    ) {
      const viewItems = await this.getArrayItems(key, maxItems);
      arrayObj.totalCount = viewItems.totalCount;
      arrayObj.setItems(viewItems.items);
    }

    abstract existsInStore(key: string): Promise<boolean>;
    abstract getFromStore(
      key: string,
      defaultValue: any,
      options: RemoteObjectOptions
    ): Promise<StoredValue>;
    abstract setToStore(
      key: string,
      value: any,
      changes: Data2.Change[] | null
    ): Promise<void>;

    private async _arrayOperation(
      arrayObj: Data2.Array,
      key: string,
      method: string,
      args: any[]
    ) {
      switch (method) {
        case "push":
          await this.addArrayItems(key, args);
          break;
        case "splice":
          const items = arrayObj.getItems();
          if (!items?.length) return;
          const fromIndex = items[Math.max(args[0], 0)]._i;
          await this.spliceArrayItems(key, fromIndex);
          break;
        default:
          throw new Error(`Method ${method} not implemented`);
      }
      //arrayObj.events.emit("after.array.op", key, method, args);
    }

    abstract getArrayItems(key: string, maxItems: number): Promise<StoredValue>;
    abstract addArrayItems(key: string, items: any[]): Promise<void>;
    abstract spliceArrayItems(
      key: string,
      index: number,
      count?: number
    ): Promise<void>;
  }

  export class BrowserLocalStorage extends Store {
    async existsInStore(key: string): Promise<boolean> {
      return !!localStorage.getItem(key);
    }

    async getFromStore(key: string, defaultValue: any): Promise<StoredValue> {
      if (!(await this.existsInStore(key))) {
        await this.setToStore(key, defaultValue, null);
      }
      const value = JSON.parse(localStorage.getItem(key) ?? "null");
      return { key, value };
    }

    async setToStore(key: string, value: any, changes: Data2.Change[] | null) {
      localStorage.setItem(key, JSON.stringify(value));
    }

    async getArrayItems(key: string, maxItems: number): Promise<StoredValue> {
      throw new Error("Method not implemented.");
    }

    async addArrayItems(key: string, items: any[]): Promise<void> {
      throw new Error("Method not implemented.");
    }

    async spliceArrayItems(
      key: string,
      index: number,
      count?: number
    ): Promise<void> {
      throw new Error("Method not implemented.");
    }
  }

  export class DatabaseProxyStorage extends Store {
    private _entity: string;
    private _items: EntityMethods;
    constructor(
      private _dbp: DatabaseProxy,
      private _entities: string,
      private _contextKey: any
    ) {
      super();
      this._entity = _entities.singularize();
      this._items = this._dbp.entity(_entities);
    }

    async existsInStore(key: string): Promise<boolean> {
      const item = await this._items.listOne({ _id: this.fullID(key) });
      return !!item;
    }

    async getFromStore(key: string, defaultValue: any): Promise<StoredValue> {
      if (!(await this.existsInStore(key))) {
        await this.setToStore(key, defaultValue, null);
      }
      const item = await this._items.listOne({ _id: this.fullID(key) });
      return { key, value: item.value };
    }

    async setToStore(key: string, value: any, changes: Data2.Change[] | null) {
      await this._items.update(this.fullID(key), { value });
    }

    async getArrayItems(key: string, maxItems: number): Promise<StoredValue> {
      const find = { arrayID: this.fullID(key) };
      const totalCount = await this._items.count(find);
      const items = (
        await this._items.list(find, { _i: -1 }, { item: 1 }, 0, maxItems)
      )
        .reverse()
        .map((a: any) => a.item);
      return { key, items, totalCount };
    }

    async addArrayItems(key: string, items: any[]): Promise<void> {
      const arrayID = this.fullID(key);
      const lastItem = await this._items.listOne({ arrayID }, { _i: -1 });
      let _i = (!lastItem ? -1 : lastItem._i) + 1;
      let id = (!lastItem ? 0 : lastItem.item.id) + 1;
      for (const item of items) {
        item._i = _i;
        item.id = id;
        await this._items.create({ arrayID, _i, item });
        _i++;
        id++;
      }
    }

    async spliceArrayItems(
      key: string,
      index: number,
      count?: number
    ): Promise<void> {
      const arrayID = this.fullID(key);
      const itemsToRemove = await this._items.list(
        { arrayID, _i: { $gte: index } },
        {},
        {},
        0,
        count
      );
      for (const item of itemsToRemove) {
        await this._items.delete(item._id);
      }
    }

    fullID(key: string) {
      const contextKey = Objects.flatten(this._contextKey);
      return [...contextKey, key].join("-");
    }
  }
}

export { Data2 };
