// Makes server side classes available to the client
import fs from "fs";
import * as colors from "colors";
import { Reflection } from "./Reflection";
import https from "https";
import express from "express";
import "./Extensions";
import ts from "typescript";
import { TypeScript } from "./TypeScript";
import { Objects } from "./Extensions.Objects.Client";
import { Http } from "./Http";

const getIP = (req: any) => {
  const ip =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
  return ip.ipToNumber();
};

namespace Apify {
  interface MethodSignature {
    name: string;
    args: string[];
  }

  interface ClassSignature {
    name: string;
    methods: MethodSignature[];
  }

  interface InstanceData {
    id: number;
  }

  class Options {
    singletons: string[] = [];
  }

  class CallOptions {
    stringify: boolean = false;
  }

  class InstanceManager {
    private options: Options;
    private instances: any[] = [];

    constructor(options: Options = new Options()) {
      this.options = options;
    }

    async createInstance(className: string, cls: any, args: any[]) {
      // Check if the class is a singleton
      if (this.options.singletons.includes(className)) {
        let instance = this.instances.find((i) => i._.className === className);
        if (instance) return instance;
      }
      // Check if the class has a static new method
      let instance = cls.new ? await cls.new(...args) : new cls(...args);
      instance._ = (instance as any)._ || {};
      instance.__ = { id: Date.now() };
      instance._.className = className;
      this.instances.push(instance);
      return instance;
    }

    getInstance(id: number) {
      let inst = this.instances.find((i) => i.__.id === id);
      if (!inst) throw new Error(`Instance ${id} not found`);
      return inst;
    }

    getInstances(className?: string) {
      if (!className) return [...this.instances];
      return this.instances.filter((i) => i._.className === className);
    }
  }

  export class Server {
    host: string | null;
    port: number | null;
    baseUrl: string;
    classes: any[];
    httpServer!: any;
    instanceManager: InstanceManager;
    options: Options;

    constructor(
      host: string | null,
      port: number | null,
      baseUrl: string,
      classes: any[],
      options: Options = new Options()
    ) {
      this.host = host;
      this.port = port;
      this.baseUrl = baseUrl;
      this.classes = classes;
      this.options = options;
      this.instanceManager = new InstanceManager(options);

      this.init();
    }

    static startNew(
      host: string,
      port: number,
      baseUrl: string,
      classes: any[],
      options?: Options
    ) {
      let server = new Server(host, port, baseUrl, classes, options);
      server.start();
    }

    getPublicState(inst: any) {
      let state = { ...inst };
      Object.assign(state, this.getPropsMap(inst));
      const hiddenKeys = this.getHiddenKeys(inst);
      hiddenKeys.forEach((key) => delete state[key]);
      return state;
    }

    getPropsMap(inst: any) {
      // Find all the properties (getters) of the instance
      const props = Reflection.getProperties(inst);
      const propsMap = new Map<string, any>();
      props.forEach((prop) => {
        propsMap.set(prop, inst[prop]);
      });
      return Object.fromEntries(propsMap);
    }

    getHiddenKeys(inst: any) {
      return Object.keys(inst).filter(this.isKeyHidden.bind(this));
    }

    isKeyHidden(key: string) {
      return key.startsWith("_") || key.startsWith("__");
    }

    toPublicInstance(inst: any) {
      return {
        _: inst._,
        state: this.getPublicState(inst),
      };
    }

