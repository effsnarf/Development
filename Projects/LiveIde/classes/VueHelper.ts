import { Component } from "./Component";

const Vue = (window as any).Vue;

type HtmlJson = {
  tag: string;
  attributes?: { [key: string]: string };
  children?: HtmlJson[];
};

class VueHelper {
  static toIdeComponent(vue: any) {
    if (!vue) return null;
    const compName = vue.$options._componentTag;
    if (!compName) return null;
    const vueComp = Vue.component(vue.$options._componentTag);
    const comp = {} as Component;
    comp.name = compName;
    comp.source = {
      dom: VueHelper.htmlToJson(vueComp.options.template),
    };
    return comp;
  }

  private static htmlToJson(htmlString: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    function walk(node: ChildNode): HtmlJson {
      if (node.nodeName === "#text") {
        return { tag: node.textContent || "" };
      }

      let element = node as Element;
      let tag = element.tagName.toLowerCase();

      // Handling multiple divs
      let siblings = Array.from(node.parentNode!.childNodes).filter(
        (n) => n.nodeName === node.nodeName
      );
      if (siblings.length > 1) {
        tag += `#${siblings.indexOf(node as ChildNode) + 1}`;
      }

      // Adding attributes to the JSON object
      let attributes: { [key: string]: string } = {};
      for (let i = 0; i < element.attributes.length; i++) {
        let attr = element.attributes[i];
        attributes[`${attr.name}`] = attr.value;
      }

      // Walking through child nodes
      let children: HtmlJson[] = [];
      for (let child of Array.from(node.childNodes)) {
        let childObj = walk(child as ChildNode);
        if (childObj.tag !== "") {
          children.push(childObj);
        }
      }

      let result: HtmlJson = { tag };
      if (Object.keys(attributes).length > 0) {
        result.attributes = attributes;
      }
      if (children.length > 0) {
        result.children = children;
      }
      return result;
    }

    return walk(doc.body.firstChild! as ChildNode);
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
