import { DatabaseBase } from "./DatabaseBase";

class NullDatabase extends DatabaseBase {
  static new() {
    return new NullDatabase();
  }

  async get(key: any): Promise<any> {
    return null;
  }

  async set(key: any, value: any): Promise<void> {
    return;
  }

  async has(key: any): Promise<boolean> {
    return false;
  }

  async find(
    collectionName: string,
    query: any,
    sort?: any,
    limit?: number | undefined,
    skip?: number | undefined,
    lowercaseFields?: boolean | undefined
  ): Promise<any[]> {
    return [];
  }

  async *findIterable(
    collectionName: string,
    query: any,
    sort?: any,
    limit?: number | undefined,
    skip?: number | undefined,
    lowercaseFields?: boolean | undefined
  ): AsyncGenerator<any, void, unknown> {
    return;
  }

  async aggregate(collectionName: string, pipeline: any[]): Promise<any[]> {
    return [];
  }

  protected async _upsert(collectionName: string, doc: any): Promise<any> {
    return null;
  }

  protected async _delete(collectionName: string, query: any): Promise<void> {
    return;
  }

  async count(collectionName: string, query?: any): Promise<number> {
    return 0;
  }

  protected async _getNewIDs(count: number): Promise<number[]> {
    return [];
  }

  async getCollectionNames(): Promise<string[]> {
    return [];
  }
}

export { NullDatabase };