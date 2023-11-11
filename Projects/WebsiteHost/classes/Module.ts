import "@shared/Extensions.Objects.Client";
import { ClientContext } from "./ClientContext";

class Module {
  name: string;
  path: string;
  source: any;
  className: string;

  constructor(obj: any) {
    this.name = obj.name;
    this.path = obj.path;
    this.source = obj.source;
    this.className = this.name.split(".").last();
    this.source.namespace = this.getNamespaceName(this.name);
    this.source.name = this.className;
  }

  async compile() {
    await ClientContext.waitUntilLoaded();
    const client = ClientContext.context!;

    const namespace = this.getNamespace();

    const moduleClass = await this.getModuleClass(client);

    const className = this.name.split(".").last();

    namespace[className] = moduleClass;
  }

  async getModuleClass(client: ClientContext) {
    let classCode = client.Handlebars.compile(client.templates.module)(
      this.source
    );
    const class1 = eval(`(${classCode})`);

    return class1;
  }

  getNamespace() {
    const parts = this.name.split(".");

    let nsnode = window as any;
    for (const part of parts.take(parts.length - 1)) {
      nsnode = nsnode[part] = nsnode[part] || {};
    }

    return nsnode;
  }

  getNamespaceName(name: string) {
    const parts = name.split(".");
    const ns = parts.take(parts.length - 1).join(".");
    if (!ns?.length) return "globalModule";
    return ns;
  }
}

export { Module };
