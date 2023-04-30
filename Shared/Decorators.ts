function replaceAllClassMethods(
  prototype: any,
  getNewMethod: (methodName: string, methodFunc: Function) => Function
) {
  Object.getOwnPropertyNames(prototype).forEach((key) => {
    if (key !== "constructor") {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, key);
      if (descriptor && typeof descriptor.value === "function") {
        const originalMethod = descriptor.value;
        prototype[key] = getNewMethod(key, originalMethod);
      }
    }
  });
}

// logPerformance class decorator
function measurePerformance(
  onDone: (
    context: any,
    method: string,
    args: any[],
    result: any,
    dt: {
      started: number;
      elapsed: number;
    }
  ) => void
) {
  return function (target: any, descriptor: any) {
    const original = target;

    // Loop through all methods in the class and apply the decorator to each one
    replaceAllClassMethods(
      original.prototype,
      (methodName: string, methodFunc: Function) => {
        return function (this: any, ...args: any[]) {
          const start = Date.now();
          const result = methodFunc.apply(this, args);
          // If result is a promise, wait for it to resolve before logging the time
          if (result instanceof Promise) {
            result.then(() => {
              const end = Date.now();
              onDone(this, methodName, args, result, {
                started: start,
                elapsed: Math.round(end - start),
              });
            });
          } else {
            const end = Date.now();
            onDone(this, methodName, args, result, {
              started: start,
              elapsed: Math.round(end - start),
            });
          }
          return result;
        };
      }
    );

    return target;
  };
}

export { measurePerformance };
