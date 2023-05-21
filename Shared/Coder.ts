import colors from "colors";
import jsyaml from "js-yaml";
import fs from "fs";
import os from "os";
import path from "path";
import ts from "typescript";
import "./Extensions";
import { StringBuilder } from "./StringBuilder";
import { Loading } from "./Loading";

const tsc = ts.factory;

namespace Coder {
  type LogItem = {
    parent?: LogItem;
    type?: string;
    name?: string;
    args?: any[];
    code?: string;
    value?: any;
    subs?: LogItem[];
  };

  type MethodHook = (method: ts.MethodDeclaration) => ts.Block;
  type MethodReturnHook = (
    method: ts.MethodDeclaration,
    returnVarName: string
  ) => ts.Block;

  type StatementHook = (statement: ts.Statement) => ts.Block;

  type ExpressionHook = (
    loggedExpression: ts.Expression,
    executedExpression: ts.Expression,
    sourceFile: ts.SourceFile
  ) => ts.Expression;

  class CodeGenerator {
    static nodeToCode(node: ts.Node, sourceFile: ts.SourceFile) {
      const printer = ts.createPrinter();
      const modifiedCode = printer.printNode(
        ts.EmitHint.Unspecified,
        node,
        sourceFile
      );
      return modifiedCode;
    }

    nodeToCode(node: ts.Node, sourceFile: ts.SourceFile) {
      return CodeGenerator.nodeToCode(node, sourceFile);
    }

    private toNode(value: any) {
      // if it's already a TypeScript node, just return it
      if (value?.kind) return value;

      return this.literal(value);
    }

    private static findExpression(node: ts.Node): ts.Expression | undefined {
      if (ts.isExpressionStatement(node)) {
        return node.expression;
      } else if (ts.isBinaryExpression(node)) {
        return node;
      } else {
        for (const child of node.getChildren()) {
          const expression = CodeGenerator.findExpression(child);
          if (expression) {
            return expression;
          }
        }
        return undefined;
      }
    }

    literal(value: any) {
      if (value === null) {
        return tsc.createNull();
      }
      if (typeof value === "boolean") {
        return value ? tsc.createTrue() : tsc.createFalse();
      }
      if (typeof value === "string") {
        return tsc.createStringLiteral(value);
      }
      throw new Error(`Unsupported literal type: (${typeof value}) ${value}`);
    }

    expression(code: string) {
      const sourceFile = ts.createSourceFile("", code, ts.ScriptTarget.Latest);

      const expression = CodeGenerator.findExpression(sourceFile);

      if (!expression) throw new Error(`Invalid expression: ${code}`);

      //console.log(CodeGenerator.nodeToString(expression, sourceFile));

      return expression;
    }

    statement(statement: string) {
      const sourceFile = ts.createSourceFile(
        "",
        statement,
        ts.ScriptTarget.Latest
      );

      const statementNode = sourceFile.statements[0];

      if (!statementNode) throw new Error(`Invalid statement: ${statement}`);

      //console.log(CodeGenerator.nodeToString(statementNode, sourceFile));

      return statementNode;
    }

    block(...statements: ts.Statement[]) {
      return tsc.createBlock(statements);
    }

    call = {
      method: (method: string, args: any[]) => {
        // Make sure the args array is defined
        args = args || [];
        // Split the logMethodName string by '.' to get the individual property names
        const propertyNames = method.split(".");

        // Start with an identifier for the first property name
        let currentExpression = tsc.createIdentifier(
          propertyNames[0]
        ) as ts.Expression;

        // Iterate over the remaining property names and construct a PropertyAccessExpression for each one
        for (let i = 1; i < propertyNames.length - 1; i++) {
          currentExpression = tsc.createPropertyAccessChain(
            currentExpression,
            tsc.createToken(ts.SyntaxKind.QuestionDotToken),
            tsc.createIdentifier(propertyNames[i])
          );
        }

        const propAccessChain = tsc.createPropertyAccessChain(
          currentExpression,
          tsc.createToken(ts.SyntaxKind.QuestionDotToken),
          tsc.createIdentifier(propertyNames[propertyNames.length - 1])
        );

        // Create a CallExpression for the method with an argument of "arg"
        const methodCall = tsc.createCallExpression(
          propAccessChain,
          undefined,
          args.map((arg) => this.toNode(arg))
        );

        // Create an if statement that checks whether global.test.test is defined before calling it
        const ifStatement = tsc.createIfStatement(
          propAccessChain,
          tsc.createExpressionStatement(methodCall),
          undefined
        );

        return ifStatement;
      },
    };
  }

