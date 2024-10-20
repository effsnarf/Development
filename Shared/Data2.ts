import { Objects } from "./Extensions.Objects.Client";
import { Events } from "./Events";
import { Reflection } from "./Reflection";
import {
  DatabaseProxy,
  EntityMethods,
} from "../Apps/DatabaseProxy/Client/DbpClient";

const deepDiff: Data2.DeepDiffInterface = (window as any).DeepDiff;

namespace Data2 {
  export interface StoredValue {
    key: string;
    value: any;
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
    public events = new Events({ sync: true });

    constructor(
      private _array: any[],
      initialValues: any[]
    ) {
      _array.clear();
      _array.push(...initialValues);
      Reflection.bindClassMethods(
        _array,
        this.beforeMethod.bind(this),
        this.afterMethod.bind(this)
      );
    }

    private beforeMethod = (
      className: string,
      methodName: string,
      args: any[]
    ) => {};

    private afterMethod = (
      beforeResult: any,
      className: string,
      methodName: string,
      args: any[],
      returnValue: any
    ) => {
      if (["clear", "push", "splice", "pop"].includes(methodName)) {
        this.events.emit(methodName, ...args);
      }
    };
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
        defaultValue: any
      ): Promise<VueObj> => {
        // load the value from storage
        const storedValue = (await this.getFromStore(key, defaultValue)).value;
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

    async array(key: string, array: any[]): Promise<Data2.Array> {
      // load the array from storage
      const storedArray = (await this.getFromStore(key, [])).value;
      const arrayObj = new Data2.Array(array, storedArray);
      // hook into the array events to save to storage
      arrayObj.events.on("*", async (method: string, ...args: any[]) => {
        await this.executeOnStoreObject(key, method, args);
      });
      // emit loaded event
      this._events.emit("loaded", key, storedArray);
      return arrayObj;
    }

    abstract existsInStore(key: string): Promise<boolean>;
    abstract getFromStore(key: string, defaultValue: any): Promise<StoredValue>;
    abstract setToStore(
      key: string,
      value: any,
      changes: Data2.Change[] | null
    ): Promise<void>;

    abstract executeOnStoreObject(
      key: string,
      method: string,
      args: any[]
    ): void;
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

    async executeOnStoreObject(
      key: string,
      method: string,
      args: any[]
    ): Promise<void> {
      const value = JSON.parse(localStorage.getItem(key) ?? "null");
      if (!value) throw new Error(`No stored value found for key: ${key}`);
      value[method](...args);
      localStorage.setItem(key, JSON.stringify(value));
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

    async executeOnStoreObject(
      key: string,
      method: string,
      args: any[]
    ): Promise<void> {
      const item = await this._items.listOne({ _id: this.fullID(key) });
      if (!item) throw new Error(`No stored value found for key: ${key}`);
      item.value[method](...args);
      await this._items.update(this.fullID(key), { value: item.value });
    }

    fullID(key: string) {
      const contextKey = Objects.flatten(this._contextKey);
      return [...contextKey, key].join("-");
    }
  }
}

export { Data2 };
