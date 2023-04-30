import * as colors from "colors";
import "@shared/Extensions";
import fs from "fs";
import ts from "typescript";
import { Hooker } from "./classes/ast/Hooker";
import { CodeGenerator } from "./classes/ast/CodeGenerator";
import { Log } from "./classes/log/Log";

// Helper function to require a module from a string
function requireFromString(src: string) {
  const Module = module.constructor as any;
  const m = new Module();
  m._compile(src, "");
  return m.exports;
}

(async () => {
  const code = new CodeGenerator();
  const hooker = new Hooker();

  const compilerOptions: ts.CompilerOptions = {};

  const srcFilePath = "./classes/tests/Fibonacci.ts";

  const program = ts.createProgram([srcFilePath], compilerOptions);
  const sourceFile = program.getSourceFile(srcFilePath);
  if (!sourceFile) throw new Error(`${srcFilePath} not found.`);

  hooker.on.method.enter((method: ts.MethodDeclaration) => {
    const methodName = method.name.getText(sourceFile);

    return code.block(
      code.statement(
        `global.log.method.entered("${methodName}", [...arguments])`
      )
    );
  });

  hooker.on.method.return(
    (method: ts.MethodDeclaration, returnVarName: string) => {
      const methodName = method.name.getText(sourceFile);

      return code.block(
        code.statement(
          `global.log.method.returned("${methodName}", ${returnVarName})`
        )
      );
    }
  );

  hooker.on.method.exit((method: ts.MethodDeclaration) => {
    const methodName = method.name.getText(sourceFile);

    return code.block(
      code.statement(`global.log.method.exited("${methodName}")`)
    );
  });

  hooker.on.statement.before((statement: ts.Statement) => {
    const statementCode = CodeGenerator.nodeToCode(statement, sourceFile);
    return code.block(
      code.call.method("global.log.statement.before", [statementCode])
    );
  });

  hooker.on.statement.after((statement: ts.Statement) => {
    const statementCode = CodeGenerator.nodeToCode(statement, sourceFile);
    return code.block(
      code.call.method("global.log.statement.after", [statementCode])
    );
  });

  hooker.on.expression(
    (
      loggedExpression: ts.Expression,
      executedExpression: ts.Expression,
      sourceFile: ts.SourceFile
    ) => {
      const loggedExpressionCode = CodeGenerator.nodeToCode(
        loggedExpression,
        sourceFile
      );
      const executedExpressionCode = CodeGenerator.nodeToCode(
        executedExpression,
        sourceFile
      );
      return code.expression(
        `global.log.expression(${JSON.stringify(
          loggedExpressionCode
        )}, ${executedExpressionCode})`
      );
    }
  );

  const result = ts.transform(sourceFile, [
    hooker.factory(program, compilerOptions),
  ]);

  const newSourceFile = result.transformed[0];
  const newSource = CodeGenerator.nodeToCode(newSourceFile, newSourceFile);

  //console.log(newSource);

  // Compile the TypeScript source code to JavaScript
  const newSourceJS = ts.transpileModule(newSource, {
    compilerOptions,
  }).outputText;

  const exports = requireFromString(newSourceJS);

  const log = new Log();
  (global as any).log = log;

  const test = new exports.Fibonacci();

  const num = 3;

  console.log(`Fibonacci of ${num} is ${test.calculate(num)}`);

  console.log();

  //console.log(log.stringifyYaml());

  //console.log();

  console.log(log.stringify());
})();
