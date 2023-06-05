import { Cache, CacheBase } from "./Cache";
import { Database } from "./Database/Database";
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

// HTTP API for analytics
class Api {
  private cache!: CacheBase;
  private constructor(private analytics: Analytics) {}

  static async new(analytics: Analytics, config: any) {
    const api = new Api(analytics);
    api.cache = await Cache.new(config?.cache);
    return api;
  }

  async handleRequest(req: any, res: any) {
    let url = req.url;
    if (url.startsWith("/analytics/")) url = url.substr("/analytics".length);

    // CORS: *
    res.setHeader("Access-Control-Allow-Origin", "*");

    const { data } = await this.cache.get(url, async () => {
      return { data: await this._handleRequest(url) };
    });

    return res.end(JSON.stringify(data));
  }

  async _handleRequest(url: string) {
    // /:app/:category/:event/last/:last/every/:every/:type

    if (url.match(/\/.+\/.+\/.+\/last\/.+\/every\/.+\/\w+/)) {
      const parts = url.split("/");
      const [app, category, event] = parts.slice(1, 4);
      const [last, every] = [parts[5], parts[7]].map((p: string) =>
        p.deunitify()
      );
      const type = parts[8].parseEnum(ItemType);
      if (!type) throw new Error("Invalid type: " + parts[7] + ` (${url})`);
      const to = Date.now();
      const from = to - last;
      const intervals = await this.analytics.aggregate(
        app,
        category,
        event,
        from,
        to,
        every,
        type
      );
      return intervals;
    }
    throw new Error("Invalid request: " + url);
  }
}

class Analytics {
  private db!: DatabaseBase;
  api!: Api;

  static defaults = {
    database: null as DatabaseBase | null,
  };

  constructor() {}

  static async new(config: any) {
    let database =
      (!config.database
        ? Analytics.defaults.database
        : await Database.new(config.database)) || (await Database.new(null));
    const analytics = new Analytics();
    analytics.db = database;
    analytics.api = await Api.new(analytics, config.api);
    return analytics;
  }

  async create(
    app: string,
    category: string,
    event: string,
    type: ItemType = ItemType.Undefined,
    inTheLast: number,
    value: any,
    unit: string | null = null
  ) {
    return;
    const now = Date.now();
    const since = now - inTheLast;

    const data = {
      dt: [since, now],
      a: app,
      c: category,
      e: event,
      t: type,
      v: value,
      u: unit,
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
        "dt[0]": {
          $gte: interval.from,
          $lte: interval.to,
        },
        "dt[1]": {
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