    async processUrl(
      ip: any,
      url: string,
      reqBody?: string,
      options?: CallOptions
    ) {
      const _processUrl = async (ip: any, url: string, reqBody?: string) => {
        try {
          if (typeof ip == "string") ip = ip.ipToNumber();
          switch (url) {
            case "":
            case "/":
              const sigs = Reflection.getClassSignatures(this.classes) as any;
              return {
                classes: sigs,
                urls: [
                  "/",
                  "/instances",
                  "/client.js",
                  "/[class]",
                  "/[class]/new",
                  "/[class]/[id]",
                  "/[class]/[id]/[method]",
                ],
              };
            case "/instances":
              const insts = this.instanceManager.getInstances();
              return insts.map(this.toPublicInstance.bind(this));
            case "/client.js":
              return this.getApifyClientSourceJs();
            default:
              let match = null;
              // /[class]
              // Returns all instances of a class
              if ((match = url.match(/^\/([a-zA-Z]+)$/))) {
                const className = match[1];
                const insts = this.instanceManager.getInstances(className);
                const result = insts.map((inst) => this.toPublicInstance(inst));
                return result;
              }
              // /[class]/new?arg1=1&arg2=2
              if ((match = url.match(/^\/([a-zA-Z]+)\/new(\?.*)?$/))) {
                const className = match[1];
                const cls = this.classes.find((c) => c.name === className);
                if (!cls) throw new Error(`Class ${className} not found`);
                const args = Http.parseQueryArgs(match[2]);
                const inst = await this.instanceManager.createInstance(
                  className,
                  cls,
                  Object.values(args)
                );
                const state = this.getPublicState(inst);
                const result = { id: inst.__.id, state } as any;
                return result;
              }
              if (
                // /[class]/[id]
                (match = url.match(/^\/([a-zA-Z]+)\/(\d+)(\?.*)?$/))
              ) {
                const className = match[1];
                const id = match[2];
                let cls = this.classes.find((c) => c.name === className);
                let inst = this.instanceManager.getInstance(parseInt(id));
                let state = this.getPublicState(inst);
                return state;
              }
              if (
                // /[class]/[id]/[method]
                (match = url.match(
                  /^\/([a-zA-Z]+)\/(\d+)\/([a-zA-Z]+)(\?.*)?$/
                ))
              ) {
                const className = match[1];
                const id = match[2];
                const methodName = match[3];

                let cls = this.classes.find((c) => c.name === className);
                let inst = this.instanceManager.getInstance(parseInt(id));
                let method = inst[methodName];
                if (!method) throw new Error(`Method ${methodName} not found`);
                const argsObj =
                  typeof reqBody == "string"
                    ? Objects.json.parse(reqBody || "{}")
                    : reqBody;
                const argValues = Reflection.getFunctionArgs(method).map(
                  (argName) => argsObj[argName]
                );
                //console.log(`${methodName.yellow}(${JSON.stringify(argValues)})`);
                const result = await method.apply(inst, argValues);
                return { result, state: this.getPublicState(inst) };
              } else {
                // Handle any other cases or throw an error
                throw new Error(`Invalid URL: ${url}`);
              }
          }
        } catch (ex: any) {
          return { error: ex.message, stack: ex.stack };
        }
      };
      const result = await _processUrl(ip, url, reqBody);
      if (options?.stringify) return JSON.stringify(result);
      return result;
    }

    init() {
      this.httpServer = express();
      this.httpServer.use(express.json());

      // Allow CORS
      this.httpServer.use(function (req: any, res: any, next: any) {
        const origin = req.headers.origin;
        res.header("Access-Control-Allow-Origin", origin);
        res.header(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept"
        );
        res.header("Access-Control-Allow-Credentials", "true");
        next();
      });

      this.httpServer.all(`${this.baseUrl}*`, async (req: any, res: any) => {
        if (req.method == "OPTIONS") {
          res.end();
          return;
        }
        const relUrl = req.url.replace(this.baseUrl, "");
        //console.log(`[${req.method}] ${relUrl}`.gray);
        res.send(await this.processUrl(getIP(req), relUrl, req.body));
        res.end();
      });
    }

