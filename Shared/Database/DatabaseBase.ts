import * as colors from "colors";
import "../Extensions";
import { Timer } from "../Timer";

abstract class DatabaseBase {
  abstract find(
    collectionName: string,
    query: any,
    sort: any,
    limit?: number,
    skip?: number,
    lowercaseFields?: boolean
  ): Promise<any[]>;

  async upsert(
    collectionName: string,
    doc: any,
    returnNewDoc: boolean = false
  ): Promise<any> {
    if (!doc._id) doc._id = await this.getNewID();
    return await this._upsert(collectionName, doc, returnNewDoc);
  }

  protected abstract _upsert(
    collectionName: string,
    doc: any,
    returnNewDoc: boolean
  ): Promise<any>;

  abstract count(collectionName: string, query: any): Promise<number>;

  abstract getNewIDs(count: number): Promise<number[]>;

  abstract getNewID(): Promise<number>;

  abstract getCollectionNames(): Promise<string[]>;
}

export { DatabaseBase };
