import { Queue } from "../../../Shared/Queue";
import { ClientContext } from "./ClientContext";

interface StateChange {
  id: number;
  dt: number;
  uid: number;
  compName: string;
  type: string;
  key: string;
  newValue: any;
  oldValue: any;
}

class StateTracker {
  private static nextID: number = 1;
  private static maxItems: number = 100;
  private isTrackingMethods: boolean = false;
  private isPaused: boolean = false;

  items: StateChange[];

  methods: any = {
    pause: {},
  };

  private constructor(
    private uid: number,
    private compName: string,
    private client: ClientContext
  ) {
    this.items = client.Vue.observable([]);
  }

  static new(uid: number, compName: string, client: ClientContext) {
    const st = new StateTracker(uid, compName, client);
    return st;
  }

  log(type: string, key: string, newValue: any, oldValue: any) {
    if (this.isPaused) return;

    const isState = type == "p" || type == "d";
    const isMethod = type == "m";

    // Create an initial empty item
    if (isState && !oldValue) {
      const prevItemOfThisKey = [...this.items]
        .reverse()
        .find((item) => item.key == key);
      if (!prevItemOfThisKey) {
        this.items.push({
          id: StateTracker.nextID++,
          dt: Date.now(),
          uid: this.uid,
          compName: this.compName,
          type: type,
          key,
          newValue: oldValue,
          oldValue: oldValue,
        } as StateChange);
      }
    }

    const item = {
      id: StateTracker.nextID++,
      dt: Date.now(),
      uid: this.uid,
      compName: this.compName,
      type: type,
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
    const timePassed = newItem.dt - prevItem.dt;
    if (timePassed > 1000) return false;
    if (newItem.type != "p" && newItem.type != "d") return false;
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

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  clear() {
    this.items.clear();
  }
}

export { StateTracker };
