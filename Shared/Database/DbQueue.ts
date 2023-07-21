import { Database } from "./Database";
import { DatabaseBase } from "./DatabaseBase";

class DbQueue {
  private constructor(
    private db: DatabaseBase,
    private collectionName: string
  ) {}

  static async new(config: any) {
    const db = await Database.new(config);
    const collectionName = config?.collectionName;
    return new DbQueue(db, collectionName);
  }

  async add(item: any) {
    if (!this.db) return;
    if (await this.db.findOneByID(this.collectionName, item._id)) return;
    await this.db.upsert(this.collectionName, item, true);
  }

  async pop() {
    if (!this.db) return null;
    const item = await this.db.findOne(this.collectionName, {}, { _id: 1 });
    if (!item) return null;
    await this.db.delete(this.collectionName, item);
    return item;
  }

  async count() {
    if (!this.db) return null;
    return await this.db.count(this.collectionName);
  }
}

export { DbQueue };
