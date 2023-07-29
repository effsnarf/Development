import "./Extensions";

const _importMainFileToImplement =
  "This is not supported on the client side. Import Extensions.Objects to implement";

type ObjectNodeFilter = (node: any, key: string, value: any) => boolean;

class Objects {
  static is(obj: any, type: any): boolean {
    return (0)._is(obj, type);
  }

  static clone(obj: any): any {
    if (obj == null || obj == undefined || typeof obj != "object") return obj;
    try {
      return Objects.json.parse(JSON.stringify(obj));
    } catch (ex) {
      console.error("Error cloning object", obj, ex);
      debugger;
      throw ex;
    }
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
    onValue: (node: any, key: string, value: any, path: number[]) => void,
    include?: ObjectNodeFilter
  ): void {
    const traverse = function (
      node: any,
      key: string,
      value: any,
      path: number[],
      include?: ObjectNodeFilter
    ) {
      if (!include) include = () => true;

      onValue(node, key, value, path);

      if (value && (Array.isArray(value) || typeof value === "object")) {
        if (Array.isArray(value)) {
          // Path index is filtered
          // (path filtered index)
          let pfi = 0;
          for (let i = 0; i < value.length; i++) {
            if (!include(node, i.toString(), value[i])) continue;
            traverse(value, i.toString(), value[i], [...path, pfi], include);
            pfi++;
          }
        } else {
          const keys = Object.keys(value);
          let pfj = 0;
          for (let j = 0; j < keys.length; j++) {
            const k = keys[j];
            if (!include(node, k, value[k])) continue;
            traverse(value, k, value[k], [...path, pfj], include);
            pfj++;
          }
        }
      }
    };
    traverse(obj, "", obj, [], include);
  }

  static toCamelCaseKeys(obj: any): any {
    if (!obj) return obj;
    if (typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(Objects.toCamelCaseKeys);
    if (obj instanceof Date) return obj;
    if (obj instanceof RegExp) return obj;
    // Traverse the object and convert all keys to camel case
    const result = {} as any;
    for (const key of Object.keys(obj)) {
      let value = obj[key];
      value = Objects.toCamelCaseKeys(value);
      result[key.toCamelCase()] = value;
    }
    return result;
  }

  static toTitleCaseKeys(obj: any): any {
    const result = {} as any;
    for (const key of Object.keys(obj)) {
      let value = obj[key];
      if (value && !Array.isArray(value) && typeof value === "object")
        value = Objects.toTitleCaseKeys(value);
      result[key.toTitleCase()] = value;
    }
    return result;
  }

  static stringify(obj: any): string {
    throw new Error(_importMainFileToImplement);
  }

  static yamlify(obj: any): string {
    throw new Error(_importMainFileToImplement);
  }

  static parseYaml(str: string): any {
    throw new Error(_importMainFileToImplement);
  }

  static pugToHtml(str: string, options?: any): string {
    throw new Error(_importMainFileToImplement);
  }

  static jsonify(obj: any): string {
    throw new Error(_importMainFileToImplement);
  }

  static deepDiff(obj1: any, obj2: any): any {
    throw new Error(_importMainFileToImplement);
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

  static map(obj: any, func: (key: string, value: any) => [string, any]): any {
    const result = {} as any;
    for (const key of Object.keys(obj)) {
      const [newKey, newValue] = func(key, obj[key]);
      result[newKey] = newValue;
    }
    return result;
  }

  static mapValues(obj: any, func: (value: any) => any) {
    return Objects.map(obj, (key, value) => [key, func(value)]);
  }

  static try(func: Function, onCatch: (ex: any) => void) {
    try {
      return func();
    } catch (ex) {
      onCatch(ex);
    }
  }

  static json = {
    parse: (str: string) => {
      try {
        if (str === null) return null;
        if (str === undefined) return undefined;
        if (str === "undefined") return undefined;
        return JSON.parse(str);
      } catch (ex: any) {
        throw `Error parsing JSON:\n\n${JSON.stringify(str)}\n\n${ex.stack}`;
      }
    },
  };
}

export { Objects };
