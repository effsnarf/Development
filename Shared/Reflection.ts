interface MethodSignature {
  name: string;
  modifiers?: string[];
  args: string[];
}

type Options1 = { includePrivate: boolean };
const defaultOptions1: Options1 = { includePrivate: false };

class Reflection {
  static getClassSignatures(clss: any[]) {
    return clss.map((c) => this.getClassSignature(c));
  }

  // { name: "Reflection", methods: [ { name: "getClassSignature", args: ["cls"] } ] }
  static getClassSignature(cls: any, options: Options1 = defaultOptions1) {
    return {
      name: Reflection.getClassName(cls),
      methods: Reflection.getClassMethods(cls, options),
    };
  }

  // Accepts a JavaScript class and returns its name
  static getClassName(cls: any) {
    return cls.name;
  }

  // [
  //  { name: "send", args: ["message"] },
  // ]
  static getClassMethods(cls: any, options: Options1 = defaultOptions1) {
    let methods = [] as MethodSignature[];
    // Add the constructor
    methods.push({
      name: "constructor",
      args: Reflection.getFunctionArgs(cls.prototype.constructor),
    });
    for (let key of Object.getOwnPropertyNames(cls.prototype)) {
      if (key === "constructor") continue;
      try {
        if (typeof (cls.prototype[key] as any) === "function") {
          methods.push({
            name: key,
            args: Reflection.getFunctionArgs(cls.prototype[key]),
          });
        }
      } catch (ex: any) {}
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
    if (!options?.includePrivate) {
      methods = methods.filter((m) => !m.name.startsWith("_"));
    }
    return methods;
  }

  static getInstanceMethods(instance: any) {
    let methods = [] as MethodSignature[];
    for (let key of Object.getOwnPropertyNames(instance)) {
      if (key === "constructor") continue;
      try {
        if (typeof (instance as any)[key] === "function") {
          methods.push({
            name: key,
            args: Reflection.getFunctionArgs((instance as any)[key]),
          });
        }
      } catch (ex: any) {}
    }
    return methods;
  }

  static getFunctionArgs(func: any): string[] {
    let args = func.toString().match(/\(([^)]*)\)/)?.[1] || "";
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

  static getProperties(instance: any) {
    let properties = [] as string[];
    for (let key of Object.getOwnPropertyNames(instance)) {
      if (key === "constructor") continue;
      try {
        if (typeof (instance as any)[key] !== "function") {
          properties.push(key);
        }
      } catch (ex: any) {}
    }
    return properties;
  }

  static getMemberClasses<T extends { constructor: Function }>(
    instance: T
  ): string[] {
    const members = Object.keys(instance)
      .map((key) => (instance as any)[key])
      .filter((prop) => prop)
      .filter((prop) => typeof prop === `object`)
      .filter((prop) => prop.constructor);
    return members;
  }

  static bindClassMethods<T extends { constructor: Function }>(
    instance: T,
    beforeMethod:
      | ((
          className: string,
          methodName: string,
          args: any[]
        ) => any | Promise<any>)
      | null,
    afterMethod:
      | ((
          beforeResult: any,
          className: string,
          methodName: string,
          args: any[],
          returnValue: any
        ) => void)
      | null,
    deep: boolean = false,
    instanceMethods: boolean = false
  ): T {
    const className = instance.constructor.name;

    const methods = instanceMethods
      ? Reflection.getInstanceMethods(instance)
      : Reflection.getClassMethods(instance.constructor);

    methods.forEach(({ name }) => {
      const methodName = name;
      const originalMethod = (instance as any)[methodName];
      if (!originalMethod) return;

      (instance as any)[methodName] = (...args: any[]) => {
        const beforeResult = !beforeMethod
          ? null
          : beforeMethod(className, methodName, args);
        const returnValue = originalMethod.apply(instance, args);
        // If the method returns a promise, hook into the promise
        if (returnValue?.then) {
          returnValue.then((result: any) => {
            if (afterMethod)
              afterMethod(beforeResult, className, methodName, args, result);
          });
          return returnValue;
        }
        // Otherwise, just call the afterMethod handler
        if (afterMethod)
          afterMethod(beforeResult, className, methodName, args, returnValue);
        return returnValue;
      };
    });

    if (deep) {
      const members = Reflection.getMemberClasses(instance);
      for (const member of members)
        this.bindClassMethods(member, beforeMethod, afterMethod, deep);
    }

    return instance;
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
