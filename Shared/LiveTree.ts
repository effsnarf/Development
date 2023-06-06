import "./Extensions";
import fs from "fs";
import { Icons } from "./Icons";
import ts from "typescript";
import { TypeScript as TypeScript1 } from "./TypeScript";

namespace LiveTree {
  export namespace Types {
    export interface Title {
      icon: string;
      text: string;
      hint?: string;
    }

    export type Part = { type: string; text: string };

    export type Path = Part[];

    export interface Node {
      type: string;
      path: Path;
      title: Title;
    }
  }

  export abstract class Node {
    protected abstract getContent(path: Types.Path): Promise<any>;
    protected abstract getSubNodes(path: Types.Path): Promise<Types.Node[]>;

    static async getSubNodes(
      path?: Types.Path,
      type?: string
    ): Promise<Types.Node[]> {
      path = Node.getFullPath(path);
      const inst = Node.getInstance(path, type);
      let nodes = await inst.getSubNodes(path);
      //nodes = nodes.sortBy((n: any) => n.title.text);
      return nodes;
    }

    static getContent(path?: Types.Path, type?: string): Promise<any> {
      path = Node.getFullPath(path);
      const inst = Node.getInstance(path, type);
      return inst.getContent(path);
    }

    private static getInstance(path?: Types.Path, type?: string): Node {
      path = Node.getFullPath(path);
      if (!type) type = path.last().type as string;
      const cls = Node.findClass(type);
      const inst = new (cls as any)();
      return inst;
    }

    private static getFullPath(path?: Types.Path): Types.Path {
      if (!path?.length)
        path = [
          Node.part("FileSystem.Folder", "c:"),
          Node.part("FileSystem.Folder", "eff"),
          Node.part("FileSystem.Folder", "Development"),
        ];
      const fullPath = [...path];
      return fullPath;
    }

    protected static from(
      basePath: Types.Path,
      type: string,
      text: string,
      nodePathText?: string
    ): Types.Node {
      if (!nodePathText) nodePathText = text;
      const path = [...basePath, { type, text: nodePathText }];
      return {
        type,
        path,
        title: {
          icon: (Icons as any)[type.split(".").last().toCamelCase()] as string,
          text,
        },
      };
    }

    protected static froms(
      items: any[],
      basePath: Types.Path,
      type: string,
      nameField: string | ((item: any) => string)
    ): Types.Node[] {
      const getName = (item: any) =>
        typeof nameField == "string" ? nameField : nameField(item);
      return items.map((item) => Node.from(basePath, type, getName(item)));
    }

    protected static findClass(type: string): any {
      const parts = type.split(".");
      let node = Trees;
      while (node && parts.length) {
        const part = parts.shift() as string;
        node = (node as any)[part];
      }
      if (node) return node;

      throw new Error(`Unknown type: ${type}`);
    }

    protected static part(type: string, text: string): Types.Part {
      return { type, text };
    }
  }

  export namespace Trees {
    export namespace FileSystem {
      const extensions = {
        ts: "TypeScript",
      } as { [key: string]: string };

      export class Folder extends Node {
        async getContent(path: Types.Path): Promise<fs.Dirent[]> {
          let folderItems = fs.readdirSync(
            `${path.map((p) => p.text).join("/")}`,
            {
              withFileTypes: true,
            }
          );
          folderItems = folderItems.filter(this.includeFolderItem);
          return folderItems;
        }

        async getSubNodes(path: Types.Path): Promise<Types.Node[]> {
          const nodes = [] as Types.Node[];
          const folderItems = await this.getContent(path);

          nodes.push(
            ...folderItems
              .filter((item) => item.isDirectory())
              .map((folder) =>
                Node.from(path, "FileSystem.Folder", folder.name)
              )
          );

          nodes.push(
            ...folderItems
              .filter((item) => item.isFile())
              .map((file) => Node.from(path, "FileSystem.File", file.name))
          );

          return nodes;
        }

        private includeFolderItem(item: fs.Dirent) {
          const name = item.name.toLowerCase();
          const exclude = [
            "node_modules",
            "bin",
            "obj",
            ".git",
            ".vs",
            ".vscode",
            "packages",
            "dist",
            "build",
            "release",
            "debug",
            "temp",
            "tmp",
            "logs",
            "log",
            "backup",
            "backups",
            "cache",
            "caches",
          ];
          if (exclude.includes(name)) return false;
          return true;
        }
      }

      export class File extends Node {
        async getContent(path: Types.Path): Promise<string> {
          const content = fs.readFileSync(
            path.map((p) => p.text).join("/"),
            "utf8"
          );
          return content;
        }

        async getSubNodes(path: Types.Path): Promise<Types.Node[]> {
          const nodes = [] as Types.Node[];
          const fileName = path.last().text;
          const extension = fileName.split(".").pop()?.toLowerCase() || "";
          let type = extensions[extension];
          if (type) {
            type = `Language.${type}.File`;
            nodes.push(...(await Node.getSubNodes(path, type)));
          } else {
            nodes.push(Node.from(path, "Unknown", fileName));
          }
          return nodes;
        }
      }
    }

    export namespace Language {
      export namespace TypeScript {
        export class File extends Node {
          async getContent(path: Types.Path): Promise<ts.Node> {
            const code = await Node.getContent(path);
            const ast = TypeScript1.parse(code);
            return ast;
          }

          async getSubNodes(path: Types.Path): Promise<Types.Node[]> {
            const nodes = [] as Types.Node[];

            const ast = await this.getContent(path);
            const classes = TypeScript1.find.classes(ast);

            nodes.push(
              ...Node.froms(classes, path, "Language.TypeScript.Class", (c) =>
                c.name.getText()
              )
            );

            return nodes;
          }
        }

        export class Class extends Node {
          async getContent(path: Types.Path): Promise<ts.ClassDeclaration> {
            const code = await Node.getContent(path.back());
            const ast = TypeScript1.parse(code);
            const class1 = TypeScript1.find.class(ast, path.last().text);
            if (!class1)
              throw new Error(`Class not found: ${path.last().text}`);
            return class1;
          }

          async getSubNodes(path: Types.Path): Promise<Types.Node[]> {
            const nodes = [] as Types.Node[];

            const class1 = await this.getContent(path);
            const methods = TypeScript1.find.methods(class1);

            nodes.push(
              ...Node.froms(methods, path, "Language.TypeScript.Method", (m) =>
                m.name?.getText()
              )
            );

            return nodes;
          }
        }

        export class Method extends Node {
          async getContent(path: Types.Path): Promise<ts.MethodDeclaration> {
            const class1 = await Node.getContent(path.back());
            const method = TypeScript1.find.method(class1, path.last().text);
            return method;
          }

          async getSubNodes(path: Types.Path): Promise<Types.Node[]> {
            const nodes = [] as Types.Node[];
            return nodes;
          }
        }
      }
    }

    export class Unknown extends Node {
      async getContent(path: Types.Path): Promise<any> {
        return null;
      }

      async getSubNodes(path: Types.Path): Promise<Types.Node[]> {
        return [];
      }
    }
  }
}

export { LiveTree };
