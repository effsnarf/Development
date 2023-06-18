export default (context: any, dom: any, indent?: number, compName?: string) => {
  if (!dom) return [];

  const s = [] as string[];
  if (!indent) indent = 0;

  dom = JSON.parse(JSON.stringify(dom));

  // Add the component name as a class to the root element
  if (!indent && compName) {
    const compClassName = `comp-${compName}`;
    const rootEntry = Object.entries(dom)[0];
    const rootKey = rootEntry[0];
    const root = (rootEntry[1] || {}) as any;
    root.class = [
      compClassName,
      ...(root.class || "").split(" ").filter((c: string) => c),
    ].join(" ");
    dom[rootKey] = root;
  }

  // If the dom is { div.opacity: {} }, then we want to render it as { div: { class: "opacity", ...{} } }
  for (const child of Object.entries(dom || {})) {
    const tag = child[0];
    if (!child[1]) continue;
    if (tag.startsWith(".")) {
      const parts = tag.split(".");
      const newTag = parts[0] || "div";
      const classNames = parts.slice(1);
      dom[newTag] = dom[tag];
      dom[newTag].class = dom[newTag].class || [];
      dom[newTag].class.push(...classNames);
      dom[newTag].class = dom[newTag].class.join(" ");
      delete dom[tag];
    }
  }

  const domNode = (tag: string, attrs: any, indent: number) => {
    tag = tag.replace(/\./g, "-");
    const indentStr = "  ".repeat(indent);
    return `${indentStr}${tag}(${(
      Object.entries(attrs)
        .map((a) => {
          return { key: a[0], value: a[1] };
        })
        .filter((a) => a.value)
        .map((a: any) => `"${a.key}"="${a.value}"`) as string[]
    ).join(", ")})`;
  };

  if (Array.isArray(dom)) {
    s.push(domNode("div", {}, indent));
    for (const child of dom) {
      s.push(...context.toTemplate(context, child, indent + 2));
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
        .filter((a) => context.includeAttribute(a[0]))
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
      s.push(...context.toTemplate(context, dom, indent + 1));
    }
  }
  return s;
};
