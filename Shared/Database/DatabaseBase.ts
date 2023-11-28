import * as colors from "colors";
import "../Extensions";
import { Objects } from "../Extensions.Objects";
import { Timer } from "../Timer";
import { ProducerConsumer } from "../ProducerConsumer";
import { DbField, DbOperation } from "./Database";

abstract class DatabaseBase {
  protected static _mapCollectionName = "_Map";

  private newIds = new ProducerConsumer(2, this._getNewIDs.bind(this));

  abstract get(key: any): Promise<any>;

  abstract set(key: any, value: any): Promise<void>;

  abstract has(key: any): Promise<boolean>;

  abstract execute(script: string, args: any[]): Promise<any>;

  abstract find(
    collectionName: string,
    query: any,
    sort?: any,
    limit?: number,
    skip?: number,
    lowercaseFields?: boolean
  ): Promise<any[]>;

  async findOne(
    collectionName: string,
    query: any,
    sort?: any,
    lowercaseFields?: boolean
  ): Promise<any> {
    const docs = await this.find(
      collectionName,
      query,
      sort,
      1,
      undefined,
      lowercaseFields
    );
    return docs[0];
  }

  findAll(collectionName: string): AsyncGenerator<any, void, unknown> {
    return this.findIterable(
      collectionName,
      {},
      { _id: 1 },
      undefined,
      undefined,
      true
    );
  }

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
    doc: any | any[],
    returnNewDoc: boolean = false,
    returnDiff: boolean = false,
    uppercaseFields: boolean = false
  ): Promise<any> {
    if (Array.isArray(doc)) {
      const docs = doc;
      const results = [] as any[];
      for (const doc of docs) {
        results.push(
          await this.upsert(
            collectionName,
            doc,
            returnNewDoc,
            returnDiff,
            uppercaseFields
          )
        );
      }
      return results;
    }

    if (!doc) throw new Error("Cannot upsert null doc");

    doc = Objects.clone(doc);

    doc.last = doc.last || {};
    doc.last.updated = Date.now();

    if (uppercaseFields) doc = Objects.toTitleCaseKeys(doc);

    if (returnNewDoc && returnDiff)
      throw new Error("Cannot return new doc and diff");

    const oldDoc = returnDiff
      ? await this.findOneByID(collectionName, doc._id)
      : null;

    const newID = await this.getNewID();

    if (doc._id > newID) await this._setNewID(doc._id + 1);

    if (!doc._id) doc._id = newID;
    await this._upsert(collectionName, doc);

    if (returnNewDoc) return doc; // await this.findOneByID(collectionName, doc._id);

    if (returnDiff) return Objects.deepDiff(oldDoc, doc);
  }

  async findOneByID(collectionName: string, _id: any): Promise<any> {
    return (
      await this.find(collectionName, { _id: _id }, null, 1, undefined, true)
    )[0];
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

  async setNewID(newID: number) {
    await this._setNewID(newID);
  }

  protected abstract _setNewID(newID: number): Promise<void>;

  protected abstract _getNewIDs(count: number): Promise<number[]>;

  abstract getEntityNames(): Promise<string[]>;

  abstract getEntityFields(entityName: string): Promise<DbField[]>;

  abstract getCurrentOperations(minElapsed?: number): Promise<DbOperation[]>;
}

export { DatabaseBase };
