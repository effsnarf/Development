import { ClientContext } from "./ClientContext";

(String.prototype as any).kebabize = function () {
  let s = this.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  s = s.replace(/[^a-z0-9-]/g, "-");
  s = s.replace(/--+/g, "-");
  return s;
};

class Component {
  name: string;
  path: string;
  source: any;
  isCompiled: boolean;

  constructor(obj: any) {
    this.name = obj.name;
    this.path = obj.path;
    this.source = obj.source;
    this.isCompiled = false;
    if (this.source) this.source.name = this.name.replace(/\./g, "-");
  }

  async compile(mixins: any[] = []) {
    if (this.isCompiled) return;

    const logGroup = true;

    await ClientContext.waitUntilLoaded();
    const client = ClientContext.context!;

    if (logGroup) {
      console.groupCollapsed(`📦`, this.name);
      console.log(this);
    } else {
      console.log(`📦`, this.name);
    }

    try {
      const vueOptions = await this.getVueOptions();
      const compMixins = mixins.filter((m: any) => m.matchComp(this));
      vueOptions.mixins = [...(vueOptions.mixins || []), ...compMixins];

      if (logGroup) console.log(vueOptions);
      const vueName = Component.toVueName(this.name);
      if (this.source) {
        const pug = vueOptions.template;
        let html = (await client.pugToHtml(pug)) || "";
        html = html.replace(/\bon_/g, "@");
        vueOptions.template = html;
        this.source.template = html;
      }
      client.Vue.component(vueName, vueOptions);
      this.isCompiled = true;
    } catch (ex) {
      throw ex;
    } finally {
      if (logGroup) console.groupEnd();
    }
  }

  async getVueOptions() {
    await ClientContext.waitUntilLoaded();
    const client = ClientContext.context!;
    let json = client.Handlebars.compile(client.templates.vue)(this.source);
    try {
      const vueOptions = eval(`(${json})`);
      return vueOptions;
    } catch (ex) {
      debugger;
      throw ex;
    }
  }

  private static toVueName(name: string) {
    return (name as any).kebabize().replace(/base-/g, "");
  }
}

export { Component };
