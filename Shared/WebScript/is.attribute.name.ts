export default (componentNames: string[], name: string) => {
  const vueAttributes = [
    "v-if",
    "v-else-if",
    "v-else",
    "v-for",
    "v-on",
    "v-bind",
    "v-model",
    "v-show",
    "v-pre",
    "v-cloak",
    "v-once",
  ];
  if (vueAttributes.includes(name)) return true;
  const vuetifyComponents = [
    "v-app",
    "v-main",
    "v-container",
    "v-row",
    "v-col",
    "v-spacer",
    "v-layout",
    "v-flex",
    "v-img",
    "v-card",
    "v-card-title",
    "v-card-subtitle",
    "v-card-text",
    "v-card-actions",
    "v-card-media",
    "v-card-header",
    "v-card-footer",
    "v-sheet",
    "v-toolbar",
    "v-toolbar-title",
    "v-toolbar-items",
    "v-toolbar-side-icon",
    "v-toolbar-items-group",
    "v-toolbar-item",
    "v-toolbar-divider",
    "v-app-bar",
    "v-app-bar-nav-icon",
    "v-app-bar-title",
    "v-app-bar-items",
    "v-app-bar-nav-icon",
    "v-progress-linear",
    "v-progress-circular",
  ];
  if (vuetifyComponents.includes(name)) return false;
  if (name.includes("@")) return true;
  if (name.includes(".")) return false;
  if (name.startsWith(":")) return true;
  if (name.includes("#")) return false;
  if (name.startsWith("template")) return false;
  if (name == "slot") return false;
  if (
    [
      "a",
      "style",
      ...[1, 2, 3, 4, 5, 6].map((i) => `h${i}`),
      "pre",
      "code",
      "p",
      "img",
      "video",
      "source",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "div",
      "span",
      "ul",
      "li",
      "label",
      "input",
      "button",
      "select",
      "option",
      "canvas",
      "textarea",
      "component",
      "transition",
      "keep.alive",
    ].includes(name)
  )
    return false;
  if (name.startsWith(".")) return false;
  if (componentNames.find((c) => c == name.replace(":", ""))) return false;
  return true;
};
