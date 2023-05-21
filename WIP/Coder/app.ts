import * as colors from "colors";
import "@shared/Extensions";
import fs from "fs";
import ts from "typescript";
import { Coder } from "../../Shared/Coder";
import { TypeScript } from "../../Shared/TypeScript";

// Helper function to require a module from a string
function requireFromString(src: string) {
  const Module = module.constructor as any;
  const m = new Module();
  m._compile(src, "");
  return m.exports;
}

(async () => {
  const srcFilePath = "./classes/tests/Fibonacci.ts";

  const newSourceTs = TypeScript.resolveSharedAliases(
    fs.readFileSync(srcFilePath, "utf8")
  );

  const newSourceJs = TypeScript.transpileToJavaScript(newSourceTs);

  const exports = requireFromString(newSourceJs);

  const log = new Coder.Log();
  (global as any).log = log;

  const test = new exports.Fibonacci();

  const num = 3;

  console.log(`Fibonacci of ${num} is ${test.calculate(num)}`);

  console.log();

  //console.log(log.stringifyYaml());

  //console.log();

  console.log(log.stringify());
})();
