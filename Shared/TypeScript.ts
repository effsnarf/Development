import ts from "typescript";
import fs from "fs";

class TypeScript {
  public static transpile(tsCode: string): string {
    // Options for the TypeScript compiler (no generators)
    const compilerOptions: ts.CompilerOptions = {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES5,
      lib: ["es2015", "es2016", "es2017", "es2018", "es2019", "es2020"],
      strict: true,
    };

    // Transpile the TypeScript code to JavaScript
    const jsCode = ts.transpileModule(tsCode, {
      compilerOptions,
      reportDiagnostics: true,
    }).outputText;

    // Return the JavaScript code as a string
    return jsCode;
  }
}

export { TypeScript };
