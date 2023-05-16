const fs = require("fs");
const path = require("path");
import { Files } from "../Files";
import { DatabaseBase } from "./DatabaseBase";

class FileSystemDatabase extends DatabaseBase {
  constructor(private basePath: string) {
    super();

    // Create basePath if it doesn't exist
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }
  }

  static async new(basePath: string) {
    const db = new FileSystemDatabase(basePath);
    return db;
  }

  async find(
    collectionName: string,
    query: any,
    sort?: any,
    limit?: number,
    skip?: number,
    lowercaseFields?: boolean
  ) {
    const collectionPath = path.join(this.basePath, collectionName);
    if (!fs.existsSync(collectionPath)) return [];
    if (query) throw new Error("Query not implemented");
    if (sort) throw new Error("Sort not implemented");
    if (skip) throw new Error("Skip not implemented");
    let docs = [];
    for (const filePath of Files.listFiles(collectionPath, {
      recursive: true,
    })) {
      if (limit && docs.length >= limit) break;
      docs.push(JSON.parse(fs.readFileSync(filePath, "utf8")));
    }
    if (lowercaseFields) docs = docs.map((d) => Objects.toCamelCaseKeys(d));
    return docs;
  }

  async *findIterable(
    collectionName: string,
    query: any,
    sort: any,
    limit?: number,
    skip?: number,
    lowercaseFields?: boolean
  ): AsyncGenerator<any> {
    const collectionPath = path.join(this.basePath, collectionName);
    if (!fs.existsSync(collectionPath)) return;
    if (query) throw new Error("Query not implemented");
    if (sort) throw new Error("Sort not implemented");
    if (skip) throw new Error("Skip not implemented");
    let docsYieldedCount = 0;

    // List files in collectionPath recursively
    for (const file of Files.listFiles(collectionPath, { recursive: true })) {
      if (limit && docsYieldedCount >= limit) return;
      let doc = JSON.parse(fs.readFileSync(file, "utf8"));
      if (lowercaseFields) {
        doc = Objects.toCamelCaseKeys(doc);
      }
      yield doc;
      docsYieldedCount++;
    }
    return; // No more docs
  }

  async aggregate(collectionName: string, pipeline: any[]): Promise<any[]> {
    throw new Error("Method not implemented.");
  }

  protected async _upsert(
    collectionName: string,
    doc: any,
    returnNewDoc: boolean
  ): Promise<any> {
    const filePath = this.getFilePath(collectionName, doc._id);
    const json = JSON.stringify(doc);
    fs.writeFileSync(filePath, json);
    if (!returnNewDoc) return doc._id;
    return doc;
  }
  count(collectionName: string, query?: any): Promise<number> {
    return new Promise((resolve, reject) => {
      if (query) throw new Error("Query not implemented");
      let count = 0;
      for (const file of Files.listFiles(
        path.join(this.basePath, collectionName),
        { recursive: true }
      )) {
        count++;
        console.log(
          `${count.toLocaleString().green} ${`files found in`.gray} ${
            collectionName.yellow
          }`
        );
        // Move the cursor up one line
        process.stdout.write("\u001B[1A");
      }
      // Move the cursor down one line
      console.log();
      resolve(count);
    });
  }
  async getNewIDs(count: number): Promise<number[]> {
    const ids = await Promise.all(
      Array.from(Array(count).keys()).map(async (i) => this.getNewID())
    );
    ids.sort();
    return ids;
  }
  async getNewID(): Promise<number> {
    const uniqueIdFilePath = path.join(this.basePath, "uniqueID.json");
    if (!fs.existsSync(uniqueIdFilePath)) {
      fs.writeFileSync(uniqueIdFilePath, "1");
    }
    const uniqueID = JSON.parse(
      await fs.promises.readFile(uniqueIdFilePath, "utf8")
    );
    const newId = uniqueID + 1;
    await fs.writeFileSync(uniqueIdFilePath, newId.toString());
    return uniqueID;
  }
  async getCollectionNames(): Promise<string[]> {
    // List folders in basePath
    const folders = await fs.promises.readdir(this.basePath, {
      withFileTypes: true,
    });
    const collectionNames = folders
      .filter((f: any) => f.isDirectory())
      .map((f: any) => f.name);
    return collectionNames;
  }

  private getFilePath(collectionName: string, id: number) {
    const dir1 = Math.floor(id / 1000000).toString();
    const dir2 = Math.floor(id / 1000).toString();
    const dirPath = path.join(this.basePath, collectionName, dir1, dir2);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const filePath = path.join(dirPath, `${id}.json`);
    return filePath;
  }
}

export { FileSystemDatabase };
