import "../../../Shared/Extensions";
import { Objects } from "../../../Shared/Extensions.Objects.Client";
import { ClientContext } from "./ClientContext";
import { VueHelper } from "./VueHelper";
import { VueManager } from "./VueManager";

enum StateValueType {
  Cloned,
  // Some values cannot be cloned (Vue components, etc.)
  // We save them as () => value
  Pointer = "p",
}

interface StateChange {
  id: number;
  dt: number;
  uid: number;
  vueCompName: string;
  vuePath: [];
  type: string;
  key: string;
  args: any[];
  newValue: StateValue;
  oldValue: StateValue;
  delta: StateValue;
}

class StateValue {
  private type!: StateValueType;
  private _value: any;

  private constructor(value: any) {
    if (value == window) throw new Error("Cannot clone window");
    const storeAsPointer = () => {
      this._value = () => value;
      this.type = StateValueType.Pointer;
    };
    if (!Objects.isClonable(value)) {
      storeAsPointer();
      return;
    }
    try {
      this._value = Objects.clone(value);
      this.type = StateValueType.Cloned;
    } catch (ex) {
      storeAsPointer();
    }
  }

  static from(value: any) {
    if (value instanceof StateValue) return value;
    return new StateValue(value);
  }

  getDelta(oldValue: StateValue) {
    if (
      this.type == StateValueType.Pointer ||
      oldValue.type == StateValueType.Pointer
    ) {
      return StateValue.from(this.value);
    }

    try {
      const delta = Objects.subtract(this.value, oldValue.value);
      return StateValue.from(delta);
    } catch (ex) {
      return StateValue.from(this.value);
    }
  }

  get value() {
    if (this.type == StateValueType.Cloned) return this._value;
    return this._value();
  }
}

class StateTracker {
  private static _nextID: number = 1;
  private static _maxChangesPerVue: number = 100;
  private isPaused: number = 0;

  refChanges = new Map<string, StateChange[]>();
  changes = new Map<number, StateChange[]>();

  methods: any = {
    pause: {},
  };

  private constructor(private vm: VueManager, private client: ClientContext) {}

  static new(vueManager: VueManager, client: ClientContext) {
    const st = new StateTracker(vueManager, client);
    return st;
  }

  track(
    vue: any,
    type: string,
    key: string,
    newValue: any,
    oldValue: any,
    args: any[]
  ) {
    if (this.isPaused) return;
    if (!this.isKeyTrackable(key)) return;
    if (!this.isTrackable(newValue)) return;
    if (!this.isTrackable(oldValue)) return;

    try {
      const isEvent = type == "e";

      const newStateValue = StateValue.from(newValue);
      const oldStateValue = StateValue.from(oldValue);

      const change = {
        id: StateTracker._nextID++,
        dt: Date.now(),
        uid: vue._uid,
        vueCompName: vue.$options.name,
        type,
        key,
        args,
        newValue: newStateValue,
        oldValue: oldStateValue,
        delta: newStateValue.getDelta(oldStateValue),
      } as StateChange;

      this.addChange(change);

      return change;
    } catch (ex) {
      console.warn(
        `Error tracking state change for ${vue.$options_componentTag}.${key}`
      );
      console.warn(ex);
    }
  }

  isKeyTrackable(key: string) {
    if (["$asyncComputed", "_asyncComputed"].includes(key)) return false;
    return true;
  }

  isTrackable(value: any): boolean {
    if (!value) return true;
    if (Array.isArray(value)) return value.all(this.isTrackable.bind(this));
    // HTML elements are not trackable
    if (value instanceof HTMLElement) return false;
    // Functions are not trackable
    if (typeof value == "function") return false;
    return true;
  }

  async apply(uid: number, change: StateChange) {
    if (change.type != "d") return;
    this.pause();
    const vue = this.vm.getVue(uid);
    vue[change.key] = change.newValue.value;
    await vue.$nextTick();
    this.resume();
  }

  // Sometimes when refreshing keys in the app, the vue components are recreated
  // and lose their state.
  // This method restores the state from the state tracker.
  async restoreState() {
    return;
    throw new Error("Not implemented");

    const app = null as any;

    this.pause();

    const refKeys = this.vm.getRefKeys();

    const vuesByRef = VueHelper.getVuesByRef(app);

    for (const refKey of refKeys) {
      const vues = vuesByRef.get(refKey) || [];
      console.group(refKey);
      const vueChanges = this.getRefChanges(refKey);
      // For all vues that have this ref
      for (const vue of vues) {
        // Find the last change for each key
        const lastChanges = vueChanges.reduce((acc, cur) => {
          acc[cur.key] = cur;
          return acc;
        }, {} as any);
        // Apply the last change for each key
        for (const key in lastChanges) {
          const change = lastChanges[key];
          if (change.type != "d") continue;
          console.log(key, change.newValue);
          vue.$set(vue, key, change.newValue);
        }
      }
      console.groupEnd();
    }

    this.vm.updateDataVariableUIDs(app);

    await app.$nextTick();

    this.resume();
  }

  private addChange(item: StateChange) {
    const isState = item.type == "p" || item.type == "d";
    const isMethod = item.type == "m";

    const vueItems = this.getVueChanges(item.uid);

    // Create an initial empty item
    if (isState && item.newValue && !item.oldValue) {
      const prevItemOfThisKey = [...vueItems]
        .reverse()
        .find((existingItem) => existingItem.key == item.key);
      if (!prevItemOfThisKey) {
        const emptyItem = Objects.json.parse(
          JSON.stringify(item)
        ) as StateChange;
        emptyItem.id = StateTracker._nextID++;
        emptyItem.dt = Date.now();
        emptyItem.newValue = emptyItem.oldValue;
        this.addChange(emptyItem);
      }
    }

    // Group typing changes into one item
    if (vueItems.length) {
      const lastItem = vueItems.last();
      if (this.isGroupable(item, lastItem)) {
        item.oldValue = lastItem.oldValue;
        vueItems.pop();
      }
    }

    vueItems.push(item);

    if (vueItems.length > StateTracker._maxChangesPerVue) vueItems.shift();
  }

  private isGroupable(newItem: StateChange, prevItem: StateChange) {
    const timePassed = newItem.dt - prevItem.dt;
    if (timePassed > 1000) return false;
    if (newItem.type != "p" && newItem.type != "d") return false;
    if (!prevItem.newValue && !prevItem.oldValue) return false;
    if (newItem.key != prevItem.key) return false;
    return true;
  }

  private getVueChanges(uid: number) {
    if (!this.changes.has(uid)) {
      this.changes.set(uid, []);
    }
    return this.changes.get(uid) || [];
  }

  private getRefChanges(refKeyOrUID: string | number) {
    const refKey =
      typeof refKeyOrUID == "string"
        ? refKeyOrUID
        : this.vm.getRefKey(refKeyOrUID);

    if (!refKey) return [];
    if (!this.refChanges.has(refKey)) {
      this.refChanges.set(refKey, []);
    }
    return this.refChanges.get(refKey) || [];
  }

  pause() {
    this.isPaused++;
  }

  resume() {
    this.isPaused--;
  }

  clear() {
    this.refChanges.clear();
  }
}

export { StateTracker, StateValue };
