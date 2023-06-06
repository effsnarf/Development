import ts from "typescript";
import fs from "fs";
import os from "os";
import MemoryFS from "memory-fs";
import path from "path";
import webpack from "webpack";
import { Coder } from "./Coder";
import { Loading } from "./Loading";

interface WebpackifyOptions {
  type: "source" | "filePath";
}

class TypeScript {
  static parse(code: string) {
    const sourceFile = ts.createSourceFile(
      "example.ts",
      code,
      ts.ScriptTarget.Latest,
      /* setParentNodes */ true
    );
    return sourceFile;
  }

  private static *traverse(ast: ts.Node): Generator<ts.Node, void, unknown> {
    yield ast;

    for (const childNode of ast.getChildren()) {
      yield* this.traverse(childNode);
    }
  }

  static find = {
    classes: (ast: ts.Node) => {
      return [...TypeScript.traverse(ast)]
        .filter((node) => node.kind === ts.SyntaxKind.ClassDeclaration)
        .map((c) => c as ts.ClassDeclaration);
    },

    class: (ast: ts.Node, className: string) => {
      const class1 = TypeScript.find
        .classes(ast)
        .find((c) => c.name?.getText() === className);
      if (!class1) throw new Error(`Class not found: ${className}`);
      return class1;
    },

    methods: (ast: ts.Node) => {
      return [...TypeScript.traverse(ast)].filter(
        (node) => node.kind === ts.SyntaxKind.MethodDeclaration
      ) as ts.MethodDeclaration[];
    },

    method: (ast: ts.Node, methodName: string) => {
      const method = TypeScript.find
        .methods(ast)
        .find((m) => m.name?.getText() === methodName);
      if (!method) throw new Error(`Method not found: ${methodName}`);
      return method;
    },
  };

  static transpileToJavaScript(tsCode: string): string {
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

  static async webpackify(
    input: string,
    options: WebpackifyOptions = { type: "filePath" }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (options.type === "filePath") {
        input = fs.readFileSync(input, "utf8");
      }

      // Get the base path of the current script
      const basePath = path.dirname(process.argv[1]);

      const inputFilePath = path.resolve(basePath, `${Date.now()}.ts`);
      const memoryFs = new MemoryFS();

      // Write the source to a memory input file
      // Make sure the directory exists
      //memoryFs.mkdirpSync(path.dirname(inputFileName));
      //memoryFs.writeFileSync(inputFileName, input);
      fs.writeFileSync(inputFilePath, input);

      const preprocessTypeScriptPath = path.resolve(
        os.tmpdir(),
        "preprocess.typescript.js"
      );

      fs.writeFileSync(
        preprocessTypeScriptPath,
        `
        const fs = require('fs');
        const path = require('path');

        module.exports = ${TypeScript.resolveSharedAliases
          .toString()
          .replace(/_1/g, "")}`
      );

      const output = {
        path: path.resolve(basePath),
        filename: "bundle.js",
      };
      const config = {
        mode: "development",
        target: "node",
        entry: inputFilePath,
        output: {
          ...output,
        },
        resolve: {
          extensions: [".ts", ".js"],
        },
        module: {
          rules: [
            {
              test: /\.ts$/,
              use: path.resolve(
                __dirname,
                path.resolve(basePath, "node_modules", "ts-loader")
              ),
              exclude: /node_modules/,
            },
            {
              test: /\.ts$/,
              use: {
                loader: preprocessTypeScriptPath,
                options: {},
              },
              exclude: /node_modules/,
            },
          ],
        },
        plugins: [
          {
            apply: (compiler: webpack.Compiler) => {
              compiler.outputFileSystem = memoryFs;
            },
          },
        ],
      } as webpack.Configuration;

      const loading = Loading.startNew(`${`Webpackifying..`.green}`);
      webpack(config, (err: any, stats: any) => {
        loading.stop();
        if (err || stats.hasErrors()) {
          fs.unlinkSync(inputFilePath);
          console.error(err || stats.compilation.errors);
          reject(err || stats.compilation.errors);
          return;
        }
        const bundleCode = memoryFs.readFileSync(
          path.resolve(output.path, output.filename),
          "utf8"
        );
        resolve(bundleCode);
      });
    });
  }

  static resolveSharedAliases(inputScript: string) {
    // From the current folder up, find the Shared folder
    const findSharedPath = () => {
      let currentPath = path.dirname(process.argv[1]);
      while (currentPath !== "/") {
        let sharedPath = path.join(currentPath, "Shared");
        if (fs.existsSync(sharedPath)) {
          // Convert to forward slashes
          sharedPath = sharedPath.replace(/\\/g, "/");
          return sharedPath;
        }
        currentPath = path.join(currentPath, "..");
      }
      throw new Error("Shared folder not found");
    };

    let source = inputScript;

    const sharedPath = findSharedPath();

    // Replace paths like @shared/[module] with `${sharedPath}/[module]`.
    // This is necessary because webpack doesn't support @shared/ in the source code.
    source = source.replace(
      /@shared\/([a-zA-Z0-9_\-\/]+)/g,
      (match, module) => {
        let s = `${sharedPath}/${module}`;
        return s;
      }
    );

    return source;
  }
}

export { TypeScript };
