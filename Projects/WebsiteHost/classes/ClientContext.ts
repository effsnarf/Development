import { Lock } from "../../../Shared/Lock";
import toTemplate from "../../../Shared/WebScript/to.template";
import isAttributeName from "../../../Shared/WebScript/is.attribute.name";
import { Ticker } from "../../../Shared/Ticker";
import { Component } from "./Component";
import { ComponentManager } from "./ComponentManager";
import { ClientDatabase } from "./ClientDatabase";

const isDevEnv = window.location.hostname == "localhost";

class ClientContext {
  static _fetch: any;
  static context: ClientContext | null = null;

  // #region Globals
  static waitUntilLoaded() {
    return new Promise((resolve: Function) => {
      if (ClientContext.context) return resolve();
      const interval = setInterval(() => {
        if (ClientContext.context) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }

  static async initialize() {
    ClientContext.context = await ClientContext.new();
  }
  // #endregion

  db!: ClientDatabase;

  private componentManager!: ComponentManager;

  get comps() {
    return this.componentManager.comps;
  }

  Handlebars: any;
  Vue: any;

  templates!: {
    module: string;
    vue: string;
    style: string;
  };

  config!: {
    params: any;
  };

  clientPug: any;

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
      postProcessAttribute: (attr: any[]) => {
        attr = [...attr];
        attr[0] = attr[0].replace(/\bon_/g, "@");
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
        if (args[0]?.constructor?.name == "ClientContext") args.shift();
        return func(this.compilation.context, ...args);
      });
    }
  }

  async compileAll(
    filter: (comp: Component) => boolean = (c) => true,
    mixins: any[] = []
  ) {
    const comps = this.comps.filter(filter);
    //this.alertify.message(`📦 Compiling ${comps.length} components...`);
    for (const comp of comps) {
      await comp.compile(mixins);
    }
  }

  async compileApp() {
    const isIdeComponent = (c: Component) =>
      ["ui", "ide"].some((p) => c.name.startsWith(`${p}.`));
    await this.compileAll((c: Component) => !isIdeComponent(c));
  }

  async reloadComponentsFromServer() {
    await this.componentManager.reloadComponentsFromServer();
    await this.compileAll((c: Component) => !["app"].includes(c.name));
  }

  isAttributeName(componentNames: string[], name: string) {
    return isAttributeName(componentNames, name);
  }

  async pugToHtml(pug: string) {
    try {
      if (!this.clientPug) this.clientPug = eval('require("pug")');
      let html = this.clientPug.compile(pug)();
      // Replace (template v-slot="[name]") with (template v-slot:[name])
      html = html.replace(/v-slot="(.*?)"/g, "v-slot:$1");
      // Except slotProps, replace it back
      html = html.replace(/v-slot:slotProps/g, 'v-slot="slotProps"');
      // Replace 'v-slot:(*)="v-slot:(*)"' with 'v-slot:(*)'
      html = html.replace(/v-slot:([^\s]+)="v-slot:\1"/g, 'v-slot:$1');
      //
      html = html.replace(/v-slot="slotProps"="v-slot="slotProps""/g, 'v-slot="slotProps"');
      return html;
    } catch (ex: any) {}
    const url = `/pug`;
    const item = await (await fetch(url, { method: "post", body: pug })).text();
    return item;
  }

  async updateComponent(comp: any) {
    if (!isDevEnv) return;
    const url = `/component/update`;
    await fetch(url, { method: "post", body: JSON.stringify(comp) });
  }

  private static async fetchAgain(args: any[], attempt = 10, msg?: any): Promise<any> {
    const delay = 1000;
    const url = args[0];
    try
    {
      const result = await ClientContext.__fetch(...args);
      return result;
    }
    catch (ex: any)
    {
      if (attempt <= 0) {
        ClientContext.alertify.error(`<h3>Error fetching</h3><div>${url}</div>`).delay(0);
        throw ex;
      }
      let err = ex.message;
      if (err == "signal is aborted without reason") err = `Request timed out`;
      const msg = ClientContext.alertify.warning(`<h3>⏳ Retrying</h3><p>${err}</p><p>${url}</p>`);
      await (delay).wait();
      return await ClientContext.fetchAgain(args, attempt - 1, msg);
    }
    finally
    {
      msg?.dismiss();
    }
  }

  private static async fetch(...args: any[]): Promise<any> {
    return await ClientContext.fetchAgain(args);
  }

  private static async __fetch(...args: any[]) {
    const msg = Ticker.alertify((elapsed) => `<div>🌐 <span>${elapsed.unitifyTime()}</span> <span class="dimmed">${args[0]}</span></div>`) as any;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      args = [...args];
      if (args.length < 2) args.push({});
      args[1].signal = controller.signal;
      if (!args[1]?.credentials) args[1].credentials = "include";
      const result = await ClientContext._fetch(...args);
      if (result.status < 500) return result;
      const text = await result.text();
      throw new Error(text);
    } catch (ex: any) {
      if (ex.message.includes("You are not authorized")) {
        ClientContext.alertify.error(`<h3>${ex.message}</h3>`);
        return;
      }
      throw ex;
    }
    finally {
      msg?.dismiss();
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

ClientContext.initialize();

export { ClientContext };
