import { Lock } from "../../../Shared/Lock";
import { DataWatcher } from "../../../Shared/DataWatcher";
import { Component } from "./Component";
import { ClientContext } from "./ClientContext";

class ComponentManager {
  // #region Globals
  static async get() {
    const lock = ((window as any)._componentManagerLock ||
      ((window as any)._componentManagerLock = new Lock())) as Lock;
    await lock.acquire();
    try {
      return ((window as any)._componentManager ||
        ((window as any)._componentManager =
          await ComponentManager.new())) as ComponentManager;
    } finally {
      lock.release();
    }
  }
  // #endregion

  comps: Component[] = [];
  watchers: DataWatcher[] = [];

  private constructor() {}

  private static async new() {
    const manager = new ComponentManager();
    await manager.init();
    return manager;
  }

  async init() {
    this.comps = (await (await fetch("/components")).json()).map(
      (c: any) => new Component(c)
    ) as Component[];

    const watchers = await Promise.all(
      this.comps.map((c) =>
        DataWatcher.new(() => c, this.onComponentChanged.bind(this))
      )
    );

    this.watchers.push(...watchers);

    this.saveModifiedItems();
  }

  private async saveModifiedItems() {
    const client = await ClientContext.get();

    // Item needs to be not modified for this time to be saved
    // This is to throtte typing etc
    // This can be a bit longer time because we're saving the changed in IndexedDB
    // So if the user closes the browser, the changes will be saved next time
    const delay = 1000 * 1;

    let modifiedItem: any;
    while (
      (modifiedItem = await client.db.find(
        "ModifiedItems",
        (item) => item.modifiedAt > Date.now() - delay
      ))
    ) {
      await client.db.delete("ModifiedItems", modifiedItem.key);
      await client.updateComponent(modifiedItem.item);
    }

    setTimeout(this.saveModifiedItems.bind(this), 400);
  }

  async onComponentChanged(newComp: Component) {
    const client = await ClientContext.get();

    client.db.upsert("ModifiedItems", {
      key: newComp.name,
      modifiedAt: Date.now(),
      item: newComp,
    });
  }
}

export { ComponentManager };
