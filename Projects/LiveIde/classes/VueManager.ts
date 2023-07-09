import "../../../Shared/Extensions";
import { TwoWayMap } from "../../../Shared/TwoWayMap";
import { ClientContext } from "./ClientContext";
import { VueHelper } from "./VueHelper";

class VueManager {
  vues = {} as any;

  vuesCount = 0;

  // Tracking by uid or vue tree path are unreliable because vue recreates components
  // We use $refs to track components
  // Any ref that starts with a capital letter is a global reference
  private vueRefsToUIDs = new TwoWayMap<string, number>();

  private constructor(private client: ClientContext) {}

  static async new(client: ClientContext) {
    const vm = new VueManager(client);
    return vm;
  }

  /** Since vue UIDs might have changed, if anyone keeps a "..UID" reference
   *  (hoveredVueUID, selectedVueUID, etc) we update them.
   */
  updateDataVariableUIDs(vue: any) {
    VueHelper.traverseVue(vue, (vue: any) => {
      const keys = Object.keys(vue.$data).filter((k) => k.endsWith("UID"));
      for (const key of keys) {
        let uid = vue.$data[key];
        uid = this.toRecentVueUID(uid);
        vue.$data[key] = uid;
      }

      const arrayKeys = Object.keys(vue.$data).filter((k) =>
        k.endsWith("UIDs")
      );
      for (const key of arrayKeys) {
        let uids = vue.$data[key];
        uids = uids.map((uid: number) => this.toRecentVueUID(uid));
        vue.$data[key].clear();
        vue.$data[key].push(...uids);
      }
    });
  }

  getVue(uid: number) {
    if (uid == null || uid == undefined) return null;
    uid = this.toRecentVueUID(uid);
    const vue = this.vues[uid];
    if (!vue) return null;
    return vue();
  }

  // Vues are recreated occasionally
  // Because we're tracking refs, in some cases we can map from the old vue to the new vue
  private toRecentVueUID(uid: number) {
    const refKey = this.getRefKey(uid);
    if (!refKey) return uid;
    const newUIDs = this.vueRefsToUIDs.get(refKey);
    return newUIDs.last();
  }

  getComputedKeys(uid: number) {
    const vue = this.getVue(uid);
    if (!vue) return [];
    let keys = Object.keys(
      vue._computedWatchers || vue.$options._computedWatchers || {}
    );
    keys = keys.filter((k) => !k.startsWith("$"));
    keys = keys.sortBy((k) => k);
    return keys;
  }

  getFields(uid: number) {
    const vue = this.getVue(uid);
    if (!vue) return [];
    let fields = [] as any[];
    fields.push(
      ...Object.keys(vue.$data || {}).map((k) => {
        return { type: "d", key: k, newValue: vue.$data[k] };
      })
    );
    fields.push(
      ...Object.keys(vue.$props || {}).map((k) => {
        return { type: "p", key: k, newValue: vue.$props[k] };
      })
    );
    fields.push(
      ...this.getComputedKeys(uid).map((k) => {
        return { type: "c", key: k, newValue: vue[k] };
      })
    );
    fields = fields.filter((f) => !f.key.startsWith("_"));
    fields = fields.sortBy(
      (f) => f.type,
      (f) => f.key
    );
    return fields;
  }

  getRefKey(uid: number) {
    return this.vueRefsToUIDs.getReverse(uid)[0];
  }

  getRefKeys() {
    return this.vueRefsToUIDs.keys();
  }

  onVueMounted(vue: any) {
    this.vues[vue._uid] = () => vue;
    this.vuesCount++;

    const compName = vue.$data._.comp.name;
    //if (["e.", "ui."].some((prefix) => compName.startsWith(prefix))) return;
    for (const refKey of Object.keys(vue.$refs)) {
      if (refKey[0].isLowerCase()) continue;
      this.vueRefsToUIDs.set(refKey, vue.$refs[refKey]._uid);
    }
  }

  onVueUnmounted(vue: any) {
    delete this.vues[vue._uid];
    this.vuesCount--;

    for (const refKey of Object.keys(vue.$refs)) {
      if (refKey[0].isLowerCase()) continue;
      this.vueRefsToUIDs.delete(refKey);
    }
  }
}

export { VueManager };
