// Makes server side classes available to the client
import fs from "fs";
import * as colors from "colors";
import { Reflection } from "./Reflection";
import https from "https";
import express from "express";
import "./Extensions";
import { TypeScript } from "./TypeScript";

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

  interface InstanceInfo {
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
      instance._.id = Date.now();
      instance._.className = className;
      this.instances.push(instance);
      debugger;
      return instance;
    }

    getInstance(id: number) {
      let inst = this.instances.find((i) => i._.id === id);
      if (!inst) throw new Error(`Instance ${id} not found`);
      return inst;
    }
  }

  export class Server {
    host: string | null;
    port: number | null;
    baseUrl: string;
    classes: any[];
    apifyPath: string;
    httpServer!: any;
    instanceManager: InstanceManager;
    options: Options;

    constructor(
      host: string | null,
      port: number | null,
      baseUrl: string,
      classes: any[],
      apifyPath: string,
      options: Options = new Options()
    ) {
      this.host = host;
      this.port = port;
      this.baseUrl = baseUrl;
      this.classes = classes;
      this.apifyPath = apifyPath;
      this.options = options;
      this.instanceManager = new InstanceManager(options);

      this.init();
    }

    static startNew(
      host: string,
      port: number,
      baseUrl: string,
      classes: any[],
      apifyPath: string,
      options?: Options
    ) {
      let server = new Server(host, port, baseUrl, classes, apifyPath, options);
      server.start();
    }

    async processUrl(
      ip: any,
      url: string,
      reqBody?: string,
      options?: CallOptions
    ) {
      if (typeof ip == "string") ip = ip.ipToNumber();
      switch (url) {
        case "":
        case "/":
          let result = Reflection.getClassSignatures(this.classes) as any;
          if (options?.stringify) result = JSON.stringify(result);
          return result;
        case "/client.js":
          return this.getApifyClientSourceJs();
        default:
          let match = null;
          // /[class]/new
          if ((match = url.match(/^\/([a-zA-Z]+)\/new$/))) {
            const className = match[1];
            let cls = this.classes.find((c) => c.name === className);
            if (!cls) throw new Error(`Class ${className} not found`);
            let inst = await this.instanceManager.createInstance(
              className,
              cls,
              []
            );
            let result = { id: inst._.id } as any;
            if (options?.stringify) result = JSON.stringify(result);
            return result;
          } else if (
            (match = url.match(/^\/([a-zA-Z]+)\/(\d+)\/([a-zA-Z]+)(\?.*)?$/))
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
                ? JSON.parse(reqBody || "{}")
                : reqBody;
            const argValues = Reflection.getFunctionArgs(method).map(
              (argName) => argsObj[argName]
            );
            //console.log(`${methodName.yellow}(${JSON.stringify(argValues)})`);
            let result = await method.apply(inst, argValues);
            if (options?.stringify) result = JSON.stringify(result);
            return result;
          } else {
            // Handle any other cases or throw an error
            throw new Error(`Invalid URL: ${url}`);
          }
      }
    }

    init() {
      this.httpServer = express();
      this.httpServer.use(express.json());

      this.httpServer.use(function (req: any, res: any, next: any) {
        res.header("Access-Control-Allow-Origin", "*");
        next();
      });

      this.httpServer.get(this.baseUrl, async (req: any, res: any) => {
        // get the relative url from the request url minus the base url
        const relUrl = req.url.replace(this.baseUrl, "");
        res.send(await this.processUrl(getIP(req), relUrl));
        res.end();
      });

      this.httpServer.get(
        `${this.baseUrl}/client.js`,
        async (req: any, res: any) => {
          const relUrl = req.url.replace(this.baseUrl, "");
          res.send(await this.processUrl(getIP(req), relUrl));
          res.end();
        }
      );

      this.httpServer.get(
        `${this.baseUrl}/:class/new`,
        async (req: any, res: any) => {
          const relUrl = req.url.replace(this.baseUrl, "");
          res.send(await this.processUrl(getIP(req), relUrl));
          res.end();
        }
      );

      this.httpServer.all(
        `${this.baseUrl}/:class/:id/:method`,
        async (req: any, res: any) => {
          const relUrl = req.url.replace(this.baseUrl, "");
          res.send(await this.processUrl(getIP(req), relUrl, req.body));
          res.end();
        }
      );
    }

    start() {
      this.httpServer.listen(this.port, this.host, () => {
        console.log();
        console.log(
          `${colors.gray(`Apify HTTP server running\n`)}${
            `  http://${this.host}:${this.port}${this.baseUrl}`.yellow
          }`
        );
        console.log();
        console.log(`Exposed methods:`.gray);
        for (let clss of this.classes) {
          let classSignature = Reflection.getClassSignature(clss);
          console.log(`  ${classSignature.name}`.cyan);
          for (let method of classSignature.methods) {
            console.log(`    ${method.name}(${method.args.join(", ")})`.green);
          }
        }
        console.log();
      });
    }

    getApifyClientSourceJs() {
      const cls = Apify.Client.toString();
      return `var Apify = Apify || {};
      Apify.Client = ${cls};`;
      let source = fs.readFileSync(`${this.apifyPath}/ApifyClient.ts`, "utf8");
      source = source.replace("export { ApifyClient }", "");
      return TypeScript.transpile(source);
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
        if (method != "new" && !this._.id)
          throw new Error(
            `Use (await ${this._.name}.new()) to create a new instance.`
          );

        let url = `${(this as any)._.baseUrl}/${(this as any)._.name}`;
        if (this._.id) url += `/${this._.id}`;
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
          if (method != "new") url += `?${queryString}`;
          response = await fetch(url);
        } else {
          response = await fetch(url);
        }

        let text = await response.text();
        if (text.length) {
          let json = JSON.parse(text);
          if (json.error) throw new Error(json.error);
          return json;
        }
      };

      const _getArgsMap1 = (method: string, args: string[]) => {
        let argsMap = new Map<string, string>();
        for (let i = 0; i < args.length; i++) {
          let meth = signature.methods.find((m) => m.name == method);
          if (!meth)
            throw new Error(`Method ${method} not found in ${signature.name}`);

          argsMap.set(meth.args[i], args[i]);
        }
        return argsMap;
      };

      const _getNewID = async function () {};

      let cls = class {
        _: InstanceInfo = {} as InstanceInfo;

        static async new() {
          var inst = new cls();
          inst._ = cls.prototype._;
          inst._.id = (await inst._apiCall("new")).id as number;
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
      let classSigs = (await (await fetch(apiUrl)).json()) as ClassSignature[];

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
