import { Objects } from "../Extensions.Objects.Client";

export default (context: any, compName: string, dom: any) => {
  compName = compName.replace(/-/g, ".");

  dom = Objects.json.parse(JSON.stringify(dom));

  const root = Object.values(dom)[0];

  // Traverse the tree and for each object node (not attribute), add a path attribute
  Objects.traverse(
    root,
    (node, key, value, path) => {
      if (value && typeof value == "object") {
        const paths = (value.paths || "").split("|").filter((p: string) => p);
        if (paths.some((p: string) => p.startsWith(compName))) return;
        paths.push(`${compName.hashCode()}.${path.join(".")}`);
        value.path = paths.join("|");
      }
    },
    // In WebScript, attributes are on the same level as nodes
    // for human readability, although formally this is not correct
    // We only want to traverse the nodes, not the attributes
    (n: any, key: string) => !context.isAttributeName(key)
  );

  return dom;
};
