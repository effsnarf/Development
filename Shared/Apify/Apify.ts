// Makes server side classes available to the client
import fs from "fs";
import * as colors from "colors";
import { Reflection } from "../Reflection";
import https from "https";
import express from "express";
import { TypeScript } from "../TypeScript";
import { ApifyClient as Client } from "./ApifyClient";

const ipToNumber = (ip: string) => {
  let parts = ip.split(".");
  return (
    parseInt(parts[0]) * 256 * 256 * 256 +
    parseInt(parts[1]) * 256 * 256 +
    parseInt(parts[2]) * 256 +
    parseInt(parts[3])
  );
};

const getIP = (req: any) => {
  const ip =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
  return ipToNumber(ip);
};

namespace Apify {
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
      ip = ipToNumber(ip);
      switch (url) {
        case "":
        case "/":
          let result = Reflection.getClassSignatures(this.classes) as any;
          if (options?.stringify) result = JSON.stringify(result);
          return result;
        case "/client.js":
          let source = fs.readFileSync(
            `${this.apifyPath}/ApifyClient.ts`,
            "utf8"
          );
          source = source.replace("export { ApifyClient }", "");
          return TypeScript.transpile(source);
        default:
          let match = null;
          // /[class]/new
          if ((match = url.match(/^\/([a-zA-Z]+)\/new$/))) {
            const className = match[1];
            let cls = this.classes.find((c) => c.name === className);
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
  }

  Client;
}

export { Apify };