    start() {
      this.httpServer.listen(this.port, this.host, () => {
        console.log();
        console.log(
          `${`Apify HTTP server running\n`.gray}${
            `  http://${this.host}:${this.port}${this.baseUrl}`.yellow
          }`
        );
        console.log();
        console.log(`Exposed methods:`.gray);
        for (let clss of this.classes) {
          let classSignature = Reflection.getClassSignature(clss, {
            includePrivate: false,
          });
          console.log(`  ${classSignature.name}`.cyan);
          for (let method of classSignature.methods) {
            console.log(`    ${method.name}(${method.args.join(", ")})`.green);
          }
        }
        console.log();
        // Usage
        console.log(`Usage:`.gray);
        console.log(`  ${this.baseUrl}/[class]/new`.yellow);
        console.log(`  ${this.baseUrl}/[class]/[id]/[method]`.yellow);
        console.log();
      });
    }

    getApifyClientSourceJs() {
      const cls = Apify.Client.toString();
      return `var Apify = Apify || {};
      Apify.Client = ${cls};`;
      //return TypeScript.transpileToJavaScript(cls);
    }
  }

  // Takes this:
  // [{"name":"ChatOpenAI","methods":[{"name":"constructor","args":["role","log"]},{"name":"send","args":["message"]},{"name":"sendSeveral","args":["messages"]},{"name":"deleteLastMessage","args":[]}]}]
  // And returns a JavaScript class
  // with each method calling await this._apiCall("ChatOpenAI", "send", [message])
  export class Client {
    static createClass(baseUrl: string, signature: ClassSignature) {
      const _apiCall1 = async function (
        this: any,
        method: string,
        args: any[] = []
      ) {
        if (method != "new" && !this.__.id)
          throw new Error(
            `Use (await ${this._.name}.new()) to create a new instance.`
          );

        let url = `${(this as any)._.baseUrl}/${(this as any)._.name}`;
        if (this.__.id) url += `/${this.__.id}`;
        url += `/${method}`;

        let argsMap = this._getArgsMap(method, ...args);
        let queryString = Array.from(argsMap.keys())
          .map((key) => `${key}=${JSON.stringify(argsMap.get(key))}`)
          .join("&");

        let response;
        if (method !== "new") {
          response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(Object.fromEntries(argsMap)),
          });
        } else if (queryString?.length) {
          url += `?${queryString}`;
          response = await fetch(url);
        } else {
          response = await fetch(url);
        }

        let text = await response.text();
        if (text.length) {
          const json = JSON.parse(text);
          if (json.error) throw new Error(json.error);
          if (json.state) {
            Object.assign(this.state, json.state);
          }
          return json;
        }
      };

      const _getArgsMap1 = (method: string, args: string[]) => {
        if (method == "new") method = "constructor";
        let argsMap = new Map<string, string>();
        for (let i = 0; i < args.length; i++) {
          let meth = signature.methods.find((m) => m.name == method);
          if (!meth) {
            throw new Error(`Method ${method} not found in ${signature.name}`);
          }

          argsMap.set(meth.args[i], args[i]);
        }
        return argsMap;
      };

      const _getNewID = async function () {};

      let cls = class {
        _: ClassSignature = {} as ClassSignature;
        __: InstanceData = {} as InstanceData;

        state: any = {};

        static async new(...args: any[]) {
          var inst = new (cls as any)(...args);
          inst._ = cls.prototype._;
          const newCls = (await inst._apiCall("new", ...args)) as any;
          inst.__ = { id: newCls.id as number };
          inst.state = newCls.state;
          return inst;
        }

        _apiCall(method: string, ...args: any[]) {
          return _apiCall1.apply(this, [method, args]);
        }
        _getArgsMap(method: string, ...args: any[]) {
          return _getArgsMap1.apply(this, [method, args]);
        }
      };

      (cls.prototype as any)._ = {
        ...signature,
        baseUrl: baseUrl,
      };

      for (let method of signature.methods) {
        // @ts-ignore
        cls.prototype[method.name] = async function (...args) {
          return await this._apiCall(method.name, ...args);
        };
      }

      return cls;
    }

    static async createClasses(apiUrl: string) {
      // Make sure the URL doesn't end with a slash
      if (apiUrl.endsWith("/")) apiUrl = apiUrl.substring(0, apiUrl.length - 1);

      // Get the class signatures from the api
      const api = await (await fetch(apiUrl)).json();
      const classSigs = api.classes as ClassSignature[];

      let classes = new Map<string, any>();

      // Create a class for each signature
      classSigs.forEach((sig) => {
        classes.set(sig.name, Apify.Client.createClass(apiUrl, sig));
      });

      // Return the classes as an object
      return Object.fromEntries(classes);
    }
  }
}

export { Apify };
