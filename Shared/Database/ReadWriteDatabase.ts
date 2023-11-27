import { Database, DbField, DbOperation } from "./Database";
import { DatabaseBase } from "./DatabaseBase";

// Uses two different databases, one for reading and one for writing.
class ReadWriteDatabase extends DatabaseBase {
  private constructor(
    private readDb: DatabaseBase,
    private writeDb: DatabaseBase
  ) {
    super();
  }

  static async new(config: any): Promise<DatabaseBase> {
    const readDb = await Database.new(config.read);
    const writeDb = await Database.new(config.write);
    return new ReadWriteDatabase(readDb, writeDb);
  }

  get(key: any): Promise<any> {
    throw new Error("Method not implemented.");
  }
  set(key: any, value: any): Promise<void> {
    throw new Error("Method not implemented.");
  }
  has(key: any): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  find(
    collectionName: string,
    query: any,
    sort?: any,
    limit?: number | undefined,
    skip?: number | undefined,
    lowercaseFields?: boolean | undefined
  ): Promise<any[]> {
    return this.readDb.find(
      collectionName,
      query,
      sort,
      limit,
      skip,
      lowercaseFields
    );
  }
  findIterable(
    collectionName: string,
    query: any,
    sort?: any,
    limit?: number | undefined,
    skip?: number | undefined,
    lowercaseFields?: boolean | undefined
  ): AsyncGenerator<any, void, unknown> {
    return this.readDb.findIterable(
      collectionName,
      query,
      sort,
      limit,
      skip,
      lowercaseFields
    );
  }
  aggregate(collectionName: string, pipeline: any[]): Promise<any[]> {
    return this.readDb.aggregate(collectionName, pipeline);
  }
  protected _upsert(collectionName: string, doc: any): Promise<any> {
    return this.writeDb.upsert(collectionName, doc);
  }
  protected _delete(collectionName: string, query: any): Promise<void> {
    return this.writeDb.delete(collectionName, query);
  }
  count(collectionName: string, query?: any): Promise<number> {
    return this.readDb.count(collectionName, query);
  }
  protected _setNewID(newID: number): Promise<void> {
    return this.writeDb.setNewID(newID);
  }
  protected _getNewIDs(count: number): Promise<number[]> {
    return this.writeDb.getNewIDs(count);
  }
  getEntityNames(): Promise<string[]> {
    return this.readDb.getEntityNames();
  }
  async getEntityFields(entityName: string): Promise<DbField[]> {
    return this.readDb.getEntityFields(entityName);
  }

  async getCurrentOperations(): Promise<DbOperation[]> {
    const readOps = await this.readDb.getCurrentOperations();
    return [...readOps];
  }
}

export { ReadWriteDatabase };
