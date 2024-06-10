import isAttributeName from "./is.attribute.name";

const preProcessYaml = (yaml: string) => {
  // Replace @ with on_
  yaml = yaml.replace(/(?<!\w)@/g, "on_");
  // Normalize line endings
  yaml = yaml.replace(/\r\n|\r/g, "\n");
  // Normalize indentation to spaces
  yaml = yaml.replace(/\t/g, "  ");
  // Remove #1, #2, etc from the end of keys (div#1: -> div:)
  // that may have been left from the previous step
  yaml = yaml.replace(/(\w+)#\d+:/g, "$1: ");
  // Find duplicate lines
  // example:
  //   div:
  //   div:
  // have the same indent and key, so we add #1, #2, etc to the end of the keys
  // Crop everything from "dom:\n" to the first line that starts with a letter
  let domSection =
    (yaml.match(/dom:\n([\s\S]*?)(?=\n[a-zA-Z])/m) || [])[0] || "";
  const afterDomSection = yaml.replace(domSection, "");
  const keyLines = [...yaml.matchAll(/^(\s+)[\w.]+:/gm)]
    .flatMap((a) => a)
    .filter((a) => !a.startsWith("\n"))
    .filter((a) => a.trim().length);
  for (const keyLine of keyLines) {
    const key = keyLine.replace(":", "");
    if (isAttributeName([], key.trim())) continue;
    const keyRegex = new RegExp(keyLine, "gm");
    const matches = [...domSection.matchAll(keyRegex)];
    if (matches.length > 1) {
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        domSection = domSection.replace(match[0], `${key}#${i + 1}:`);
      }
    }
  }
  yaml = `${domSection}${afterDomSection}`;
  return yaml;
};

const postProcessYaml = (yaml: string) => {
  // Replace on_ with @
  yaml = yaml.replace(/\bon_/g, "@");
  // Add "# js" after method keys (  onLayerImageLoad: |)
  // Regex is two whitespaces, then a key, then a colon, then a space, then a pipe
  yaml = yaml.replace(/  (\w+): \|/g, "  $1: | #js");
  // Also replace:
  // mounted: |
  yaml = yaml.replace(/mounted: \|/g, "mounted: | #js");
  // Remove #1, #2, etc from the end of keys (div#1: -> div:)
  yaml = yaml.replace(/(\w+)#\d+:/g, "$1: ");
  return yaml;
};

export { preProcessYaml, postProcessYaml };
