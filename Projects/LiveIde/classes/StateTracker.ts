import "../../../Shared/Extensions";
import { Objects } from "../../../Shared/Extensions.Objects.Client";
import { ClientContext } from "./ClientContext";
import { VueHelper } from "./VueHelper";
import { VueManager } from "./VueManager";

interface StateChange {
  id: number;
  dt: number;
  uid: number;
  vuePath: [];
  type: string;
  key: string;
  newValue: any;
  oldValue: any;
}

class StateTracker {
  private static _nextID: number = 1;
  private static _maxItems: number = 100;
  private isPaused: number = 0;

  refChanges = new Map<string, StateChange[]>();

  methods: any = {
    pause: {},
  };

  private constructor(
    private getApp: () => any,
    private vm: VueManager,
    private client: ClientContext
  ) {}

  static new(app: any, vueManager: VueManager, client: ClientContext) {
    const st = new StateTracker(app, vueManager, client);
    return st;
  }

  track(vue: any, type: string, key: string, newValue: any, oldValue: any) {
    if (this.isPaused) return;

    const comp = this.getApp().getComponent(vue._uid);

    if (!comp) return;

    //if (!comp.source.config?.track?.state) return;

    const isEvent = type == "e";

    newValue = isEvent ? newValue : Objects.clone(newValue);
    oldValue = isEvent ? oldValue : Objects.clone(oldValue);

    const item = {
      id: StateTracker._nextID++,
      dt: Date.now(),
      uid: vue._uid,
      type,
      key,
      newValue,
      oldValue,
    } as StateChange;

    this.addItem(item);
  }

  async apply(uid: number, change: StateChange) {
    this.pause();
    const vue = this.vm.getVue(uid);
    vue[change.key] = change.newValue;
    await vue.$nextTick();
    this.resume();
  }

  // Sometimes when refreshing keys in the app, the vue components are recreated
  // and lose their state.
  // This method restores the state from the state tracker.
  async restoreState() {
    this.pause();

    const refKeys = this.vm.getRefKeys();

    const vuesByRef = VueHelper.getVuesByRef(this.getApp());

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

    this.vm.updateDataVariableUIDs(this.getApp());

    await this.getApp().$nextTick();

    this.resume();
  }

  private addItem(item: StateChange) {
    const isState = item.type == "p" || item.type == "d";
    const isMethod = item.type == "m";

    const vueItems = this.getRefChanges(item.uid);

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
        this.addItem(emptyItem);
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

    this.getRefChanges(item.uid).push(item);

    if (vueItems.length > StateTracker._maxItems) vueItems.shift();

    this.getApp().$emit("state-changed", item);
  }

  private isGroupable(newItem: StateChange, prevItem: StateChange) {
    const timePassed = newItem.dt - prevItem.dt;
    if (timePassed > 1000) return false;
    if (newItem.type != "p" && newItem.type != "d") return false;
    if (!prevItem.newValue && !prevItem.oldValue) return false;
    if (newItem.key != prevItem.key) return false;
    return true;
  }

  private getRefChanges(refKeyOrUID: string | number) {
    const refKey =
      typeof refKeyOrUID == "string"
        ? refKeyOrUID
        : this.vm.getRefKey(refKeyOrUID);

    if (!refKey) return [];
    if (!this.refChanges.has(refKey)) {
      this.refChanges.set(refKey, []);
      console.log("new ref", refKey);
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

export { StateTracker };
