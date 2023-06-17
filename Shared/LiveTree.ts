import "./Extensions";
import fs from "fs";
import { Icons } from "./Icons";
import ts from "typescript";
import { TypeScript as TypeScript1 } from "./TypeScript";

namespace LiveTree {
  export class Api {
    static async getFolder(path: string): Promise<Node> {
      //return await Folder.new(path.splitPath());
      return await FileSystem.Folder.new(path.splitPath());
    }
  }

  interface Title {
    icon: string;
    text: string;
  }

  export interface NodeInfo {
    type: string[];
    args: any[];
  }

  export class RemoteNode {
    children: RemoteNode[] | null = null;
    constructor(public title: Title, public info: NodeInfo) {}

    async populate(): Promise<void> {
      // Go to the server and get the children
      // We have the NodeInfo needed to instantiate the node on the server, and get its children
      // This way we don't need to maintain state on the server
      throw new Error("Method not implemented.");
    }
  }

  export abstract class Node {
    info: NodeInfo;
    children!: Node[];

    constructor(namespace: string | null, args: any[], public title: Title) {
      this.info = {
        type: [namespace, this.constructor.name].onlyTruthy<string>(),
        args,
      };
    }

    abstract getParent(): Promise<Node | null>;

    abstract getChildren(): Promise<Node[]>;

    async find(text: string) {
      return this.children.find((c) => c.title.text === text);
    }

    async populate(): Promise<void> {
      this.children = await this.getChildren();
    }

    async select(project: (node: Node) => any): Promise<any> {
      const node = project(this) as any;
      node.children = [];
      for (const child of this.children || []) {
        node.children.push(await child.select(project));
      }
      return node;
    }
  }

  export namespace FileSystem {
    export class Folder extends Node {
      private static ignore = [
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
        super("FileSystem", [path], { icon: Icons.folder, text: path.last() });
      }

      static async new(path: string[]): Promise<Folder> {
        return new Folder(path);
      }

      async getParent(): Promise<Node | null> {
        if (this.path.length === 1) return null;
        return Folder.new(this.path.slice(0, -1));
      }

      async getChildren(): Promise<Node[]> {
        const path = this.path.join("/");
        const files = fs.readdirSync(path);
        const parts: Node[] = [];
        for (const fileName of files.filter(
          (f) => !Folder.ignore.includes(f)
        )) {
          const filePath = path + "/" + fileName;
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            parts.push(await Folder.new([...this.path, fileName]));
          } else {
            parts.push(await File.new([...this.path, fileName]));
          }
        }
        return parts;
      }
    }

    export abstract class File extends Node {
      static types = {
        ts: "code",
        js: "code",
      };

      constructor(namespace: string, args: any[], public path: string[]) {
        const fileName = path.last();
        const ext = fileName.split(".").last();
        const type = (File.types as any)[ext];
        const icon = (Icons.files as any)[type] || Icons.file;
        const text = fileName;
        super(namespace, args, { icon, text });
      }

      static async new(path: string[]): Promise<File> {
        const ext = path.last().split(".").last();
        for (const namespace1 of Object.values(LiveTree)) {
          for (const class1 of Object.values(namespace1)) {
            if (class1.extensions?.includes(ext)) {
              const file = (await class1.new(path)) as File;
              return file;
            }
          }
        }
        return await Unknown.File.new(path);
      }

      async getParent(): Promise<Node | null> {
        return Folder.new(this.path.slice(0, -1));
      }
    }
  }

  export namespace Unknown {
    export class File extends LiveTree.FileSystem.File {
      constructor(path: string[]) {
        super("Unknown", [path], path);
      }

      static async new(path: string[]): Promise<File> {
        return new File(path);
      }

      async getChildren(): Promise<Node[]> {
        return [];
      }
    }
  }

  export namespace TypeScript {
    export class File extends LiveTree.FileSystem.File {
      static extensions = ["ts", "tsx"];

      constructor(path: string[]) {
        super("TypeScript", [path], path);
      }

      static async new(path: string[]): Promise<File> {
        return new File(path);
      }

      async getChildren(): Promise<Node[]> {
        const classes = TypeScript1.find.classes(this.getAst());
        const nodes: Node[] = [];
        for (const class1 of classes) {
          const className = class1.name?.getText();
          if (!className) throw new Error(`Class name not found`);
          nodes.push(await TypeScript.Class.new(this.path, className));
        }
        return nodes;
      }

      getAst(): ts.Node {
        const path = this.path.join("/");
        const code = fs.readFileSync(path, "utf8");
        const ast = TypeScript1.parse(code);
        return ast;
      }
    }

    export class Class extends Node {
      file!: TypeScript.File;

      constructor(public path: string[], public name: string) {
        super("TypeScript", [path, name], { icon: Icons.class, text: name });
      }

      static async new(path: string[], name: string) {
        const cls = new Class(path, name);
        cls.file = await TypeScript.File.new(path);
        return cls;
      }

      async getParent(): Promise<Node | null> {
        return this.file;
      }

      async getChildren(): Promise<Node[]> {
        const methods = TypeScript1.find.methods(this.file.getAst());
        const parts: Node[] = [];
        for (const method of methods) {
          const methodName = method.name?.getText();
          if (!methodName) throw new Error("Method name not found");
          parts.push(
            await TypeScript.Method.new(this.path, this.name, methodName)
          );
        }
        return parts;
      }

      getAst(): ts.Node {
        const ast = this.file.getAst();
        const class1 = TypeScript1.find.class(ast, this.name);
        if (!class1)
          throw new Error(
            `Class not found: ${this.name} (${this.file.path.join("/")})`
          );
        return class1;
      }
    }

    export class Method extends Node {
      class1!: Class;

      constructor(path: string[], className: string, public name: string) {
        super("TypeScript", [path, className, name], {
          icon: Icons.method,
          text: name,
        });
      }

      static async new(path: string[], className: string, name: string) {
        const method = new Method(path, className, name);
        method.class1 = await Class.new(path, className);
        return method;
      }

      async getParent(): Promise<Node | null> {
        return this.class1;
      }

      async getChildren(): Promise<Node[]> {
        return [];
      }

      getAst(): ts.Node {
        const ast = this.class1.getAst();
        const method = TypeScript1.find.method(ast, this.name);
        if (!method)
          throw new Error(
            `Method not found: ${this.name} (${this.class1.name})`
          );
        return method;
      }
    }
  }
}

export { LiveTree };
