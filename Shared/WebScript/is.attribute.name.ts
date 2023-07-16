export default (componentNames: string[], name: string) => {
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
