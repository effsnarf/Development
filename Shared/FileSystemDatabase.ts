import glob from "glob";
import { Database } from "./Database";

const fs = require("fs");
const path = require("path");

class FileSystemDatabase extends Database {
  private readonly dataDir: string;

  static async new(basePath: string) {
    const db = new FileSystemDatabase(basePath);
    return db;
  }

  private constructor(basePath: string) {
    super();
    this.dataDir = basePath;
  }

  private getFilePath(type: string, id: number | string, ext: string = "json") {
    let path = this._getFilePath(type, id, ext);
    let dir = path.substring(0, path.lastIndexOf("/"));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return path;
  }

  private _getFilePath(
    type: string,
    id: number | string,
    ext: string = "json"
  ): string {
    let idNum = parseInt(id.toString());
    if (!isNaN(idNum)) {
      let folder1 = Math.floor(idNum / 1000);
      let folder2 = Math.floor(idNum / 1000 / 1000);
      return `${this.dataDir}/${type}/${folder2}/${folder1}/${id}.${ext}`;
    }
    return `${this.dataDir}/${type}/${id}.json`;
  }

  async exists(
    type: string,
    id: number | string,
    ext: string = "json"
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const filePath = this.getFilePath(type, id, ext);
      fs.access(filePath, fs.constants.F_OK, (error: any) => {
        if (error) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  async get(type: string, id: number | string): Promise<any> {
    return new Promise((resolve, reject) => {
      const filePath = this.getFilePath(type, id);
      try {
        const data = fs.readFileSync(filePath, { encoding: "utf8" });
        resolve(JSON.parse(data) as any);
      } catch (error: any) {
        if (error.code === "ENOENT") {
          resolve(null);
        }
        reject(error);
      }
    });
  }

  async set(type: string, id: number | string, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const filePath = this.getFilePath(type, id);
      fs.writeFileSync(filePath, JSON.stringify(value), { encoding: "utf8" });
      resolve();
    });
  }

  async setBinary(
    type: string,
    id: number | string,
    ext: string,
    buffer: Buffer
  ): Promise<void> {
    const filePath = this.getFilePath(type, id, ext);
    fs.writeFileSync(filePath, buffer, { encoding: "binary" });
  }

  async upsert(type: string, doc: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const filePath = this.getFilePath(type, doc.id);
      const dirPath = path.dirname(filePath);

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      fs.writeFileSync(filePath, JSON.stringify(doc), { encoding: "utf8" });

      resolve();
    });
  }

  async getDocs(type: string, filter?: (doc: any) => boolean): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      let path = `${this.dataDir}/${type}`;
      // If path doesn't exist, return empty array
      if (!fs.existsSync(path)) {
        resolve([]);
        return;
      }
      const docs = [];
      const files = await this.listFilesRecursive(path);
      for (const file of files) {
        if (file.endsWith(".json")) {
          const filePath = `${this.dataDir}/${type}/${file}`;
          const data = fs.readFileSync(filePath, { encoding: "utf8" });
          const doc = JSON.parse(data);
          if (!filter || filter(doc)) {
            docs.push(doc);
          }
        }
      }
      resolve(docs);
    });
  }

  async delete(type: string, id: number | string) {
    return new Promise((resolve, reject) => {
      const filePath = this.getFilePath(type, id);
      // Delete the file
      fs.unlinkSync(filePath);
      resolve(null);
    });
  }

  private async listFilesRecursive(directory: string) {
    return new Promise<string[]>(async (resolve, reject) => {
      const pattern = `${directory}/**/*`;

      resolve(await glob(pattern, { nodir: true }));
    });
  }
}

export { FileSystemDatabase };
