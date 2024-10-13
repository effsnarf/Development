import "../../../Shared/Extensions";
import { TwoWayMap } from "../../../Shared/TwoWayMap";
import { ClientContext } from "./ClientContext";
import { VueHelper } from "./VueHelper";
import { StateValue } from "./StateTracker";

class VueManager {
  vues = {} as any;

  vuesCount = 0;

  vuesCounts = {} as any;

  // Tracking by uid or vue tree path are unreliable because vue recreates components
  // We use $refs to track components
  // Any ref that starts with a capital letter is a global reference
  private vueRefsToUIDs = new TwoWayMap<string, number>();

  private constructor(private client: ClientContext) {}

  static new(client: ClientContext) {
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

  getAncestors(vue: any, filter: any, maxCount: number = 10000): any[] {
    if (typeof filter == "string") {
      const compName = filter;
      filter = (vue: any) => vue.$data._?.comp.name == compName;
    }
    const vues = [] as any[];
    while (vue.$parent && vues.length < maxCount) {
      vue = vue.$parent;
      if (filter(vue)) vues.push(vue);
    }
    return vues;
  }

  getDescendant(vue: any, filter: any): any {
    return this.getDescendants(vue, filter, 1)[0];
  }

  getDescendants(
    vue: any,
    filter: (vue: any) => boolean = (vue) => true,
    maxCount: number
  ): any[] {
    if (!vue) return [];
    if (typeof filter == "string") {
      const compName = filter;
      filter = (vue: any) => vue.$data._?.comp.name == compName;
    }
    if (typeof filter == "number") {
      const uid = filter;
      filter = (vue: any) => vue._uid == uid;
    }
    const vues = [] as any[];
    for (const child of vue.$children || []) {
      if (filter(child)) vues.push(child);
      if (vues.length >= maxCount) break;
      vues.push(...this.getDescendants(child, filter, maxCount));
      if (vues.length >= maxCount) break;
    }
    if (vues.length >= maxCount) vues.length = maxCount;
    return vues;
  }

  onAllEvents(
    vue: any,
    handler: (compName: string, emitName: string, args: any[]) => void
  ) {
    const compName = vue.$data._?.comp?.name;
    if (!compName) throw new Error("Only supported for comp vues");
    const emitNames = this.getEmitNames(vue);
    for (const emitName of emitNames) {
      vue.$on(emitName, (...args: any[]) => handler(compName, emitName, args));
    }
  }

  private getEmitNames(vue: any) {
    const compName = vue.$data._?.comp?.name;
    if (!compName) throw new Error("Only supported for comp vues");
    const comp = this.client.comps.find((c) => c.name == compName);
    if (!comp) throw new Error(`Comp not found: ${compName}`);
    const allMethods = {
      ...comp.source.methods,
      mounted: comp.source.mounted,
    };
    const methodsCode = Object.values(allMethods).join("\n");
    const emitsRegex = /this\.\$emit\("([^"]+)"(, .*)?\)/g;
    const emitNames = [...methodsCode.matchAll(emitsRegex)].map((m) => m[1]);
    return emitNames;
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
        return { type: "d", key: k, newValue: StateValue.from(vue.$data[k]) };
      })
    );
    fields.push(
      ...Object.keys(vue.$props || {}).map((k) => {
        return { type: "p", key: k, newValue: StateValue.from(vue.$props[k]) };
      })
    );
    fields.push(
      ...this.getComputedKeys(uid).map((k) => {
        return { type: "c", key: k, newValue: StateValue.from(vue[k]) };
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

  getVuesFromElement(el: HTMLElement): any[] {
    // Include ancestors
    const vues = [] as any[];
    let vue = this.getVueFromElement(el);
    while (vue) {
      vues.push(vue);
      vue = vue.$parent;
    }
    return vues;
  }

  getVueFromElement(el: HTMLElement) {
    const vue = this.getVueFromVnode(this.getVnodeFromElement(el));
    return vue;
  }

  getVnodeFromElement(el: HTMLElement): any {
    if (!el) return null;
    if ((el as any).__vue__) return (el as any).__vue__;
    if (!el.parentElement) return null;
    return this.getVnodeFromElement(el.parentElement);
  }

  getVueFromVnode(vnode: any): any {
    // Skip vnodes like <keep-alive>, <transition>, etc.
    if (!vnode) return null;
    if (this.vNodeIsVue(vnode)) return vnode;
    return this.getVueFromVnode(vnode.$parent);
  }

  vNodeIsVue(vnode: any) {
    if (
      [`transition`, `transition-group`, `keep-alive`].includes(
        vnode.$options._componentTag
      )
    )
      return false;
    return true;
  }

  registerVue(vue: any) {
    if (!vue) return;

    if (this.vues[vue._uid]) return;

    this.vues[vue._uid] = () => vue;
    const vueCompName = vue.$options._componentTag;
    this.vuesCounts[vueCompName] = (this.vuesCounts[vueCompName] || 0) + 1;
    this.vuesCount++;

    const compName = vue.$options._componentTag;
    if (["e-", "ui-"].some((prefix) => compName.startsWith(prefix))) return;

    for (const refKey of Object.keys(vue.$refs)) {
      if (refKey[0].isLowerCase()) continue;
      this.vueRefsToUIDs.set(refKey, vue.$refs[refKey]._uid);
    }

    console.log(
      `➕📦`, `(${this.vuesCounts[vueCompName].toLocaleString()})`, `${vue.$options._componentTag}`
    );
  }

  unregisterVue(vue: any) {
    if (!vue) return;

    delete this.vues[vue._uid];
    const vueCompName = vue.$options._componentTag;
    this.vuesCounts[vueCompName]--;
    this.vuesCount--;

    for (const refKey of Object.keys(vue.$refs)) {
      if (refKey[0].isLowerCase()) continue;
      this.vueRefsToUIDs.delete(refKey);
    }

    console.log(
      `➖📦`, `${vue.$options._componentTag}`
    );
  }
}

export { VueManager };
