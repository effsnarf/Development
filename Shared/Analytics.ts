import { DatabaseBase } from "./Database/DatabaseBase";

enum ItemType {
  Undefined = 0,
  Count = 1,
  Sum = 2,
  Average = 3,
  Method = 4,
}

interface Interval {
  from: number;
  to: number;
  docs: any[];
  count: number;
  sum: number;
  average: number;
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

  async aggregate(
    app: string,
    category: string,
    event: string,
    from: number,
    to: number,
    every: number,
    type: ItemType | string | null
  ) {
    if (typeof type == "string") type = type.parseEnum(ItemType);
    if (!type) throw new Error(`Invalid type: ${type}`);

    const intervals = Analytics.getIntervals(from, to, every);

    for (const interval of intervals) {
      interval.docs = await this.db.find("Events", {
        t: ItemType.Count,
        a: app,
        c: category,
        e: event,
        d: {
          $gte: interval.from,
          $lte: interval.to,
        },
      });
    }
    if (type == ItemType.Sum) {
      return intervals.map((intr) => intr.docs.map((d: any) => d.v).sum());
    }
  }

  // Returns an array of intervals between the specified dates
  // [{from: number, to: number}]
  private static getIntervals(from: number, to: number, every: number) {
    if (!to) to = Date.now();
    const intervals = [] as any[];
    for (let i = from; i < to; i += every) {
      intervals.push({ from: i, to: i + every - 1 } as Interval);
    }
    return intervals;
  }
}

export { Analytics, ItemType };
