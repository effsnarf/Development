import toTemplate from "../../../../Shared/WebScript/to.template";
import { Component } from "../../classes/Component";

(String.prototype as any).kebabize = function () {
  return this.replace(/\./g, "-").toLowerCase();
};

const toVueName = (name: string) => {
  return (name as any).kebabize().replace(/base-/g, "");
};

const Vue = (window as any).Vue;

(async () => {
  const Handlebars = (window as any).Handlebars;
  const vueTemplate = await (await fetch(`/vue.client.template.hbs`)).text();
  const styleTemplate = await (await fetch(`/style.template.hbs`)).text();
  const helpers = (await (await fetch(`/handlebars.helpers.yaml`)).json())
    .helpers;

  const pugToHtml = async (pug: string) => {
    const url = `/pug`;
    return await (await fetch(url, { method: "post", body: pug })).text();
  };

  const context = {
    helpers,
    isAttributeName: (name: string) =>
      isAttributeName(
        comps.map((c) => c.name),
        name
      ),
    includeAttribute: (name: string) => {
      return true;
    },
    postProcessAttribute: (attr: any[]) => {
      attr = [...attr];
      attr[0] = attr[0].replace("on_", "@");
      return attr;
    },
    toTemplate: (...args: any[]) => {
      return (toTemplate as any).apply(null, args);
    },
  };

  for (const helper of Object.entries(helpers)) {
    const func = eval(
      (helper[1] as string).replace(/: any/g, "").replace(/: string/g, "")
    );
    Handlebars.registerHelper(helper[0], (...args: any[]) => {
      return func(context, ...args);
    });
  }

  const isAttributeName = (componentNames: string[], name: string) => {
    if (name.startsWith(":")) return true;
    if (name.includes("#")) return false;
    if (name.startsWith("template")) return false;
    if (name == "slot") return false;
    if (
      [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "pre",
        "div",
        "span",
        "ul",
        "li",
        "component",
      ].includes(name)
    )
      return false;
    if (name.startsWith(".")) return false;
    if (componentNames.find((c) => c == name.replace(":", ""))) return false;
    return true;
  };

  const compileComp = async (comp: Component) => {
    console.groupCollapsed(comp.name);
    console.log(comp);
    let json = Handlebars.compile(vueTemplate)(comp.source);
    const vueOptions = eval(`(${json})`);
    console.log(vueOptions);
    const vueName = toVueName(comp.name);
    vueOptions.template = await pugToHtml(vueOptions.template);
    Vue.component(vueName, vueOptions);
    console.groupEnd();
  };

  const comps = (await (await fetch("/components")).json()).map(
    (c: any) => new Component(c)
  ) as Component[];

  for (const comp of comps) {
    await compileComp(comp);
  }

  const ideVueApp = new Vue({
    el: "#app",
    data: {
      comps: Vue.ref(comps),
      vueApp: Vue.ref(null),
      templates: {
        style: styleTemplate,
      },
    },
  });

  ideVueApp.vueApp = () => ideVueApp;

  (window as any).ideVueApp = ideVueApp;
})();
