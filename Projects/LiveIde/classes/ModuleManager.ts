import "../../../Shared/Extensions";
import { ClientContext } from "./ClientContext";
import { Module } from "./Module";

class ModuleManager {
  modules: Module[] = [];

  private constructor() {}

  static async new() {
    const manager = new ModuleManager();
    await manager.init();
    return manager;
  }

  async init(options: any = {}) {
    await this.loadModules(options);
  }

  async compileModules() {
    for (const comp of this.modules) {
      await comp.compile();
    }
  }

  async loadModules(options: any = {}) {
    const url = options.onlyChanged ? "/changed/modules" : "/modules";
    if (window.location.hostname == "localhost") {
      const newComps = (await (await fetch(url)).json()).map(
        (m: any) => new Module(m)
      ) as Module[];
      for (const newComp of newComps) {
        const index = this.modules.findIndex((m) => m.name == newComp.name);
        if (index != -1) this.modules.removeAt(index);
      }
      this.modules.add(newComps);
    } else {
      this.modules = (window as any).components.map(
        (m: any) => new Module(m)
      ) as Module[];
    }

    this.modules = this.modules.sortBy((m) => m.name);
  }
}

export { ModuleManager };
