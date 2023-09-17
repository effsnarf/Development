import { Component } from "./Component";

const Vue = (window as any).Vue;

type HtmlJson = {
  cid: number;
  tag: string;
  attributes?: { [key: string]: string };
  children?: HtmlJson[];
  path: number[];
};

class VueHelper {
  private static cid = 1;

  static toIdeComponent(vue: any, comp: any) {
    if (!vue) return null;
    if (!comp) return null;
    const compName = vue.$options._componentTag;
    if (!compName) return null;
    const vueComp = Vue.component(vue.$options._componentTag);

    const ideComp = {} as any;

    ideComp.uid = vue._uid;
    ideComp.name = compName;
    ideComp.source = {
      dom: VueHelper.htmlToJson(vueComp.options.template),
      methods: Object.entries(comp?.source?.methods || {}).map(
        ([key, value]) => ({
          name: key,
          code: value,
        })
      ),
    };

    return ideComp;
  }

  private static htmlToJson(htmlString: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    function walk(node: ChildNode, path: number[]): HtmlJson {
      const cid = VueHelper.cid++;

      if (node.nodeName === "#text") {
        return { cid, tag: node.textContent || "", path };
      }

      let element = node as Element;
      let tag = element.tagName.toLowerCase();

      // Handling multiple divs
      let siblings = Array.from(node.parentNode!.childNodes).filter(
        (n) => n.nodeName === node.nodeName
      );
      let siblingIndex = siblings.indexOf(node as ChildNode);
      if (siblings.length > 1) {
        tag += `#${siblingIndex + 1}`;
      }

      // Adding attributes to the JSON object
      let attributes: { [key: string]: string } = {};
      for (let i = 0; i < element.attributes.length; i++) {
        let attr = element.attributes[i];
        attributes[`${attr.name}`] = attr.value;
      }

      // Walking through child nodes
      let children: HtmlJson[] = [];
      for (let i = 0; i < Array.from(node.childNodes).length; i++) {
        let child = node.childNodes[i] as ChildNode;
        let childObj = walk(child, [...path, i]);
        if (childObj.tag !== "") {
          children.push(childObj);
        }
      }

      let result: HtmlJson = { cid, tag, path };
      if (Object.keys(attributes).length > 0) {
        result.attributes = attributes;
      }
      if (children.length > 0) {
        result.children = children;
      }
      return result;
    }

    return walk(doc.body.firstChild! as ChildNode, []);
  }

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
