import { Queue } from "../../../Shared/Queue";
import { ClientContext } from "./ClientContext";

interface StateChange {
  id: number;
  uid: number;
  key: string;
  newValue: any;
  oldValue: any;
}

class StateTracker {
  private static nextID: number = 1;
  private static maxItems: number = 100;

  items: StateChange[];

  private constructor(private uid: number, private client: ClientContext) {
    this.items = client.Vue.observable([]);
  }

  static new(uid: number, client: ClientContext) {
    const st = new StateTracker(uid, client);
    return st;
  }

  log(key: string, newValue: any, oldValue: any) {
    // Create an initial empty item
    if (!oldValue) {
      const prevItemOfThisKey = [...this.items]
        .reverse()
        .find((item) => item.key == key);
      if (!prevItemOfThisKey) {
        this.items.push({
          id: StateTracker.nextID++,
          uid: this.uid,
          key,
          newValue: oldValue,
          oldValue: oldValue,
        } as StateChange);
      }
    }

    const item = {
      id: StateTracker.nextID++,
      uid: this.uid,
      key,
      newValue,
      oldValue,
    } as StateChange;

    // Group typing changes into one item
    if (this.items.length) {
      const lastItem = this.items.last();
      if (this.isGroupable(item, lastItem)) {
        item.oldValue = lastItem.oldValue;
        this.items.pop();
      }
    }
    this.items.push(item);
    if (this.items.length > StateTracker.maxItems) this.items.shift();
  }

  private isGroupable(newItem: StateChange, prevItem: StateChange) {
    if (!prevItem.newValue && !prevItem.oldValue) return false;
    if (newItem.key != prevItem.key) return false;
    if (typeof newItem.newValue != "string") return false;
    if (typeof newItem.oldValue != "string") return false;
    if (Math.abs(newItem.newValue.length - newItem.oldValue.length) != 1)
      return false;
    const minLength = Math.min(
      newItem.newValue.length,
      newItem.oldValue.length
    );
    if (
      newItem.newValue.slice(0, minLength) !=
      newItem.oldValue.slice(0, minLength)
    )
      return false;
    return true;
  }

  clear() {
    this.items.clear();
  }
}

export { StateTracker };