  class Hooker {
    hooks = {
      method: {
        enter: [] as MethodHook[],
        return: [] as MethodReturnHook[],
        exit: [] as MethodHook[],
      },
      statement: {
        before: [] as StatementHook[],
        after: [] as StatementHook[],
      },
      expression: [] as ExpressionHook[],
    };

    on = {
      method: {
        enter: (hook: MethodHook) => {
          this.hooks.method.enter.push(hook);
        },
        return: (hook: MethodReturnHook) => {
          this.hooks.method.return.push(hook);
        },
        exit: (hook: MethodHook) => {
          this.hooks.method.exit.push(hook);
        },
      },
      statement: {
        before: (hook: StatementHook) => {
          this.hooks.statement.before.push(hook);
        },
        after: (hook: StatementHook) => {
          this.hooks.statement.after.push(hook);
        },
      },
      expression: (hook: ExpressionHook) => {
        this.hooks.expression.push(hook);
      },
    };

    factory(program: ts.Program, options: any) {
      return (context: ts.TransformationContext) =>
        (sourceFile: ts.SourceFile) => {
          const code = new CodeGenerator();

          const visitor: any = (node: ts.Node) => {
            // For classes, log the class name
            if (ts.isClassDeclaration(node)) {
              const classDeclaration = node as ts.ClassDeclaration;
              console.log(classDeclaration.name?.getText(sourceFile));
            }

            // For methods, log the method name and arguments
            if (ts.isMethodDeclaration(node)) {
              const method = node as ts.MethodDeclaration;
              const body = method.body;
              console.log(method.name.getText(sourceFile));
            }

            if (ts.isMethodDeclaration(node)) {
              const method = node as ts.MethodDeclaration;
              const body = method.body;
              if (body) {
                let newBody = body;

                // We want to capture all the expressions in every statement
                // For example, for IF statements, we capture the value of the condition
                // by wrapping the condition expression with a logging function
                // so that
                // if (condition) {
                // becomes
                // if (log(condition)) {
                // (using this.hooks.expression)
                const hookExpressionsVisitor = (node: ts.Node): ts.Node => {
                  if (ts.isExpressionStatement(node)) {
                    const nodeCode = code.nodeToCode(node, sourceFile);
                    // Log the type of the expression
                    //console.log();
                    //console.log(ts.SyntaxKind[node.kind].yellow);
                    //console.log(nodeCode.gray);
                    if (
                      ts.isBinaryExpression(node) ||
                      ts.isCallExpression(node)
                    ) {
                      if (this.hooks.expression.length > 1)
                        throw new Error(
                          `Currently only one expression hook is supported`
                        );
                      if (this.hooks.expression.length == 0) return node;
                      const hookedExpression = this.hooks.expression[0](
                        node,
                        ts.visitEachChild(
                          node,
                          hookExpressionsVisitor,
                          context
                        ) as ts.Expression,
                        sourceFile
                      );
                      return hookedExpression;
                    }
                  }
                  return ts.visitEachChild(
                    node,
                    hookExpressionsVisitor,
                    context
                  );
                };

                // newBody = tsc.createBlock([
                //   ts.visitEachChild(
                //     newBody,
                //     hookExpressionsVisitor,
                //     context
                //   ) as ts.Statement,
                // ]);

                // Before and after each statement in the method body,
                // add before.statement and after.statement hooks
                newBody = tsc.createBlock(
                  newBody.statements.map((statement) => {
                    // Wrap all the expressions in the statement
                    // Add the before.statement hook
                    const getHooks = (hooks: StatementHook[]) => {
                      return hooks
                        .map((hook) => hook(statement))
                        .map((block) => block.statements)
                        .flatMap((statements) => statements);
                    };
                    const newStatement = tsc.createBlock(
                      [
                        tsc.createTryStatement(
                          // try (before)
                          tsc.createBlock([
                            ...getHooks(this.hooks.statement.before),
                            ts.visitEachChild(
                              statement,
                              hookExpressionsVisitor,
                              context
                            ) as ts.Statement,
                          ]),
                          // catch
                          undefined,
                          // finally (after)
                          tsc.createBlock([
                            ...getHooks(this.hooks.statement.after),
                          ])
                        ),
                      ],
                      true
                    );
                    return newStatement;
                  })
                );

                // Capture the return value by putting the entire method body in an arrow function
                newBody = tsc.createBlock([
                  code.statement(
                    `const methodBody = (() => { ${CodeGenerator.nodeToCode(
                      newBody,
                      sourceFile
                    )} });`
                  ),
                  code.statement(`const methodResult = methodBody();`),
                  ...this.hooks.method.return.map((hook) =>
                    hook(method, "methodResult")
                  ),
                  code.statement(`return methodResult;`),
                ]);

                // Capture entering the method
                newBody = tsc.createBlock(
                  [
                    ...this.hooks.method.enter.map((hook) => hook(method)),
                    newBody,
                  ],
                  true
                );

                // Capture exiting the method
                const finallyBlock = tsc.createBlock([
                  tsc.createBlock(
                    [...this.hooks.method.exit.map((hook) => hook(method))],
                    true
                  ),
                ]);
                const tryFinallyBlock = tsc.createBlock([
                  tsc.createTryStatement(
                    tsc.createBlock(newBody.statements, true),
                    undefined,
                    finallyBlock
                  ),
                ]);

                return tsc.updateMethodDeclaration(
                  method,
                  //method.decorators,
                  method.modifiers,
                  method.asteriskToken,
                  method.name,
                  method.questionToken,
                  method.typeParameters,
                  method.parameters,
                  method.type,
                  tryFinallyBlock
                );
              }
            }
            return ts.visitEachChild(node, visitor, context);
          };

          return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
        };
    }
  }

