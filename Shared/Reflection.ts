interface MethodSignature {
  name: string;
  modifiers?: string[];
  args: string[];
}

class Reflection {
  static getClassSignatures(clss: any[]) {
    return clss.map((c) => this.getClassSignature(c));
  }

  // { name: "Reflection", methods: [ { name: "getClassSignature", args: ["cls"] } ] }
  static getClassSignature(cls: any) {
    return {
      name: Reflection.getClassName(cls),
      methods: Reflection.getClassMethods(cls),
    };
  }

  // Accepts a JavaScript class and returns its name
  static getClassName(cls: any) {
    return cls.name;
  }

  // [
  //  { name: "send", args: ["message"] },
  // ]
  static getClassMethods(cls: any) {
    let methods = [] as MethodSignature[];
    for (let key of Object.getOwnPropertyNames(cls.prototype)) {
      if (key === "constructor") continue;
      if (typeof (cls.prototype[key] as any) === "function") {
        methods.push({
          name: key,
          args: Reflection.getFunctionArgs(cls.prototype[key]),
        });
      }
    }
    // Get static methods
    for (let key of Object.getOwnPropertyNames(cls)) {
      if (typeof (cls as any)[key] === "function") {
        methods.push({
          name: key,
          modifiers: ["static"],
          args: Reflection.getFunctionArgs((cls as any)[key]),
        });
      }
    }
    return methods;
  }

  static getFunctionArgs(func: any): string[] {
    let args = func.toString().match(/\(([^)]*)\)/)[1];
    let resultArgs = args
      .split(",")
      .map(
        (arg: string) =>
          (arg
            .replace(/\/\*.*\*\//, "")
            .trim()
            // get words
            ?.match(/\w+/g) || [])[0]
      )
      .filter((arg: string) => arg);
    return resultArgs;
  }

  static trackPropertyValue<T>(
    obj: any,
    property: string,
    callback: (value: T) => void
  ) {
    if (!obj) throw new Error("obj is null or undefined");

    // Check if the property is already a getter/setter
    // If yes, save the original getter/setter
    const descriptor = Object.getOwnPropertyDescriptor(obj, property);
    if (descriptor) {
      if (!descriptor.get)
        throw new Error(`Property ${property} is not a getter/setter`);
      if (!descriptor.set) throw new Error(`Property ${property} is read-only`);
      let getter = descriptor.get;
      let setter = descriptor.set;
      // Replace the property with a getter/setter
      Object.defineProperty(obj, property, {
        get: () => getter(),
        set: (newValue: T) => {
          setter(newValue);
          callback(newValue);
        },
      });
      return;
    }

    // If no, replace the property with a getter/setter
    let value = obj[property];
    Object.defineProperty(obj, property, {
      get: () => value,
      set: (newValue: T) => {
        value = newValue;
        callback(value);
      },
    });
  }
}

export { Reflection };
