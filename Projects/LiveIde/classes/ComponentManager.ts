import { Component } from "./Component";

class ComponentManager {
  private static instance: ComponentManager;

  static async get() {
    if (!ComponentManager.instance) {
      ComponentManager.instance = await ComponentManager.new();
    }
    return ComponentManager.instance;
  }

  comps: Component[] = [];

  private constructor() {}

  static async new() {
    const manager = new ComponentManager();
    await manager.init();
    return manager;
  }

  async init() {
    this.comps = (await (await fetch("/components")).json()).map(
      (c: any) => new Component(c)
    ) as Component[];
  }
}

export { ComponentManager };