  export class Log {
    root: LogItem;
    currentNode: LogItem;

    constructor() {
      this.root = {
        type: "root",
        subs: [],
      };
      this.currentNode = this.root;
    }

    private traverse(node: any, callback: (node: any) => void): void {
      callback(node);

      const children = node.subs;

      if (children) {
        for (const child of children) {
          this.traverse(child, callback);
        }
      }
    }

    stringifyYaml() {
      return jsyaml.dump(this.root);
    }

    stringify() {
      return this.stringifyNode(this.root).join("\n");
    }

    stringifyNode(node: LogItem, indentation: number = 0) {
      const sb = new StringBuilder(indentation);

      sb.addLines(this.stringifyItem(sb, node));
      sb.indent();
      for (let sub of node.subs || [])
        sb.addLines(this.stringifyNode(sub, sb.indentation));
      // for (let sub of (node.subs || []).filter((s) => s.type == "expression"))
      //   sb.addLines(this.stringifyNode(sub, sb.indentation));
      // for (let sub of (node.subs || []).filter((s) => s.type == "statement"))
      //   sb.addLines(this.stringifyNode(sub, sb.indentation));
      // for (let sub of (node.subs || []).filter((s) => s.type == "method"))
      //   sb.addLines(this.stringifyNode(sub, sb.indentation));
      sb.unindent();
      return sb.getLines();
    }

    private stringifyItem(sb: StringBuilder, item: LogItem) {
      if (item.type === "root") return [colors.gray("root")];

      if (item.type === "method") {
        const args = item.args?.map((arg) => JSON.stringify(arg)).join(", ");
        const s = [];
        s.push(`${colors.green(item.name || "")}(${args})`);
        if (item.value)
          s.push(
            ` ${colors.gray("returned")} ${colors.black(
              colors.bgGreen(JSON.stringify(item.value))
            )}`
          );
        return [s.join("")];
      }

      if (item.type === "statement") {
        if (!item.code) throw new Error("statement without code");
        return (
          item.code
            ?.split("\n")
            //.slice(0, 2)
            .map((s) => colors.gray(s))
        );
      }

      if (item.type === "expression") {
        return [
          `${colors.cyan(item.code || "")} ${"->".gray} ${colors.black(
            colors.bgCyan(JSON.stringify(item.value))
          )}`,
        ];
      }

      return [`type: ${item.type} (stringify not implemented)`];
    }

