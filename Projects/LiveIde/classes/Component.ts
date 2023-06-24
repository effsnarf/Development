import { ClientContext } from "./ClientContext";

(String.prototype as any).kebabize = function () {
  return this.replace(/\./g, "-").toLowerCase();
};

class Component {
  name: string;
  path: string;
  source: any;

  constructor(obj: any) {
    this.name = obj.name;
    this.path = obj.path;
    this.source = obj.source;
    if (this.source) this.source.name = this.name.replace(/\./g, "-");
  }

  async compile() {
    const client = await ClientContext.get();

    console.groupCollapsed(this.name);
    console.log(this);
    let json = client.Handlebars.compile(client.templates.vue)(this.source);
    try {
      //console.log(json);
      const vueOptions = eval(`(${json})`);
      console.log(vueOptions);
      const vueName = Component.toVueName(this.name);
      if (this.source) {
        if (this.source.template) {
          let html = this.source.template;
          html = html.replace(/on_/g, "@");
          vueOptions.template = html;
        } else {
          const pug = vueOptions.template;
          let html = (await client.pugToHtml(pug)) || "";
          html = html.replace(/on_/g, "@");
          vueOptions.template = html;
          this.source.template = html;
          client.updateComponent(this);
        }
      }
      client.Vue.component(vueName, vueOptions);
    } catch (ex) {
      debugger;
      throw ex;
    }
    console.groupEnd();
  }

  private static toVueName(name: string) {
    return (name as any).kebabize().replace(/base-/g, "");
  }
}

export { Component };
