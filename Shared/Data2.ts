import { Objects } from "./Extensions.Objects.Client";
import { Events } from "./Events";
import { Reflection } from "./Reflection";

const alertify = (window as any).alertify;

const deepDiff: Data2.DeepDiffInterface = (window as any).DeepDiff;

namespace Data2 {
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

  export class Obj<T> {
    public events = new Events();

    constructor(private _value: T) {}

    static from = {
      vue: {
        reactive: (vue: any, key: string) => {
          return new VueObj(vue, key);
        },
      },
      array: (array: any[]) => {
        return new Data2.Array(array);
      },
    };

    get value() {
      return this._value;
    }

    set value(value: any) {
      this._value = value;
    }
  }

  export class VueObj {
    private _obj: Obj<any>;

    get events() {
      return this._obj.events;
    }

    constructor(
      vue: any,
      private _key: string
    ) {
      const obj = (this._obj = new Obj(Objects.clone(vue[_key])));
      vue.$watch(
        _key,
        (newValue: any) => {
          const oldValue = Objects.clone(obj.value);
          obj.value = newValue;
          // #TODO slow
          const changes = deepDiff.diff(oldValue, newValue);
          if (!changes) return;
          for (const change of changes) {
            obj.events.emit("change", change);
          }
        },
        { deep: true }
      );
    }
  }

  // emits changes on every array operation
  export class Array {
    public events = new Events();

    constructor(private _array: any[]) {
      Reflection.bindClassMethods(
        _array,
        this.beforeMethod.bind(this),
        this.afterMethod
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
      if (["add", "splice"].includes(methodName)) {
        this.events.emit(methodName, ...args);
      }
    };
  }

  export interface Store {
    vue: {
      reactive(vue: any, key: string): Data2.VueObj;
    };
    array(key: string, array: any[]): Data2.Array;
  }

  export namespace Browser {
    export class LocalStorage implements Store {
      vue = {
        reactive: (vue: any, key: string, defaultValue: any) => {
          let storedValue = JSON.parse(
            localStorage.getItem(key) ?? JSON.stringify(defaultValue)
          );
          const isPrimitive = Objects.isPrimitive(storedValue);
          const vueObj = new VueObj(vue, key);
          vueObj.events.on("change", (change: Data2.Change) => {
            if (isPrimitive) {
              storedValue = change.rhs;
            } else {
              deepDiff.applyChange(storedValue, change);
            }
            localStorage.setItem(key, JSON.stringify(storedValue));
          });
          return vueObj;
        },
      };

      array(key: string, array: any[]) {
        const storedArray = JSON.parse(localStorage.getItem(key) ?? "[]");
        array.clear();
        array.push(...storedArray);
        const arrayObj = new Data2.Array(array);
        arrayObj.events.on("*", (name: string, ...args: any[]) => {
          storedArray[name](...args);
          localStorage.setItem(key, JSON.stringify(storedArray));
        });
        return arrayObj;
      }
    }
  }
}

export { Data2 };