    method = {
      entered: (name: string, args: any[]) => {
        //console.log("enter", name, args);
        return this.add("method", { name, args }, true);
      },
      returned: (name: string, returnValue: any) => {
        //console.log("return", name, returnValue);
        this.currentNode.value = returnValue;
      },
      exited: (name: string) => {
        //console.log("exit", name);
        this.go.up();
      },
    };

    statement = {
      before: (code: string) => {
        return this.add("statement", { code } as LogItem, true);
      },
      after: (code: string) => {
        this.go.up();
      },
    };

    expression = (code: string, value: any) => {
      this.add("expression", { code, value } as LogItem);
      return value;
    };

    private add(type: string, item: LogItem, goIn: boolean = false) {
      item.type = type;
      item.parent = this.currentNode;
      item.subs = item.subs || [];

      if (!this.currentNode.subs) this.currentNode.subs = [];
      this.currentNode.subs.push(item);

      if (goIn) this.currentNode = item;

      return item;
    }

    go = {
      up: () => {
        if (!this.currentNode.parent) throw new Error("Can't go up from root.");
        this.currentNode = this.currentNode.parent;
      },
      to: (node: LogItem) => {
        this.currentNode = node;
      },
    };
  }

  export class App {
    static addDebuggingCode(tsSourceOrPath: string) {
      let tsSourcePath = tsSourceOrPath;
      if (tsSourceOrPath.split("\n").length > 1) {
        tsSourcePath = path.resolve(os.tmpdir(), `${Date.now().valueOf()}.ts`);
        fs.writeFileSync(tsSourcePath, tsSourceOrPath);
      }

      const code = new CodeGenerator();
      const hooker = new Hooker();

      const compilerOptions: ts.CompilerOptions = {};

      const program = ts.createProgram([tsSourcePath], compilerOptions);
      const sourceFile = program.getSourceFile(tsSourcePath);
      if (!sourceFile) throw new Error(`${tsSourcePath} not found.`);

      hooker.on.method.enter((method: ts.MethodDeclaration) => {
        const methodName = method.name.getText(sourceFile);

        return code.block(
          code.statement(
            `if ((global as any).log) (global as any).log.method.entered("${methodName}", [...arguments])`
          )
        );
      });

      hooker.on.method.exit((method: ts.MethodDeclaration) => {
        const methodName = method.name.getText(sourceFile);

        return code.block(
          code.statement(
            `if ((global as any).log) (global as any).log.method.exited("${methodName}")`
          )
        );
      });

      // hooker.on.method.return(
      //   (method: ts.MethodDeclaration, returnVarName: string) => {
      //     const methodName = method.name.getText(sourceFile);

      //     return code.block(
      //       code.statement(
      //         `global.log.method.returned("${methodName}", ${returnVarName})`
      //       )
      //     );
      //   }
      // );

      // hooker.on.statement.before((statement: ts.Statement) => {
      //   const statementCode = CodeGenerator.nodeToCode(statement, sourceFile);
      //   return code.block(
      //     code.call.method("global.log.statement.before", [statementCode])
      //   );
      // });

      // hooker.on.statement.after((statement: ts.Statement) => {
      //   const statementCode = CodeGenerator.nodeToCode(statement, sourceFile);
      //   return code.block(
      //     code.call.method("global.log.statement.after", [statementCode])
      //   );
      // });

      // hooker.on.expression(
      //   (
      //     loggedExpression: ts.Expression,
      //     executedExpression: ts.Expression,
      //     sourceFile: ts.SourceFile
      //   ) => {
      //     const loggedExpressionCode = CodeGenerator.nodeToCode(
      //       loggedExpression,
      //       sourceFile
      //     );
      //     const executedExpressionCode = CodeGenerator.nodeToCode(
      //       executedExpression,
      //       sourceFile
      //     );
      //     return code.expression(
      //       `global.log.expression(${JSON.stringify(
      //         loggedExpressionCode
      //       )}, ${executedExpressionCode})`
      //     );
      //   }
      // );

      const result = ts.transform(sourceFile, [
        hooker.factory(program, compilerOptions),
      ]);

      const newSourceFile = result.transformed[0];
      const newSource = CodeGenerator.nodeToCode(newSourceFile, newSourceFile);

      return newSource;
    }
  }
}

export { Coder };
