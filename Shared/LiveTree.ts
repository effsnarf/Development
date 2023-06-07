import "./Extensions";
import fs from "fs";
import { Icons } from "./Icons";
import ts from "typescript";
import { TypeScript as TypeScript1 } from "./TypeScript";

namespace LiveTree {
  export class Api {
    static async getFolder(path: string): Promise<Folder> {
      return Folder.new(path.splitPath());
    }
  }

  abstract class Part {
    constructor(public text: string) {}

    async getSubParts(subPath?: string[]): Promise<Part[]> {
      if (subPath?.length) {
        let subParts = await this.getSubParts();
        while (subPath.length) {
          const partText = subPath.shift();
          const part = subParts.find((p) => p.text == partText);
          if (!part) throw new Error(`Part not found: ${partText}`);
          subParts = await part.getSubParts();
        }
        return subParts;
      }

      let subParts = await this._getSubParts();
      subParts = subParts.sortBy((p) => p.text);
      return subParts;
    }

    protected abstract _getSubParts(): Promise<Part[]>;
  }

  class Folder extends Part {
    private ignore = [
      "node_modules",
      ".git",
      ".vscode",
      "dist",
      "build",
      "out",
      "obj",
      "bin",
      "logs",
      "temp",
      "tmp",
    ];

    constructor(private path: string[]) {
      super(path.last());
    }

    static async new(path: string[]): Promise<Folder> {
      return new Folder(path);
    }

    protected async _getSubParts(): Promise<Part[]> {
      const path = this.path.join("/");
      const files = fs.readdirSync(path);
      const parts: Part[] = [];
      for (const fileName of files.filter((f) => !this.ignore.includes(f))) {
        const filePath = path + "/" + fileName;
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          parts.push(await Folder.new([...this.path, fileName]));
        } else {
          if (fileName.endsWith(".ts")) {
            parts.push(await new TypeScript.File([...this.path, fileName]));
          } else {
            parts.push(await File.new([...this.path, fileName]));
          }
        }
      }
      return parts;
    }
  }

  class File extends Part {
    constructor(private path: string[]) {
      super(path.last());
    }

    static async new(path: string[]): Promise<File> {
      return new File(path);
    }

    protected async _getSubParts(): Promise<Part[]> {
      return [];
    }
  }

  export namespace TypeScript {
    export class File extends Part {
      constructor(protected path: string[], text?: string) {
        super(text || path.last());
      }

      protected async _getSubParts(): Promise<Part[]> {
        const classes = TypeScript1.find.classes(this.getAst());
        const parts: Part[] = [];
        for (const class1 of classes) {
          const className = class1.name?.getText();
          if (!className) throw new Error(`Class name not found`);
          parts.push(new TypeScript.Class(this.path, className));
        }
        return parts;
      }

      protected getAst(): ts.Node {
        return this._getAst();
      }

      protected _getAst(): ts.Node {
        const path = this.path.join("/");
        const code = fs.readFileSync(path, "utf8");
        const ast = TypeScript1.parse(code);
        return ast;
      }
    }

    export class Class extends File {
      constructor(path: string[], protected className: string, text?: string) {
        super(path, text || className);
      }

      protected async _getSubParts(): Promise<Part[]> {
        const methods = TypeScript1.find.methods(this.getAst());
        const parts: Part[] = [];
        for (const method of methods) {
          const methodName = method.name?.getText();
          if (!methodName) throw new Error("Method name not found");
          parts.push(
            new TypeScript.Method(this.path, this.className, methodName)
          );
        }
        return parts;
      }

      protected _getAst(): ts.Node {
        const ast = super._getAst();
        const class1 = TypeScript1.find.class(ast, this.className);
        if (!class1)
          throw new Error(
            `Class not found: ${this.className} (${this.path.join("/")})`
          );
        return class1;
      }
    }

    export class Method extends Class {
      constructor(
        path: string[],
        className: string,
        private methodName: string
      ) {
        super(path, className, methodName);
      }

      protected async _getSubParts(): Promise<Part[]> {
        return [];
      }

      protected _getAst(): ts.Node {
        const ast = super._getAst();
        const method = TypeScript1.find.method(ast, this.methodName);
        if (!method)
          throw new Error(
            `Method not found: ${this.methodName} (${this.className})`
          );
        return method;
      }
    }
  }
}

export { LiveTree };
