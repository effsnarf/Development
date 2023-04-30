"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApifyClient = void 0;
// Takes this:
// [{"name":"ChatOpenAI","methods":[{"name":"constructor","args":["role","log"]},{"name":"send","args":["message"]},{"name":"sendSeveral","args":["messages"]},{"name":"deleteLastMessage","args":[]}]}]
// And returns a JavaScript class
// with each method calling await this._apiCall("ChatOpenAI", "send", [message])
class ApifyClient {
    static createClass(baseUrl, signature) {
        const _apiCall1 = function (method, args = []) {
            return __awaiter(this, void 0, void 0, function* () {
                if (method != "new" && !this._.id)
                    throw new Error(`Use (await ${this._.name}.new()) to create a new instance.`);
                let url = `${this._.baseUrl}/${this._.name}`;
                if (this._.id)
                    url += `/${this._.id}`;
                url += `/${method}`;
                let argsMap = this._getArgsMap(method, args);
                let queryString = Array.from(argsMap.keys())
                    .map((key) => `${key}=${JSON.stringify(argsMap.get(key))}`)
                    .join("&");
                let response;
                if (method !== "new") {
                    response = yield fetch(url, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(Object.fromEntries(argsMap)),
                    });
                }
                else if (queryString === null || queryString === void 0 ? void 0 : queryString.length) {
                    url += `?${queryString}`;
                    response = yield fetch(url);
                }
                else {
                    response = yield fetch(url);
                }
                let text = yield response.text();
                if (text.length) {
                    let json = JSON.parse(text);
                    if (json.error)
                        throw new Error(json.error);
                    return json;
                }
            });
        };
        const _getArgsMap1 = (method, args) => {
            let argsMap = new Map();
            for (let i = 0; i < args.length; i++) {
                let meth = signature.methods.find((m) => m.name == method);
                if (!meth)
                    throw new Error(`Method ${method} not found in ${signature.name}`);
                argsMap.set(meth.args[i], args[i]);
            }
            return argsMap;
        };
        const _getNewID = function () {
            return __awaiter(this, void 0, void 0, function* () { });
        };
        let cls = class {
            constructor() {
                this._ = {};
            }
            static new() {
                return __awaiter(this, void 0, void 0, function* () {
                    var inst = new cls();
                    inst._.id = (yield inst._apiCall("new")).id;
                    return inst;
                });
            }
            _apiCall(method, ...args) {
                return _apiCall1.apply(this, [method, args]);
            }
            _getArgsMap(method, ...args) {
                return _getArgsMap1.apply(this, [method, args]);
            }
        };
        cls.prototype._ = Object.assign(Object.assign({}, signature), { baseUrl: baseUrl });
        for (let method of signature.methods) {
            // @ts-ignore
            cls.prototype[method.name] = function (...args) {
                return __awaiter(this, void 0, void 0, function* () {
                    return yield this._apiCall(method.name, args);
                });
            };
        }
        return cls;
    }
    static createClasses(apiUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            // Make sure the URL doesn't end with a slash
            if (apiUrl.endsWith("/"))
                apiUrl = apiUrl.substring(0, apiUrl.length - 1);
            // Get the class signatures from the api
            let classSigs = (yield (yield fetch(apiUrl)).json());
            let classes = new Map();
            // Create a class for each signature
            classSigs.forEach((sig) => {
                classes.set(sig.name, ApifyClient.createClass(apiUrl, sig));
            });
            // Return the classes as an object
            return Object.fromEntries(classes);
        });
    }
}
exports.ApifyClient = ApifyClient;
