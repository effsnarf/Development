import addPaths from "./add.paths";

const isHTMLTag = (tag: string) => {
  tag = tag.toLowerCase();

  const htmlTags = [
    "a",
    "abbr",
    "address",
    "area",
    "article",
    "aside",
    "audio",
    "b",
    "base",
    "bdi",
    "bdo",
    "blockquote",
    "body",
    "br",
    "button",
    "canvas",
    "caption",
    "cite",
    "code",
    "col",
    "colgroup",
    "data",
    "datalist",
    "dd",
    "del",
    "details",
    "dfn",
    "dialog",
    "div",
    "dl",
    "dt",
    "em",
    "embed",
    "fieldset",
    "figcaption",
    "figure",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "head",
    "header",
    "hgroup",
    "hr",
    "html",
    "i",
    "iframe",
    "img",
    "input",
    "ins",
    "kbd",
    "keygen",
    "label",
    "legend",
    "li",
    "link",
    "main",
    "map",
    "mark",
    "menu",
    "menuitem",
    "meta",
    "meter",
    "nav",
    "noscript",
    "object",
    "ol",
    "optgroup",
    "option",
    "output",
    "p",
    "param",
    "picture",
    "pre",
    "progress",
    "q",
    "rp",
    "rt",
    "ruby",
    "s",
    "samp",
    "script",
    "section",
    "select",
    "small",
    "source",
    "span",
    "strong",
    "style",
    "sub",
    "summary",
    "sup",
    "svg",
    "table",
    "tbody",
    "td",
    "template",
    "textarea",
    "tfoot",
    "th",
    "thead",
    "time",
    "title",
    "tr",
    "track",
    "u",
    "ul",
    "var",
    "video",
    "wbr",
  ];

  return htmlTags.includes(tag);
};

export default (
  context: any,
  dom: any,
  indent?: number,
  compName?: string,
  compType?: string
) => {
  if (!dom) return [];

  const s = [] as string[];
  if (!indent) indent = 0;

  dom = JSON.parse(JSON.stringify(dom));

  const isAddPaths = compType != "sfc";

  if (compName && isAddPaths) {
    // Traverse the tree and for each object node (not attribute), add a path attribute
    dom = addPaths(context, compName, dom);
  }

  // Add the component name as a class to the root element
  if (!indent && compName) {
    const compClassName = `comp-${compName.replace(/\./g, "-")}`;
    const rootEntry = Object.entries(dom)[0];
    const rootKey = rootEntry[0];
    const root = (rootEntry[1] || {}) as any;
    root.class = [
      compClassName,
      ...(root.class || "").split(" ").filter((c: string) => c),
    ].join(" ");
    dom[rootKey] = root;
  }

  const stringToArray = (s: string) => {
    if (!s) return [];
    if (Array.isArray(s)) return s;
    return s.split(" ").filter((s: string) => s);
  };

  // If the dom is { div.opacity: {} }, then we want to render it as { div: { class: "opacity", ...{} } }
  for (const child of Object.entries(dom || {})) {
    const tag = child[0];
    if (!child[1]) continue;

    if (Array.isArray(dom[tag].class))
      dom[tag].class = dom[tag].class.join(" ");

    if (tag.startsWith(".")) {
      const parts = tag.split(".");
      const newTag = parts[0] || "div";
      const classNames = parts.slice(1);
      dom[newTag] = JSON.parse(JSON.stringify(dom[tag]));
      dom[newTag].class = [];
      dom[newTag].class.push(...stringToArray(dom[tag].class));
      dom[newTag].class.push(...classNames);
      dom[newTag].class = dom[newTag].class.join(" ");
      delete dom[tag];
    }
  }

  const toDomTag = (tag: string, compType?: string) => {
    if (compType == "sfc" && !isHTMLTag(tag)) {
      // For sfc we use CamelCase
      return tag
        .split(".")
        .map((s) => s.capitalize())
        .join("");
    }
    // For client side we use kebab-case
    return tag.replace(/\./g, "-");
  };

  const domNode = (tag: string, attrs: any, indent: number) => {
    // Remove #1, #2, etc. from class names
    if (attrs.class) {
      attrs.class = stringToArray(attrs.class)
        .map((c: string) => c.split("#")[0])
        .join(" ");
    }

    tag = toDomTag(tag, compType);
    const indentStr = "  ".repeat(indent);

    if (Object.keys(attrs).length == 0) return `${indentStr}${tag}`;

    return `${indentStr}${tag}(${(
      Object.entries(attrs)
        .map((a) => {
          return { key: a[0].split("#")[0], value: a[1] };
        })
        .filter((a) => a.value)
        .map((a: any) => {
          const valueStr = typeof a.value == "string" ? a.value : a.value;
          return `"${a.key}"="${valueStr}"`;
        }) as string[]
    ).join(", ")})`;
  };

  if (Array.isArray(dom)) {
    s.push(domNode("div", {}, indent));
    for (const child of dom) {
      s.push(...context.toTemplate(context, child, indent + 2, null, compType));
    }
    return s;
  }

  for (let child of Object.entries(dom || {})) {
    let tag = child[0];
    // For convenience and brevity, we use this syntax:
    //   div
    //   div
    // But this is not valid YAML, because duplicate keys
    // So we're using:
    //   div#1
    //   div#2
    // And later removing the #1, #2 from the tag
    if (tag.includes("#")) {
      tag = tag.split("#")[0];
    }
    if (!child[1]) {
      s.push(domNode(tag, {}, indent));
      continue;
    }
    if (typeof child[1] == "string") {
      const obj = {} as any;
      obj[":value"] = child[1];
      child = [tag, obj];
    }
    const attrs = Object.fromEntries(
      Object.entries(child[1] as any)
        .filter((a) => context.isAttributeName(a[0]))
        .map((a) => context.postProcessAttribute(a))
    );
    const children = Object.fromEntries(
      Object.entries(child[1] as any).filter(
        (a) => !context.isAttributeName(a[0])
      )
    );
    s.push(domNode(tag, attrs, indent));
    for (const child of Object.entries(children)) {
      let dom = {} as any;
      dom[child[0]] = child[1];
      s.push(...context.toTemplate(context, dom, indent + 1, null, compType));
    }
  }
  return s;
};
