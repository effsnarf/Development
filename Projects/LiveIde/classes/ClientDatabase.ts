const Dexie: any = (window as any).Dexie;

class ClientDatabase {
  private db: any;

  // const collections = {
  //   ComponentClasses: ["_id", "name", "_item"],
  //   Cache: ["key", "value"],
  // };
  constructor(dbName: string, collections: any) {
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

  async upsert(collection: string, item: any) {
    await this.db[collection].put(item);
  }

  async upsertMany(collection: string, items: any[]) {
    await this.db[collection].bulkPut(items);
  }
}
