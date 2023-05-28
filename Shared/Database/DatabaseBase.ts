import * as colors from "colors";
import "../Extensions";
import { Timer } from "../Timer";
import { ProducerConsumer } from "../ProducerConsumer";

abstract class DatabaseBase {
  protected static _mapCollectionName = "_Map";

  private newIds = new ProducerConsumer(100, this._getNewIDs.bind(this));

  abstract get(key: any): Promise<any>;

  abstract set(key: any, value: any): Promise<void>;

  abstract has(key: any): Promise<boolean>;

  abstract find(
    collectionName: string,
    query: any,
    sort?: any,
    limit?: number,
    skip?: number,
    lowercaseFields?: boolean
  ): Promise<any[]>;

  abstract findIterable(
    collectionName: string,
    query: any,
    sort?: any,
    limit?: number,
    skip?: number,
    lowercaseFields?: boolean
  ): AsyncGenerator<any, void, unknown>;

  abstract aggregate(collectionName: string, pipeline: any[]): Promise<any[]>;

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

  async delete(collectionName: string, query: any): Promise<void> {
    await this._delete(collectionName, query);
  }

  protected abstract _delete(collectionName: string, query: any): Promise<void>;

  abstract count(collectionName: string, query?: any): Promise<number>;

  async getNewID() {
    return (await this.getNewIDs(1))[0];
  }

  async getNewIDs(count: number) {
    return await this.newIds.get(count);
  }

  protected abstract _getNewIDs(count: number): Promise<number[]>;

  abstract getCollectionNames(): Promise<string[]>;
}

export { DatabaseBase };
