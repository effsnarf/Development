import { Lock } from "../../../Shared/Lock";
import toTemplate from "../../../Shared/WebScript/to.template";
import { Component } from "./Component";
import { ComponentManager } from "./ComponentManager";
import { ClientDatabase } from "./ClientDatabase";

const isDevEnv = window.location.hostname == "localhost";

class ClientContext {
  // #region Globals
  static async get() {
    const lock = ((window as any)._clientContextLock ||
      ((window as any)._clientContextLock = new Lock())) as Lock;
    await lock.acquire();
    try {
      return ((window as any)._clientContext ||
        ((window as any)._clientContext =
          await ClientContext.new())) as ClientContext;
    } finally {
      lock.release();
    }
  }

  static _fetch: any;
  // #endregion

  db!: ClientDatabase;

  private componentManager!: ComponentManager;

  get comps() {
    return this.componentManager.comps;
  }

  Handlebars: any;
  Vue: any;

  templates!: {
    vue: string;
    style: string;
  };

  config!: {
    params: any;
  };

  private helpers: any;

  private compilation!: {
    context: any;
  };

  private constructor() {}

  private static async new() {
    const context = new ClientContext();
    await context.init();
    return context;
  }

  private async init() {
    ClientContext._fetch = window.fetch.bind(null);
    (window as any).fetch = ClientContext.fetch;

    this.db = await ClientDatabase.new("IDE", {
      ModifiedItems: ["key", "modifiedAt", "item"],
    });

    this.componentManager = await ComponentManager.get();

    this.templates = {} as any;
    this.config = {} as any;

    this.helpers = (window as any).helpers;
    this.templates = (window as any).templates;
    this.config = (window as any).config;

    this.Handlebars = (window as any).Handlebars;
    this.Vue = (window as any).Vue;

    this.compilation = {} as any;
    this.compilation.context = {
      helpers: this.helpers,
      isAttributeName: (name: string) =>
        this.isAttributeName(
          this.comps.map((c) => c.name),
          name
        ),
      includeAttribute: (name: string) => {
        return true;
      },
      postProcessAttribute: (attr: any[]) => {
        attr = [...attr];
        attr[0] = attr[0].replace("on_", "@");
        return attr;
      },
      toTemplate: (...args: any[]) => {
        return (toTemplate as any).apply(null, args);
      },
    };

    for (const helper of Object.entries(this.helpers || {})) {
      const func = eval(
        (helper[1] as string).replace(/: any/g, "").replace(/: string/g, "")
      );
      this.Handlebars.registerHelper(helper[0], (...args: any[]) => {
        return func(this.compilation.context, ...args);
      });
    }
  }

  async compileAll(filter: (comp: Component) => boolean = (c) => true) {
    for (const comp of this.comps.filter(filter)) {
      await comp.compile();
    }
  }

  async compileApp() {
    const isIdeComponent = (c: Component) =>
      ["ui", "ide"].some((p) => c.name.startsWith(`${p}.`));
    await this.compileAll((c: Component) => !isIdeComponent(c));
  }

  isAttributeName(componentNames: string[], name: string) {
    if (name.includes(".")) return false;
    if (name.startsWith(":")) return true;
    if (name.includes("#")) return false;
    if (name.startsWith("template")) return false;
    if (name == "slot") return false;
    if (
      [
        "a",
        "style",
        ...[1, 2, 3, 4, 5, 6].map((i) => `h${i}`),
        "pre",
        "p",
        "img",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "div",
        "span",
        "ul",
        "li",
        "input",
        "button",
        "canvas",
        "textarea",
        "component",
        "transition",
      ].includes(name)
    )
      return false;
    if (name.startsWith(".")) return false;
    if (componentNames.find((c) => c == name.replace(":", ""))) return false;
    return true;
  }

  async pugToHtml(pug: string) {
    if (!isDevEnv) return null;
    const url = `/pug`;
    const item = await (await fetch(url, { method: "post", body: pug })).text();
    return item;
  }

  async updateComponent(comp: any) {
    if (!isDevEnv) return;
    const url = `/component/update`;
    await fetch(url, { method: "post", body: JSON.stringify(comp) });
  }

  private static async fetch(...args: any[]): Promise<any> {
    try {
      const result = await ClientContext._fetch(...args);
      if (result.status < 500) return result;
      const text = await result.text();
      throw new Error(text);
    } catch (ex: any) {
      // Try again
      const url = args[0];
      console.error(`Error fetching ${url}`);
      console.error(ex);
      //if (window.location.hostname == "localhost") {
      if (
        !ex.message.includes(
          "Object reference not set to an instance of an object"
        )
      ) {
        ClientContext.alertify
          .error(`<h3>${url}</h3><pre>${ex.message}</pre>`)
          .delay(0);
      }
      //}
      // Try again
      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));
      return await ClientContext.fetch(...args);
    }
  }

  static getStringHashCode(str: string) {
    let hash = 0;
    if (str.length === 0) {
      return hash;
    }
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  static get alertify() {
    return (window as any).alertify;
  }

  get alertify() {
    return ClientContext.alertify;
  }
}

export { ClientContext };
