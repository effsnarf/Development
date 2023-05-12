const fs = require("fs");
const path = require("path");
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

  find(
    collectionName: string,
    query: any,
    sort: any,
    limit?: number | undefined,
    skip?: number | undefined,
    lowercaseFields?: boolean | undefined
  ): Promise<any[]> {
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
  count(collectionName: string, query: any): Promise<number> {
    throw new Error("Method not implemented.");
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
    const dir1 = Math.round(id / 1000000).toString();
    const dir2 = Math.round(id / 1000).toString();
    const dirPath = path.join(this.basePath, collectionName, dir1, dir2);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const filePath = path.join(dirPath, `${id}.json`);
    return filePath;
  }
}

export { FileSystemDatabase };
