import { Database } from "./Database";
import { DatabaseBase } from "./DatabaseBase";

class DbQueue {
  private constructor(
    private db: DatabaseBase,
    private collectionName: string
  ) {}

  static async new(config: any) {
    const db = await Database.new(config);
    const collectionName = config.collectionName;
    return new DbQueue(db, collectionName);
  }

  async add(item: any) {
    await this.db.upsert(this.collectionName, item, true);
  }

  async pop() {
    const item = await this.db.findOne(this.collectionName, {}, { _id: 1 });
    if (!item) return null;
    await this.db.delete(this.collectionName, item);
    return item;
  }

  async count() {
    return await this.db.count(this.collectionName);
  }
}

export { DbQueue };
