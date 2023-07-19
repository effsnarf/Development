import { Objects } from "./Extensions.Objects.Client";

import util from "util";
import pug from "pug";
const deepDiff = require("deep-diff").diff;
const jsyaml = require("js-yaml");

Objects.stringify = (obj: any): string => {
  return util.inspect(obj, { depth: 4 });
};

Objects.yamlify = (obj: any): string => {
  return jsyaml.dump(obj);
};

Objects.parseYaml = (str: string): any => {
  try {
    return jsyaml.load(str);
  } catch (ex: any) {
    throw new Error(`Error parsing yaml\n${ex.message}\n${str}`);
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

Objects.jsonify = (obj: any): string => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (ex: any) {
    throw `Error stringifying object\n${ex.message}}`;
  }
};

Objects.deepDiff = (obj1: any, obj2: any): any => {
  return deepDiff(obj1, obj2) || [];
};

export { Objects };
