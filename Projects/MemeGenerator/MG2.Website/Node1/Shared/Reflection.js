"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reflection = void 0;
class Reflection {
    static getClassSignatures(clss) {
        return clss.map((c) => this.getClassSignature(c));
    }
    // { name: "Reflection", methods: [ { name: "getClassSignature", args: ["cls"] } ] }
    static getClassSignature(cls) {
        return {
            name: Reflection.getClassName(cls),
            methods: Reflection.getClassMethods(cls),
        };
    }
    // Accepts a JavaScript class and returns its name
    static getClassName(cls) {
        return cls.name;
    }
    // [
    //  { name: "send", args: ["message"] },
    // ]
    static getClassMethods(cls) {
        let methods = [];
        for (let key of Object.getOwnPropertyNames(cls.prototype)) {
            if (key === "constructor")
                continue;
            if (typeof cls.prototype[key] === "function") {
                const method = {
                    name: key,
                    args: Reflection.getFunctionArgs(cls.prototype[key]),
                };
                methods.push(method);
            }
        }
        return methods;
    }
    static getFunctionArgs(func) {
        let args = func.toString().match(/\(([^)]*)\)/)[1];
        let resultArgs = args
      .split(",")
      .map(
        (arg) =>
          (arg
            .replace(/\/\*.*\*\//, "")
            .trim()
            // get words
            ?.match(/\w+/g) || [])[0]
      )
      .filter((arg) => arg);
        return resultArgs;
    }
}
exports.Reflection = Reflection;
