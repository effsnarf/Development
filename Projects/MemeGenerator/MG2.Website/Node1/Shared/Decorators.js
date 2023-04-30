"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.measurePerformance = void 0;
function replaceAllClassMethods(prototype, getNewMethod) {
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
function measurePerformance(onDone) {
    return function (target, descriptor) {
        const original = target;
        // Loop through all methods in the class and apply the decorator to each one
        replaceAllClassMethods(original.prototype, (methodName, methodFunc) => {
            return function (...args) {
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
                }
                else {
                    const end = Date.now();
                    onDone(this, methodName, args, result, {
                        started: start,
                        elapsed: Math.round(end - start),
                    });
                }
                return result;
            };
        });
        return target;
    };
}
exports.measurePerformance = measurePerformance;
