import * as colors from "colors";
import ts, { ClassElement, Statement } from "typescript";
import { CodeGenerator } from "./CodeGenerator";

const tsc = ts.factory;

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
                if (ts.isExpression(node)) {
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
                return ts.visitEachChild(node, hookExpressionsVisitor, context);
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

export { Hooker };
