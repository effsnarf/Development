import * as colors from "colors";
import "../Extensions";
import { Objects } from "../Extensions.Objects";
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

  abstract aggregate(
    collectionName: string,
    pipeline: any[],
    lowercaseFields?: boolean | undefined
  ): Promise<any[]>;

  async upsert(
    collectionName: string,
    doc: any,
    returnNewDoc: boolean = false,
    returnDiff: boolean = false
  ): Promise<any> {
    if (returnNewDoc && returnDiff)
      throw new Error("Cannot return new doc and diff");

    const oldDoc = returnDiff
      ? await this.findOneByID(collectionName, doc._id)
      : null;

    if (!doc._id) doc._id = await this.getNewID();
    await this._upsert(collectionName, doc);

    if (returnNewDoc) return await this.findOneByID(collectionName, doc._id);

    if (returnDiff) return Objects.deepDiff(oldDoc, doc);
  }

  async findOneByID(collectionName: string, _id: number): Promise<any> {
    return (await this.find(collectionName, { _id }))[0];
  }

  protected abstract _upsert(collectionName: string, doc: any): Promise<any>;

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
