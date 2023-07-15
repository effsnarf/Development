// Actionable class
// Provides utility methods to enable undo/redo functionality

import { Action, Doable, IconAndName } from "~/code/action-stack/action-stack";

abstract class Actionable {
  public moduleName!: string;

  constructor() {}

  // Accepts a partially filled action object and fills the missing details
  // that includes the module name/icon, the method name/icon, etc.
  //
  // Example:
  //
  //   return this.action({
  //     redo: { result: newValue },
  //     undo: [`set`, [oldValue]],
  //   });
  //
  protected action(action: any): Action {
    return this.fixAction(action);
  }

  // Accepts a partially filled action object and fills the missing details
  // that includes the module name/icon, the method name/icon, etc.
  private fixAction(action: any): Action {
    action.undo = action.undo || {};
    action.redo = action.redo || {};
    action.undo = this.fixDoable(action.undo);
    action.redo = this.fixDoable(action.redo);

    // Some libraries proxify objects, causing updates of unrelated action entries in the action stack
    // To avoid this, we clone the action item object, to be built out of primitives
    action = Objects.json.parse(JSON.stringify(action));

    return action;
  }

  // Accepts a partially filled doable object and fills the missing details
  // that includes the module name/icon, the method name/icon, etc.
  private fixDoable(doable: any): Doable {
    // In case of [methodName, [args]], convert it to { method: {}, args: [] }
    if (Array.isArray(doable)) {
      doable = {
        method: this.getMethod(doable[0], doable[1]),
        args: doable[2],
        result: doable[3],
      };
    }

    doable.module = doable.module || this.getModule();

    doable.method =
      doable.method || this.getMethod(doable.method?.icon, doable.method?.name);

    doable.args = doable.args || [];

    doable.ts = doable.ts || {};

    return doable;
  }

  private getModule(): IconAndName {
    return {
      icon: this.getModuleIcon(this),
      name: this.moduleName,
    };
  }

  private getMethod(icon: string, name: string): IconAndName {
    return {
      icon: icon,
      name: name,
    };
  }

  private getModuleIcon(module: any): string {
    let proto = module;
    while (proto) {
      if (proto.icon) {
        return proto.icon;
      }
      proto = Object.getPrototypeOf(proto);
    }
    // If not found, return the default icon
    return `🔘`;
  }
}

export { Actionable };
