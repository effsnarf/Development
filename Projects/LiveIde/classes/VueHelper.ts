class VueHelper {
  static getVuesByRef(rootVue: any) {
    const map = new Map<string, any[]>();
    VueHelper.traverseVue(rootVue, (vue) => {
      for (const refKey in vue.$refs) {
        if (!map.has(refKey)) {
          map.set(refKey, []);
        }
        map.get(refKey)?.push(vue.$refs[refKey]);
      }
    });
    return map;
  }

  static traverseVue(vue: any, callback: (vue: any) => void) {
    callback(vue);
    if (vue.$children) {
      vue.$children.forEach((c: any) => VueHelper.traverseVue(c, callback));
    }
  }

  static getVuePath(vue: any) {
    const path = [] as any[];
    let currentVue = vue;
    while (currentVue) {
      const index = VueHelper.getVueChildIndex(currentVue);
      path.push(index);
      currentVue = currentVue.$parent;
    }
    return path.reverse();
  }

  static getVueChildIndex(vue: any) {
    const parent = vue.$parent;
    if (!parent) return null;
    const index = parent.$children.findIndex((c: any) => c._uid == vue._uid);
    return index;
  }
}

export { VueHelper };
