import { ClientContext } from "./ClientContext";

const w = (window as any);

(String.prototype as any).kebabize = function () {
  return this.ize('-');
};

(String.prototype as any).underscorize = function () {
  return this.ize('_');
};

(String.prototype as any).ize = function (c: string) {
  let s = this.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  s = s.replace(/[^a-z0-9-]/g, c);
  s = s.replace(/--+/g, c);
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

    
    const logGroup = false;
    
    await ClientContext.waitUntilLoaded();
    const client = ClientContext.context!;

    if (logGroup) {
      console.groupCollapsed(`📦`, this.name);
      console.log(this);
    } else {
      //console.log(`📦`, this.name);
    }

    try {
      const vueName = Component.toVueName(this.name);
      const vueOptions = await this.getVueOptions(vueName);
      const compMixins = mixins.filter((m: any) => m.matchComp(this));
      vueOptions.mixins = [...(vueOptions.mixins || []), ...compMixins];

      if (logGroup) console.log(vueOptions);
      if (this.source) {
        const pug = vueOptions.template;
        let html = (await client.pugToHtml(pug)) || "";
        html = html.replace(/\bon_/g, "@");
        vueOptions.template = html;
        this.source.template = html;
      }
      w.Vue.component(vueName, vueOptions);
      this.isCompiled = true;
    } catch (ex) {
      throw ex;
    } finally {
      if (logGroup) console.groupEnd();
    }
  }

  async getVueOptions(name: string) {
    await ClientContext.waitUntilLoaded();
    const client = ClientContext.context!;
    let json = client.Handlebars.compile(client.templates.vue)(this.source);
    try {
      const vueOptions = eval(`(${json})`);
      vueOptions.name = name;
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
