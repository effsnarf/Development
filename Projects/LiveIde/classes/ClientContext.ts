import { Lock } from "../../../Shared/Lock";
import toTemplate from "../../../Shared/WebScript/to.template";
import { Component } from "./Component";
import { ComponentManager } from "./ComponentManager";
import { ClientDatabase } from "./ClientDatabase";

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

    this.helpers = (
      await (await fetch(`/handlebars.helpers.yaml`)).json()
    ).helpers;
    this.templates = {} as any;
    this.templates.vue = await (await fetch(`/vue.client.template.hbs`)).text();
    this.templates.style = await (await fetch(`/style.template.hbs`)).text();

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

    for (const helper of Object.entries(this.helpers)) {
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
    if (name.startsWith(":")) return true;
    if (name.includes("#")) return false;
    if (name.startsWith("template")) return false;
    if (name == "slot") return false;
    if (
      [
        "style",
        ...[1, 2, 3, 4, 5, 6].map((i) => `h${i}`),
        "pre",
        "div",
        "span",
        "ul",
        "li",
        "input",
        "textarea",
        "component",
      ].includes(name)
    )
      return false;
    if (name.startsWith(".")) return false;
    if (componentNames.find((c) => c == name.replace(":", ""))) return false;
    return true;
  }

  async pugToHtml(pug: string) {
    const url = `/pug`;
    return await (await fetch(url, { method: "post", body: pug })).text();
  }

  async updateComponent(comp: any) {
    const url = `/component/update`;
    await fetch(url, { method: "post", body: JSON.stringify(comp) });
  }

  private static async fetch(...args: any[]) {
    try {
      const result = await ClientContext._fetch(...args);
      if (result.status < 500) return result;
      const text = await result.text();
      throw new Error(text);
    } catch (ex: any) {
      const url = args[0];
      ClientContext.alertify
        .error(`<h3>${ex.message}</h3><pre>${url}</pre>`)
        .delay(0);
      throw ex;
    }
  }

  static get alertify() {
    return (window as any).alertify;
  }

  get alertify() {
    return ClientContext.alertify;
  }
}

export { ClientContext };
