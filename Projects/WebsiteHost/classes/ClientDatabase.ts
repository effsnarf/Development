const Dexie: any = (window as any).Dexie;

class ClientDatabase {
  private db: any;

  // const collections = {
  //   ComponentClasses: ["_id", "name", "_item"],
  //   Cache: ["key", "value"],
  // };
  private constructor(dbName: string, collections: any) {
    if (!Dexie) return;
    
    this.db = new Dexie(dbName);

    this.db
      .version(1)
      .stores(
        Object.fromEntries(
          Object.entries(collections).map(([name, keys]) => [
            name,
            (keys as string[]).join(","),
          ])
        )
      );
  }

  static async new(dbName: string, collections: any) {
    const db = new ClientDatabase(dbName, collections);
    return db;
  }

  async pop(collection: string) {
    const item = await this.db[collection].toCollection().first();
    if (!item) return null;
    await this.db[collection].delete(item.key);
    return item;
  }

  async filter(collection: string, filter: (item: any) => boolean) {
    return await this.db[collection].filter(filter).toArray();
  }

  async find(collection: string, filter: (item: any) => boolean) {
    return (await this.filter(collection, filter))[0];
  }

  async upsert(collection: string, item: any) {
    await this.db[collection].put(item);
  }

  async upsertMany(collection: string, items: any[]) {
    await this.db[collection].bulkPut(items);
  }

  async delete(collection: string, key: any) {
    await this.db[collection].delete(key);
  }
}

export { ClientDatabase };
