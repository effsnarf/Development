import { TypeReferenceNode } from "typescript";
import "./Extensions";
import { node } from "webpack";

const _importMainFileToImplement =
  "This is not supported on the client side. Import Extensions.Objects to implement";

type ObjectNodeFilter = (node: any, key: string, value: any) => boolean;

class Objects {
  // { user: 1, a: 2 } to ['user', '1', 'a', '2']
  static flatten(obj: any) {
    const arr = [] as string[];
    Objects.traverse(obj, (node, key, value, path) => {
      if (!key.length) return;
      arr.push(key);
      arr.push(value);
    });
    return arr;
  }

  static async wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  static async awaitWithTimeout<T>(
    func: () => Promise<T>,
    milliseconds: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      setTimeout(() => reject("Timeout"), milliseconds);
      func().then(resolve).catch(reject);
    });
  }

  static is(obj: any, type: any): boolean {
    return (0)._is(obj, type);
  }

  // returns true for numbers and for strings that can be converted to numbers
  static isNumbery(obj: any): boolean {
    if (typeof obj === "number") return true;
    if (typeof obj === "string") return !isNaN(parseFloat(obj));
    return false;
  }

  static isPrimitive(obj: any): boolean {
    return Objects.isPrimitiveType(Objects.getType(obj));
  }

  static getType(obj: any): string {
    return (0)._getObjectType(obj);
  }

  static getTypeName(obj: any): string {
    if (typeof obj === "string" || obj instanceof String) return "string";
    if (typeof obj === "number" && isFinite(obj)) return "number";
    if (typeof obj === "boolean") return "boolean";
    if (Array.isArray(obj)) return "array";
    if (obj !== null && typeof obj === "object" && !Array.isArray(obj))
      return "object";
    if (obj instanceof Date) return "date";
    if (obj instanceof RegExp) return "regexp";
    if (obj instanceof Function) return "function";
    if (obj === null) return "null";
    if (obj === undefined) return "undefined";
    return "unknown";
  }

  static isPrimitiveType(type: any): boolean {
    return [String, Number, Boolean, Date, RegExp].some((t) => t === type);
  }

  static removeNullValueKeys(obj: any) {
    if (!obj) return;
    for (let key in obj) if (obj[key] == null) delete obj[key];
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

  static clone(obj: any, options?: { exclude?: string[] }): any {
    if (obj == null || obj == undefined || typeof obj != "object") return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags);
    if (Array.isArray(obj)) return obj.map((o) => Objects.clone(o, options));
    if (obj._isVue) return Objects.cloneVue(obj);
    try {
      let cloned = null;
      if (options?.exclude?.length) {
        const keys = Object.keys(obj).except(...options.exclude);
        cloned = {} as any;
        for (const key of keys) cloned[key] = Objects.clone(obj[key], options);
      } else {
        const replacer = (key: string, value: any) =>
          value === undefined ? null : value;
        cloned = Objects.json.parse(JSON.stringify(obj, replacer));
      }
      return cloned;
    } catch (ex) {
      throw ex;
    }
  }

  private static cloneVue(vue: any): any {
    const c = {} as any;
    c._uid = vue._uid;
    c.$options = Objects.clone({
      _componentTag: vue.$options._componentTag,
    });
    return c;
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
    if (!target || !source) return target || source;

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
            if (Object.keys(nestedResult || {}).length > 0) {
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

  static getPaths(obj: any, currentPath: string[] = []) {
    let paths: string[] = [];
    for (const key in obj) {
      const newPath = currentPath.concat(key);
      if (obj[key] !== null && typeof obj[key] === "object") {
        paths = paths.concat(Objects.getPaths(obj[key], newPath));
      } else {
        paths.push(newPath.join("."));
      }
    }
    return paths;
  }

  static getPathValues(obj: any, paths: string[] = []) {
    const newObj = {} as any;
    for (const path of paths) {
      const parts = path.split(".");
      let node = newObj;
      const getNextPart = () => parts.shift() || "";
      while (parts.length > 1) {
        const part = getNextPart();
        node = node[part] || (node[part] = {});
        node = node[part];
      }
      node[getNextPart()] = Objects.getProperty(obj, path);
    }
    return newObj;
  }

  static getPropertiesAsTree(sourceObj: any, pathList: string[]): any {
    const subtree: any = {};

    for (const path of pathList) {
      const [firstKey, ...remainingKeys] = path.split(".");
      if (!firstKey) continue;

      if (remainingKeys.length === 0) {
        subtree[firstKey] = Objects.getProperty(sourceObj, path);
        if (subtree[firstKey] === undefined) {
          subtree[firstKey] = null; // Set to null if value doesn't exist
        }
      } else {
        const nextSourceObj = sourceObj ? sourceObj[firstKey] : undefined;
        subtree[firstKey] = {
          ...subtree[firstKey],
          ...Objects.getPropertiesAsTree(nextSourceObj, [
            remainingKeys.join("."),
          ]),
        };
      }
    }

    return Objects.clone(subtree);
  }

  static getProperty(obj: any, path: string | (string | number)[]) {
    if (typeof path == "string") path = path.split(".");
    const keys = path as string[];
    let currentObj = obj;

    for (const key of keys) {
      if (currentObj === null || typeof currentObj !== "object") {
        return undefined;
      }
      currentObj = currentObj[key];
    }

    return currentObj;
  }

  static pathExists(obj: any, path: string | string[]) {
    if (typeof path == "string") path = path.split(".");
    const keys = path as string[];
    let currentObj = obj;

    for (const key of keys) {
      if (
        currentObj === null ||
        typeof currentObj !== "object" ||
        !(key in currentObj)
      ) {
        return false;
      }
      currentObj = currentObj[key];
    }

    return true;
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
    onValue: (
      node: any,
      key: string,
      value: any,
      path: number[],
      keyPath: (string | number)[]
    ) => void,
    include?: ObjectNodeFilter
  ): void {
    const traverse = function (
      node: any,
      key: string,
      value: any,
      path: number[],
      keyPath: (string | number)[],
      include?: ObjectNodeFilter
    ) {
      if (!include) include = () => true;

      onValue(node, key, value, path, keyPath);

      if (value && (Array.isArray(value) || typeof value === "object")) {
        if (Array.isArray(value)) {
          // Path index is filtered
          // (path filtered index)
          let pfi = 0;
          for (let i = 0; i < value.length; i++) {
            if (!include(node, i.toString(), value[i])) continue;
            traverse(
              value,
              i.toString(),
              value[i],
              [...path, pfi],
              [...keyPath, pfi],
              include
            );
            pfi++;
          }
        } else {
          const keys = Object.keys(value);
          let pfj = 0;
          for (let j = 0; j < keys.length; j++) {
            const k = keys[j];
            if (!include(node, k, value[k])) continue;
            traverse(
              value,
              k,
              value[k],
              [...path, pfj],
              [...keyPath, k],
              include
            );
            pfj++;
          }
        }
      }
    };
    traverse(obj, "", obj, [], [], include);
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

  static inspect(
    obj: any,
    showHidden?: boolean,
    depth?: number | null,
    color: boolean = true
  ): string {
    throw new Error(_importMainFileToImplement);
  }

  static parseYaml(str: string, options?: any): any {
    throw new Error(_importMainFileToImplement);
  }

  static parse = {
    json(str: string) {
      try {
        return JSON.parse(str);
      } catch (ex: any) {
        throw new Error(
          `Error parsing JSON:\n\n${JSON.stringify(str)}\n\n${ex.stack}`
        );
      }
    },
  };

  static pugToHtml(str: string, options?: any): string {
    throw new Error(_importMainFileToImplement);
  }

  static jsonify(obj: any): string {
    throw new Error(_importMainFileToImplement);
  }

  static deepDiff(obj1: any, obj2: any): any {
    throw new Error(_importMainFileToImplement);
  }

  static setProperty(
    obj: any,
    keyPath: string | (string | number)[],
    value: any
  ): void {
    return Objects.deepSet(obj, keyPath, value);
  }

  static deepSet(
    obj: any,
    keyPath: string | (string | number)[],
    value: any
  ): void {
    const keys = Array.isArray(keyPath) ? [...keyPath] : keyPath.split(".");
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
      if (Objects.is(src, Array)) {
        return src.map((s: any, i: number) => deepMerge(tgt[i], s));
      }

      if (!Objects.is(tgt, Array)) {
        if (!Objects.is(tgt, Object) || !Objects.is(src, Object)) {
          return src;
        }
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

  static deepAssign(target: any, ...objects: any[]): any {
    const deepAssign = (tgt: any, src: any) => {
      if (Objects.is(src, Array)) {
        return src.map((s: any, i: number) => deepAssign(tgt[i], s));
      }

      if (!Objects.is(tgt, Array)) {
        if (!Objects.is(tgt, Object) || !Objects.is(src, Object)) {
          return src;
        }
      }

      const merged = tgt;
      for (const key of Object.keys(src)) {
        if (key in merged) {
          if (Objects.is(merged[key], Object) && Objects.is(src[key], Object)) {
            merged[key] = deepAssign(merged[key], src[key]);
          } else {
            merged[key] = src[key];
          }
        } else {
          merged[key] = src[key];
        }
      }
      return merged;
    };

    let result = target;
    for (const object of objects) {
      result = deepAssign(result, object);
    }
    return result;
  }

  static deepAssignLeafs(target: any, source: any) {
    const keyPaths = Objects.getLeafKeyPaths(target);
    for (const keyPath of keyPaths) {
      const value = Objects.getProperty(source, keyPath);
      Objects.setProperty(target, keyPath, value);
    }
  }

  static getLeafKeyPaths(
    obj: any,
    prefix: (string | number)[] = []
  ): (string | number)[][] {
    const paths: (string | number)[][] = [];

    for (const key in obj) {
      const newPrefix = [...prefix, key];

      const value = obj[key];
      if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        const subPaths = this.getLeafKeyPaths(value, newPrefix);

        // If the object is empty, treat it as a leaf.
        if (subPaths.length === 0) {
          paths.push(newPrefix);
        } else {
          paths.push(...subPaths);
        }
      } else {
        // If the value is null or a primitive, it's a leaf node.
        paths.push(newPrefix);
      }
    }

    return paths;
  }

  static getAllKeyPaths(obj: any): (string | number)[][] {
    const keyPaths = [] as (string | number)[][];
    Objects.traverse(obj, (node, key, value, path, keyPath) => {
      keyPaths.push(keyPath);
    });
    return keyPaths;
  }

  static map(
    obj: any,
    func: (key: string, value: any, index: number) => [string, any]
  ): any {
    const result = {} as any;
    let index = 0;
    for (const key of Object.keys(obj)) {
      const [newKey, newValue] = func(key, obj[key], index++);
      result[newKey] = newValue;
    }
    return result;
  }

  static mapKeys(obj: any, func: (key: string, index: number) => string): any {
    // replace all the keys of an object, keeping the same values
    return Objects.map(obj, (key, value, index) => [func(key, index), value]);
  }

  static mapValues(obj: any, func: (value: any) => any) {
    return Objects.map(obj, (key, value) => [key, func(value)]);
  }

  static getValues(obj: any): any[] {
    if (!obj) return [];
    if (typeof obj !== "object") return [obj];
    if (Array.isArray(obj)) return obj;
    return Object.values(obj);
  }

  static getObjectFields(obj: any, fields: string[]): string[] {
    if (!obj) return obj;
    if (typeof obj !== "object") return obj;
    const result = {} as any;
    for (const field of fields) {
      result[field] = obj[field];
    }
    return result;
  }

  static async try(func: Function, onCatch: any | ((ex: any) => void)) {
    try {
      return await func();
    } catch (ex) {
      if (typeof onCatch === "function") return await onCatch(ex);
      return onCatch;
    }
  }

  static async tryAgain<T>(func: Function, attempts: number = 3): Promise<T> {
    try {
      const result = await func();
      return result;
    } catch (ex: any) {
      if (attempts <= 0) throw ex;
      return await this.tryAgain(func, attempts - 1);
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
        throw new Error(
          `Error parsing JSON:\n\n${JSON.stringify(str)}\n\n${ex.stack}`
        );
      }
    },
  };
}

interface TreeNode {
  id: number;
  children?: TreeNode[];
}

class TreeObject {
  static fromObject(
    obj: any,
    expandToTree?: (
      node: any,
      key: string,
      value: any,
      nodePath: string[]
    ) => boolean,
    nodePath: string[] = [],
    keyVarName = "name",
    valueVarName = "value",
    pathVarName = "path",
    depth = 0,
    onNode?: (
      objNode: any,
      treeNode: any,
      key: string,
      value: any,
      nodePath: string[]
    ) => void
  ) {
    if (depth > 100) debugger;
    const root = {
      children: [],
    } as any;
    let node = root;

    for (const key in obj) {
      const value = obj[key];
      const child = {} as any;
      child[keyVarName] = key;
      child[pathVarName] = [...nodePath, key];
      onNode?.(obj, child, key, value, [...nodePath, key]);

      node.children.push(child);

      let expand = false;

      if (Objects.isPrimitive(value)) {
        expand = false;
      } else {
        if (expandToTree) {
          expand = expandToTree(obj, key, value, [...nodePath, key]);
        } else {
          expand = Objects.is(value, Object);
        }
      }

      if (expand) {
        child.children = TreeObject.fromObject(
          value,
          expandToTree,
          [...nodePath, key],
          keyVarName,
          valueVarName,
          pathVarName,
          depth + 1,
          onNode
        ).children;
      } else {
        child[valueVarName] = value;
      }
    }

    return root;
  }

  static getByPath(root: any, path: string[] | number[]) {
    let node = root;
    for (const part of path) {
      node = node.children.find(
        (c: any) => c.name == part || c.id == part || c.type == part
      );
    }
    return node;
  }

  static traverse(
    root: any,
    callback: (node: any, depth: number) => void,
    getChildren: (node: any) => any[] = (node) => node.children || []
  ) {
    const traverse = (
      node: any,
      depth: number,
      callback: (node: any, depth: number) => void,
      getChildren: (node: any) => any[]
    ) => {
      callback(node, depth);
      const children = getChildren(node);
      if (children) {
        for (const child of children) {
          traverse(child, depth + 1, callback, getChildren);
        }
      }
    };

    traverse(root, 0, callback, getChildren);
  }

  static async traverseAsync(
    root: any,
    callback: Function,
    getChildren?: Function
  ) {
    // Traverse a tree structure (children[] on each node)
    const traverse = async (
      node: any,
      callback: Function,
      getChildren: Function = (node: any) => node.children
    ) => {
      await callback(node);
      const children = getChildren(node);
      if (children) {
        for (const child of children) {
          await traverse(child, callback, getChildren);
        }
      }
    };
    await traverse(root, callback, getChildren);
  }

  static filter(
    root: any,
    predicate: Function,
    getChildren?: (node: any) => any[]
  ) {
    predicate = TreeObject._evalSelector(predicate);
    const items = [] as any[];
    TreeObject.traverse(
      root,
      (node: any) => {
        if (predicate(node)) items.push(node);
      },
      getChildren
    );
    return items;
  }

  static find(
    root: any,
    predicate: Function,
    getChildren?: (node: any) => any[]
  ) {
    const items = TreeObject.filter(root, predicate, getChildren);
    return items.length ? items[0] : null;
  }

  static map(
    root: any,
    selector: Function,
    getChildren?: (node: any) => any[]
  ) {
    selector = TreeObject._evalSelector(selector);
    const items = [] as any[];
    TreeObject.traverse(
      root,
      (node: any) => {
        items.push(selector(node));
      },
      getChildren
    );
    return items;
  }

  static max(root: any, selector: Function) {
    const values = TreeObject.map(root, selector);
    return Math.max(...values);
  }

  static getChildIndex(parent: TreeNode, child: TreeNode) {
    const index = parent.children?.findIndex((c) => c.id == child.id);
    return index === -1 ? null : index;
  }

  static addNode(parent: TreeNode, node: TreeNode, index: number) {
    if (!parent.children) parent.children = [];
    parent.children.insertAt(index, node);
  }

  static moveNode(
    root: TreeNode,
    node: TreeNode,
    newParent: TreeNode,
    newChildIndex?: number
  ) {
    // Find the current parent of the node to be moved
    const currentParent = TreeObject.getParentNode(root, node);

    if (currentParent) {
      // Remove the node from its current parent's children
      currentParent.children =
        currentParent.children?.filter(
          (child: TreeNode) => child.id !== node.id
        ) || [];
    }

    // Add the node to the new parent's children
    if (!newParent.children) {
      newParent.children = [];
    }

    // If newChildIndex is not provided or out of bounds, push to the end
    if (
      newChildIndex === undefined ||
      newChildIndex >= newParent.children.length
    ) {
      newParent.children.push(node);
    } else {
      newParent.children.insertAt(newChildIndex, node);
    }
  }

  static deleteNode(
    root: TreeNode,
    isNode: ((item: TreeNode) => boolean) | TreeNode,
    options: { newTree: true }
  ) {
    if (options.newTree) root = Objects.clone(root);
    isNode = TreeObject._evalSelector(isNode);
    const parentNode = TreeObject.getParentNode(root, isNode);
    if (!parentNode) return root;
    parentNode.children?.removeBy(isNode);
    return root;
  }

  static getParentNode(
    root: TreeNode,
    isNode: Function | TreeNode
  ): TreeNode | null {
    isNode = TreeObject._evalSelector(isNode);
    let parentNode = null;
    TreeObject.traverse(root, (n: any) => {
      if (n.children && n.children.find(isNode)) parentNode = n;
    });
    return parentNode;
  }

  static getNodeDepth(root: TreeNode, node: TreeNode): number {
    let depth = 0;
    let parent = TreeObject.getParentNode(root, node);
    while (parent) {
      if (depth > 100) throw new Error("Tree too deep");
      depth++;
      node = parent;
      parent = TreeObject.getParentNode(root, node);
    }
    return depth;
  }

  static _evalSelector(func: any) {
    if (typeof func == "number") {
      const id = func;
      return (node: any) => node._id == id || node.id == id;
    }
    if (typeof func == "string") {
      const key = func;
      return (node: any) => node[key];
    }
    if (typeof func == "object") {
      const id = func.id;
      return (n: any) => n.id == id;
    }
    return func;
  }
}

export { Objects, TreeObject };
