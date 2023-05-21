import ts from "typescript";
import fs from "fs";
import os from "os";
import MemoryFS from "memory-fs";
import path from "path";
import webpack from "webpack";
import { Loading } from "./Loading";

const preprocessTypeScript = (inputScript: string) => {
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

  let s = inputScript;

  const sharedPath = findSharedPath();

  // Replace paths like @shared/[module] with `${sharedPath}/[module]`.
  // This is necessary because webpack doesn't support @shared/ in the source code.
  s = s.replace(/@shared\/([a-zA-Z0-9_\-\/]+)/g, (match, module) => {
    let s = `${sharedPath}/${module}`;
    return s;
  });

  return s;
};

class TypeScript {
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

  static async webpackify(inputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const basePath = path.dirname(process.argv[1]);
      const memoryFs = new MemoryFS();

      // Write the input file to memory
      // Make sure the directory exists
      memoryFs.mkdirpSync(path.dirname(inputPath));
      memoryFs.writeFileSync(inputPath, fs.readFileSync(inputPath, "utf8"));

      const preprocessTypeScriptPath = path.resolve(
        os.tmpdir(),
        "preprocess.typescript.js"
      );

      fs.writeFileSync(
        preprocessTypeScriptPath,
        `
        const fs = require('fs');
        const path = require('path');

        module.exports = ${preprocessTypeScript.toString().replace(/_1/g, "")}`
      );

      const output = {
        path: path.resolve(basePath),
        filename: "bundle.js",
      };
      const config = {
        mode: "development",
        target: "node",
        entry: inputPath,
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

      const loading = Loading.startNew(
        `${`Webpackifying`.gray} ${config.entry?.toString().green}`
      );
      webpack(config, (err: any, stats: any) => {
        loading.stop();
        if (err || stats.hasErrors()) {
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
}

export { TypeScript };
