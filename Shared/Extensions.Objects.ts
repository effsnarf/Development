import { Objects } from "./Extensions.Objects.Client";

import util from "util";
import pug from "pug";
const deepDiff = require("deep-diff");
const jsyaml = require("js-yaml");

Objects.stringify = (obj: any): string => {
  return util.inspect(obj, { depth: 4 });
};

Objects.yamlify = (obj: any): string => {
  return jsyaml.dump(obj);
};

Objects.inspect = (
  obj: any,
  showHidden?: boolean,
  depth?: number | null,
  color: boolean = true
): string => {
  return util.inspect(obj, showHidden, depth, color);
};

Objects.parseYaml = (yaml: string, options?: any) => {
  const addSuffixToDuplicateKeys = (yaml: string, underKeys?: string[]) => {
    const lines = yaml.split("\n");
    const lines2: string[] = [];
    const keyCounts: { [key: string]: number } = {};
    const path: string[] = [];
    let currentLevel = 0;

    for (const line of lines) {
      const match = line.match(/^(\s*)([^:]+):/);
      if (match) {
        const indent = match[1].length;
        const key = match[2].trim();
        const level = indent / 2; // Assuming 2 spaces per indentation level

        // Update the current path based on the indentation level
        while (level < currentLevel) {
          path.pop();
          currentLevel--;
        }
        path.push(key);

        // Check if any part of the current path is in underKeys
        const isUnderKey =
          underKeys &&
          path.exceptLast(1).some((part) => underKeys.includes(part));

        // If under a specified key, apply the suffix logic
        if (isUnderKey) {
          const count = (keyCounts[key] = (keyCounts[key] || 0) + 1);
          const key2 = count > 1 ? `${key}#${count}` : key;
          lines2.push(line.replace(key, key2));
        } else {
          lines2.push(line);
        }

        currentLevel = level;
      } else {
        lines2.push(line);
      }
    }

    return lines2.join("\n");
  };

  try {
    if (options?.addSuffixToDuplicateKeysUnder) {
      yaml = addSuffixToDuplicateKeys(
        yaml,
        options?.addSuffixToDuplicateKeysUnder
      );
    }
    return jsyaml.load(yaml);
  } catch (ex: any) {
    if (ex.message?.includes(`duplicated mapping key`))
      ex.message += `\nAdd { addSuffixToDuplicateKeysUnder: ["key1", "key2"] } to options if this is intentional.`;
    throw new Error(`Error parsing yaml\n${ex.message}\n${yaml}`);
  }
};

Objects.pugToHtml = (str: string, options?: any): string => {
  try {
    let html = pug.render(str, options);
    return html;
  } catch (ex: any) {
    throw new Error(`Error rendering pug\n${ex.message}\n${str}`);
  }
};

Objects.jsonify = (obj: any, depth: number = 100): string => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (ex: any) {
    // Circular reference, util.inspect will handle it
    if (ex.message.toLowerCase().includes("circular")) {
      return util.inspect(obj, true, depth, false);
    }
    throw `Error stringifying obj
    ect\n${ex.message}}`;
  }
};

Objects.deepDiff = (obj1: any, obj2: any): any => {
  return deepDiff.diff(obj1, obj2) || [];
};

export { Objects };
