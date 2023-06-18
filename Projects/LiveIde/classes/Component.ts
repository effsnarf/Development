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
    const vueOptions = eval(`(${json})`);
    console.log(vueOptions);
    const vueName = Component.toVueName(this.name);
    vueOptions.template = await client.pugToHtml(vueOptions.template);
    client.Vue.component(vueName, vueOptions);
    console.groupEnd();
  }

  private static toVueName(name: string) {
    return (name as any).kebabize().replace(/base-/g, "");
  }
}

export { Component };
