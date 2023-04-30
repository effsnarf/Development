import { MongoDatabase } from "./MongoDatabase";

class Analytics {
  private db!: MongoDatabase;

  static defaults = {
    connectionString: "",
    database: "",
  };

  constructor() {}

  static async new(
    connectionString: string | null = null,
    database: string | null = null
  ) {
    if (!connectionString)
      connectionString = Analytics.defaults.connectionString;
    if (!database) database = Analytics.defaults.database;
    const analytics = new Analytics();
    analytics.db = await MongoDatabase.new(connectionString, database);
    return analytics;
  }

  async create(category: string, event: string, value: any, elapsed?: number) {
    const dt = Date.now();

    const data = {
      d: dt,
      c: category,
      e: event,
      v: value,
    } as any;

    if (elapsed != undefined) data["elp"] = elapsed;

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

export { Analytics };
