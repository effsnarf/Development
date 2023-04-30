"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Apify = void 0;
// Makes server side classes available to the client
const fs_1 = __importDefault(require("fs"));
const colors = __importStar(require("colors"));
const Reflection_1 = require("../Reflection");
const express_1 = __importDefault(require("express"));
const TypeScript_1 = require("../TypeScript");
const ApifyClient_1 = require("./ApifyClient");
const ipToNumber = (ip) => {
    let parts = ip.split(".");
    return (parseInt(parts[0]) * 256 * 256 * 256 +
        parseInt(parts[1]) * 256 * 256 +
        parseInt(parts[2]) * 256 +
        parseInt(parts[3]));
};
const getIP = (req) => {
    const ip = req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
    return ipToNumber(ip);
};
var Apify;
(function (Apify) {
    class Options {
        constructor() {
            this.singletons = [];
        }
    }
    class CallOptions {
        constructor() {
            this.stringify = false;
        }
    }
    class InstanceManager {
        constructor(options = new Options()) {
            this.instances = [];
            this.options = options;
        }
        createInstance(className, cls, args) {
            return __awaiter(this, void 0, void 0, function* () {
                // Check if the class is a singleton
                if (this.options.singletons.includes(className)) {
                    let instance = this.instances.find((i) => i._.className === className);
                    if (instance)
                        return instance;
                }
                // Check if the class has a static new method
                let instance = cls.new ? yield cls.new(...args) : new cls(...args);
                instance._ = instance._ || {};
                instance._.id = Date.now();
                instance._.className = className;
                this.instances.push(instance);
                return instance;
            });
        }
        getInstance(id) {
            let inst = this.instances.find((i) => i._.id === id);
            if (!inst)
                throw new Error(`Instance ${id} not found`);
            return inst;
        }
    }
    class Server {
        constructor(host, port, baseUrl, classes, apifyPath, options = new Options()) {
            this.host = host;
            this.port = port;
            this.baseUrl = baseUrl;
            this.classes = classes;
            this.apifyPath = apifyPath;
            this.options = options;
            this.instanceManager = new InstanceManager(options);
            this.init();
        }
        static startNew(host, port, baseUrl, classes, apifyPath, options) {
            let server = new Server(host, port, baseUrl, classes, apifyPath, options);
            server.start();
        }
        processUrl(ip, url, reqBody, options) {
            return __awaiter(this, void 0, void 0, function* () {
                ip = ipToNumber(ip);
                switch (url) {
                    case "":
                    case "/":
                        let result = Reflection_1.Reflection.getClassSignatures(this.classes);
                        if (options === null || options === void 0 ? void 0 : options.stringify)
                            result = JSON.stringify(result);
                        return result;
                    case "/client.js":
                        let source = fs_1.default.readFileSync(`${this.apifyPath}/ApifyClient.ts`, "utf8");
                        source = source.replace("export { ApifyClient }", "");
                        return TypeScript_1.TypeScript.transpile(source);
                    default:
                        let match = null;
                        // /[class]/new
                        if ((match = url.match(/^\/([a-zA-Z]+)\/new$/))) {
                            const className = match[1];
                            let cls = this.classes.find((c) => c.name === className);
                            let inst = yield this.instanceManager.createInstance(className, cls, []);
                            let result = { id: inst._.id };
                            if (options === null || options === void 0 ? void 0 : options.stringify)
                                result = JSON.stringify(result);
                            return result;
                        }
                        else if ((match = url.match(/^\/([a-zA-Z]+)\/(\d+)\/([a-zA-Z]+)(\?.*)?$/))) {
                            const className = match[1];
                            const id = match[2];
                            const methodName = match[3];
                            let cls = this.classes.find((c) => c.name === className);
                            let inst = this.instanceManager.getInstance(parseInt(id));
                            let method = inst[methodName];
                            if (!method)
                                throw new Error(`Method ${methodName} not found`);
                            const argsObj = typeof reqBody == "string"
                                ? JSON.parse(reqBody || "{}")
                                : reqBody;
                            const argValues = Reflection_1.Reflection.getFunctionArgs(method).map((argName) => argsObj[argName]);
                            //console.log(`${methodName.yellow}(${JSON.stringify(argValues)})`);
                            let result = yield method.apply(inst, argValues);
                            if (options === null || options === void 0 ? void 0 : options.stringify)
                                result = JSON.stringify(result);
                            return result;
                        }
                        else {
                            // Handle any other cases or throw an error
                            throw new Error(`Invalid URL: ${url}`);
                        }
                }
            });
        }
        init() {
            this.httpServer = (0, express_1.default)();
            this.httpServer.use(express_1.default.json());
            this.httpServer.use(function (req, res, next) {
                res.header("Access-Control-Allow-Origin", "*");
                next();
            });
            this.httpServer.get(this.baseUrl, (req, res) => __awaiter(this, void 0, void 0, function* () {
                // get the relative url from the request url minus the base url
                const relUrl = req.url.replace(this.baseUrl, "");
                res.send(yield this.processUrl(getIP(req), relUrl));
                res.end();
            }));
            this.httpServer.get(`${this.baseUrl}/client.js`, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const relUrl = req.url.replace(this.baseUrl, "");
                res.send(yield this.processUrl(getIP(req), relUrl));
                res.end();
            }));
            this.httpServer.get(`${this.baseUrl}/:class/new`, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const relUrl = req.url.replace(this.baseUrl, "");
                res.send(yield this.processUrl(getIP(req), relUrl));
                res.end();
            }));
            this.httpServer.all(`${this.baseUrl}/:class/:id/:method`, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const relUrl = req.url.replace(this.baseUrl, "");
                res.send(yield this.processUrl(getIP(req), relUrl, req.body));
                res.end();
            }));
        }
        start() {
            this.httpServer.listen(this.port, this.host, () => {
                console.log();
                console.log(`${colors.gray(`Apify HTTP server running\n`)}${`  http://${this.host}:${this.port}${this.baseUrl}`.yellow}`);
                console.log();
                console.log(`Exposed methods:`.gray);
                for (let clss of this.classes) {
                    let classSignature = Reflection_1.Reflection.getClassSignature(clss);
                    console.log(`  ${classSignature.name}`.cyan);
                    for (let method of classSignature.methods) {
                        console.log(`    ${method.name}(${method.args.join(", ")})`.green);
                    }
                }
                console.log();
            });
        }
    }
    Apify.Server = Server;
    ApifyClient_1.ApifyClient;
})(Apify || (Apify = {}));
exports.Apify = Apify;
