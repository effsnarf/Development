import { ClientContext } from "./ClientContext";

(String.prototype as any).kebabize = function () {
  return this.toString()
    .replace(/\./g, " ")
    .replace(/\-/g, " ")
    .getCaseWords()
    .map((w: string) => w.toLowerCase())
    .join("-");
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

  async compile() {
    if (this.isCompiled) return;

    const logGroup = false;

    const client = await ClientContext.get();

    if (logGroup) {
      console.groupCollapsed(this.name);
      console.log(this);
    } else {
      console.log(this.name);
    }

    let json = client.Handlebars.compile(client.templates.vue)(this.source);

    try {
      //console.log(json);
      const vueOptions = eval(`(${json})`);
      if (logGroup) console.log(vueOptions);
      const vueName = Component.toVueName(this.name);
      if (this.source) {
        if (this.source.template) {
          let html = this.source.template;
          html = html.replace(/\bon_/g, "@");
          vueOptions.template = html;
        } else {
          const pug = vueOptions.template;
          let html = (await client.pugToHtml(pug)) || "";
          html = html.replace(/\bon_/g, "@");
          vueOptions.template = html;
          this.source.template = html;
          client.updateComponent(this);
        }
      }
      client.Vue.component(vueName, vueOptions);
      this.isCompiled = true;
    } catch (ex) {
      debugger;
      throw ex;
    } finally {
      if (logGroup) console.groupEnd();
    }
  }

  private static toVueName(name: string) {
    return (name as any).kebabize().replace(/base-/g, "");
  }
}

export { Component };
