const path = require("path");
const tsconfig = require("./tsconfig.json");

const baseUrl = tsconfig.compilerOptions.baseUrl;
const paths = tsconfig.compilerOptions.paths;

if (!baseUrl)
  throw new Error("The baseUrl property is missing from tsconfig.json");

// Convert the paths configuration into a format that can be used by Node.js
const aliases = {} as any;
Object.keys(paths).forEach((key) => {
  const alias = key.replace(/\*/g, "");
  const value = paths[key][0].replace(/\*/g, "");
  aliases[alias] = path.resolve(baseUrl, value);
});

// Register the module resolution paths with Node.js
require("tsconfig-paths").register({
  baseUrl: path.resolve(baseUrl),
  paths: aliases,
});
