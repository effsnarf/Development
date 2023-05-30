import "./Extensions";
import util from "util";
const deepDiff = require("deep-diff").diff;
const jsyaml = require("js-yaml");

class Objects {
  static is(obj: any, type: any): boolean {
    return (0)._is(obj, type);
  }

  static clone(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }

  static on(obj: any, key: string | Function, callback: Function): void {
    if (typeof key === "function") {
      const func = key;
      const self = obj;
      self[func.name] = (...args: any[]) => {
        setTimeout(() => callback.apply(self, args), 0);
        return func.apply(self, args);
      };
      return;
    }

    const self = obj;
    const descriptor = Object.getOwnPropertyDescriptor(self, key);
    if (descriptor && (descriptor.get || descriptor.set)) {
      if (!descriptor.get)
        throw new Error("Cannot watch a non-getter property");
      if (!descriptor.set)
        throw new Error("Cannot watch a non-setter property");
      const getter = descriptor.get;
      const setter = descriptor.set;
      Object.defineProperty(self, key, {
        get: function () {
          return getter();
        },
        set: function (newValue) {
          setter(newValue);
          callback(newValue);
        },
      });
      return;
    }

    let value = self[key];
    Object.defineProperty(self, key, {
      get: function () {
        return value;
      },
      set: function (newValue) {
        value = newValue;
        callback(newValue);
      },
    });
  }

  static traverse(
    obj: any,
    onValue: (node: any, key: string, value: any) => void
  ): void {
    const traverse = function (node: any, key: string, value: any) {
      onValue(node, key, value);
      if (value && typeof value === "object") {
        for (const k of Object.keys(value)) {
          traverse(value, k, value[k]);
        }
      }
    };
    traverse(obj, "", obj);
  }

  static toCamelCaseKeys(obj: any): any {
    const result = {};
    for (const key of Object.keys(obj)) {
      (result as any)[key.toCamelCase()] = obj[key];
    }
    return result;
  }

  static stringify(obj: any): string {
    return util.inspect(obj, { depth: 4 });
  }

  static yamlify(obj: any): string {
    return jsyaml.dump(obj);
  }

  static jsonify(obj: any): string {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (ex: any) {
      throw `Error stringifying object\n${ex.message}\n${Objects.yamlify(obj)}`;
    }
  }

  static deepDiff(obj1: any, obj2: any): any {
    return deepDiff(obj1, obj2);
  }

  static deepMerge(target: any, ...objects: any[]): any {
    const deepMerge = (tgt: any, src: any) => {
      if (typeof tgt !== "object" || typeof src !== "object") {
        return tgt;
      }

      if (null == src) {
        return tgt;
      }

      const merged = Objects.clone(tgt);
      for (const key of Object.keys(src)) {
        if (key in merged) {
          merged[key] = deepMerge(merged[key], src[key]);
        } else {
          merged[key] = src[key];
        }
      }
      return merged;
    };

    let result = target;
    for (const object of objects) {
      result = deepMerge(result, object);
    }
    return result;
  }

  static try(func: Function, onCatch: (ex: any) => void) {
    try {
      return func();
    } catch (ex) {
      onCatch(ex);
    }
  }
}

export { Objects };
