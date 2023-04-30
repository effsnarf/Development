class Reflection {
  private static isFunction(obj: any) {
    const names = Object.getOwnPropertyNames(obj);
    if (names.some((n) => n == `caller`)) return true;
  }

  static getPrototype(instance: any) {
    if (instance.prototype && !Reflection.isFunction(instance.prototype))
      return instance.prototype;
    return instance.constructor.prototype;
  }

  static getMethodNames<T extends { constructor: Function }>(
    instance: T
  ): string[] {
    return Object.getOwnPropertyNames(Reflection.getPrototype(instance))
      .filter((prop) => prop !== "constructor")
      .filter((prop) => typeof (instance as any)[prop] === "function");
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
        ) => void | Promise<any>)
      | null,
    afterMethod:
      | ((
          className: string,
          methodName: string,
          args: any[],
          returnValue: any
        ) => void | Promise<any>)
      | null,
    deep: boolean = false
  ): T {
    const className = instance.constructor.name;

    Reflection.getMethodNames(instance).forEach((methodName) => {
      const originalMethod = (instance as any)[methodName];

      (instance as any)[methodName] = (...args: any[]) => {
        if (beforeMethod) beforeMethod(className, methodName, args);
        const returnValue = originalMethod.apply(instance, args);
        // If the method returns a promise, hook into the promise
        if (returnValue?.then) {
          returnValue.then((result: any) => {
            if (afterMethod) afterMethod(className, methodName, args, result);
          });
          return returnValue;
        }
        // Otherwise, just call the afterMethod handler
        if (afterMethod) afterMethod(className, methodName, args, returnValue);
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

  static logMethodCalls(instance: any) {
    Reflection.bindClassMethods(
      instance,
      (className, methodName, args) => {
        console.log(`before.${className}.${methodName}`, args);
      },
      (className, methodName, args, returnValue) => {
        console.log(`after.${className}.${methodName}`, args, returnValue);
      }
    );
  }

  static watchPropertyChanges(
    instance: any,
    callback: (property: string | symbol, oldValue: any, newValue: any) => void
  ) {
    return new Proxy(instance, {
      set: (target, property, value, receiver) => {
        const oldValue = target[property];
        const result = Reflect.set(target, property, value, receiver);
        callback(property, oldValue, value);
        return result;
      },
    });
  }
}

export { Reflection };
