abstract class Database {
  abstract exists(
    type: string,
    id: number | string,
    ext: string
  ): Promise<boolean>;

  abstract get(type: string, id: string): Promise<any>;

  abstract set(type: string, id: string, value: any): Promise<void>;

  abstract setBinary(
    type: string,
    id: number | string,
    ext: string,
    buffer: Buffer
  ): Promise<void>;

  abstract upsert(type: string, doc: any): Promise<void>;

  abstract getDocs(
    type: string,
    filter?: (doc: any) => boolean
  ): Promise<any[]>;
}

export { Database };
