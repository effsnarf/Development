import "./Extensions";

const _importMainFileToImplement =
  "This is not supported on the client side. Import Extensions.Objects to implement";

type ObjectNodeFilter = (node: any, key: string, value: any) => boolean;

class Objects {
  static is(obj: any, type: any): boolean {
    return (0)._is(obj, type);
  }

  static isPrimitive(obj: any): boolean {
    return Objects.isPrimitiveType(Objects.getType(obj));
  }

  static getType(obj: any): string {
    return (0)._getObjectType(obj);
  }

  static isPrimitiveType(type: any): boolean {
    return [String, Number, Boolean, Date, RegExp].some((t) => t === type);
  }

  static getAllKeys(obj: any): string[] {
    let keys: string[] = [];
    let currentObj = obj;
    const visitedObjects = new Set();

    while (currentObj && !visitedObjects.has(currentObj)) {
      keys = keys.concat(Object.getOwnPropertyNames(currentObj));
      visitedObjects.add(currentObj);
      currentObj = Object.getPrototypeOf(currentObj);
    }

    return keys;
  }

  static getAllEntries(obj: any): any[] {
    const keys = Objects.getAllKeys(obj);
    return keys.map((key) => [key, obj[key]]);
  }

  static compare(obj1: any, obj2: any): number {
    return (0)._compare(obj1, obj2);
  }

  static areEqual(obj1: any, obj2: any): boolean {
    if (typeof obj1 != "object" || typeof obj2 != "object") return obj1 == obj2;
    if ((obj1 == null) != (obj2 == null)) return false;
    if (obj1 == null && obj2 == null) return true;
    const keys1 = Object.keys(obj1).sortBy((s) => s);
    const keys2 = Object.keys(obj2).sortBy((s) => s);
    if (keys1.join(",") != keys2.join(",")) return false;
    for (const key of keys1) {
      if (!Objects.areEqual(obj1[key], obj2[key])) return false;
    }
    return true;
  }

  static eval(str: string): any {
    try {
      return eval(str);
    } catch (ex: any) {
      throw new Error(`Error evaluating expression:\n\n${str}\n\n${ex.stack}`);
    }
  }

  static clone(obj: any): any {
    if (obj == null || obj == undefined || typeof obj != "object") return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags);
    try {
      return Objects.json.parse(JSON.stringify(obj));
    } catch (ex) {
      throw ex;
    }
  }

  // JSDoc documentation
  /**
   * Return whether the object is clonable.
   * @param obj The object to check.
   * @returns true, false, or undefined if the object is clonable, not clonable, or unknown.
   **/
  static isClonable(obj: any): boolean | undefined {
    if (obj == null || obj == undefined) return true;
    if (Objects.is(obj, String)) return true;
    if (Objects.is(obj, Number)) return true;
    if (Objects.is(obj, Boolean)) return true;
    if (Objects.is(obj, Date)) return true;
    if (Objects.is(obj, RegExp)) return true;
    if (Objects.is(obj, Function)) return false;
    if (Objects.is(obj, Array)) return (obj as any[]).every(Objects.isClonable);

    if (obj instanceof Element) return false;

    return undefined;
  }

  static subtract(target: any, source: any): any {
    if (Array.isArray(target) && Array.isArray(source)) {
      const result = [] as any[];
      for (let i = 0; i < target.length; i++) {
        result.push(Objects.subtract(target[i], source[i]));
      }
      return result;
    }

    if (!Objects.is(target, Object)) return target;

    const targetJson = JSON.stringify(target);
    const sourceJson = JSON.stringify(source);

    if (targetJson === sourceJson) {
      return {}; // Return an empty object if the JSON representations are identical
    } else {
      const result: any = {};

      for (const key in target) {
        if (target.hasOwnProperty(key)) {
          if (
            typeof target[key] === "object" &&
            typeof source[key] === "object"
          ) {
            const nestedResult = Objects.subtract(target[key], source[key]); // Recursively subtract nested objects
            if (Object.keys(nestedResult).length > 0) {
              result[key] = nestedResult;
            }
          } else if (target[key] !== source[key]) {
            result[key] = target[key]; // Add the property to the result if the values are different
          }
        }
      }

      return result;
    }
  }

  static withoutFalsyValues(obj: any): any {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (obj[key]) {
          result[key] = obj[key];
        }
      }
    }
    return result;
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

  static traverseMap(obj: any) {
    const items = [] as any[];
    Objects.traverse(obj, (node, key, value, path) => {
      items.push({ node, key, value, path });
    });
    return items;
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

  static parseYaml(str: string, options?: any): any {
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

  static deepSet(obj: any, path: string, value: any): void {
    const keys = path.split(".");
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
  }

  static deepMerge(target: any, ...objects: any[]): any {
    const deepMerge = (tgt: any, src: any) => {
      if (Objects.is(tgt, Array) || Objects.is(src, Array)) {
        return src.map((s: any, i: number) => deepMerge(tgt[i], s));
      }

      if (!Objects.is(tgt, Object) || !Objects.is(src, Object)) {
        return src;
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

  static async try(func: Function, onCatch: any | ((ex: any) => void)) {
    try {
      return await func();
    } catch (ex) {
      if (typeof onCatch === "function") return await onCatch(ex);
      return onCatch;
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
