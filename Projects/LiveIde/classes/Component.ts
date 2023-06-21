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
      const vueOptions = eval(`(${json})`);
      console.log(vueOptions);
      const vueName = Component.toVueName(this.name);
      if (this.source.template) {
        vueOptions.template = this.source.template;
      } else {
        this.source.template = vueOptions.template = await client.pugToHtml(
          vueOptions.template
        );
        client.updateComponent(this);
      }
      this.source.template = vueOptions.template;
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
