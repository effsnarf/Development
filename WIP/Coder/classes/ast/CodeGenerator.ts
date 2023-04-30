import ts from "typescript";
import "@shared/Extensions";

const tsc = ts.factory;

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

export { CodeGenerator };
