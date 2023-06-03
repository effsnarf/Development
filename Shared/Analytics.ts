import { DatabaseBase } from "./Database/DatabaseBase";

enum ItemType {
  Undefined = 0,
  Count = 1,
  Average = 2,
  Method = 3,
}
class Analytics {
  private db!: DatabaseBase;

  static defaults = {
    database: null as DatabaseBase | null,
  };

  constructor() {}

  static async new(database: DatabaseBase) {
    if (!database) {
      if (Analytics.defaults.database) database = Analytics.defaults.database;
    }
    const analytics = new Analytics();
    analytics.db = database;
    return analytics;
  }

  async create(
    type: ItemType = ItemType.Undefined,
    app: string,
    category: string,
    event: string,
    value: any
  ) {
    const dt = Date.now();

    const data = {
      d: dt,
      t: type,
      a: app,
      c: category,
      e: event,
      v: value,
    } as any;

    const doc = await this.db.upsert("Events", data);

    return doc;
  }

  async update(eventID: number, value: any) {
    const newDoc = await this.db.upsert("Events", { _id: eventID, v: value });
    return newDoc;
  }

  async count(category: string, event: string) {
    return await this.db.count("Events", { c: category, e: event });
  }
}

export { Analytics, ItemType };
