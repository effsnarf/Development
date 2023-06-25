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
      //const type = parts[8].parseEnum(ItemType);
      //if (!type) throw new Error("Invalid type: " + parts[7] + ` (${url})`);
      const to = Date.now();
      const from = to - last;
      const intervals = await this.analytics.aggregate(
        app,
        category,
        event,
        from,
        to,
        every
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
    const now = Date.now();
    const since = now - inTheLast;

    const data = {
      dt: { f: since, t: now },
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
    every: number
  ) {
    const isIn = (value: number, interval: Interval) =>
      value.isBetween(interval.from, interval.to);

    const isFullDoc = (doc: any, interval: Interval) =>
      isIn(doc.dt.f, interval) && isIn(doc.dt.t, interval);

    const isPartialDoc = (doc: any, interval: Interval) =>
      !isFullDoc(doc, interval) &&
      (isIn(doc.dt.f, interval) || isIn(doc.dt.t, interval));

    const isWrappingDoc = (doc: any, interval: Interval) =>
      doc.dt.f < interval.from && doc.dt.t > interval.to;

    const intervals = Analytics.getIntervals(from, to, every);

    for (const interval of intervals) {
      const filter = {
        //t: type,
        a: app,
        c: category,
        e: event,
        $or: [
          {
            "dt.f": {
              $gte: interval.from,
              $lte: interval.to,
            },
          },
          {
            "dt.t": {
              $gte: interval.from,
              $lte: interval.to,
            },
          },
          {
            $and: [
              {
                "dt.f": {
                  $lt: interval.from,
                },
              },
              {
                "dt.t": {
                  $gt: interval.to,
                },
              },
            ],
          },
        ],
      };

      const relevantDocs = await this.db.find("Events", filter);

      // Some of the docs fall only partially in the interval
      // We need to adjust their values to the relative space they occupy in the interval
      // Either:
      // The doc's dt.f or dt.t are inside the interval
      // of the entire doc wraps the interval
      // For each doc we calculate how much of the interval it occupies
      // and adjust the value accordingly
      // Each interval has a list of docs that fall in it
      const intervalDocs = [];
      for (const doc of relevantDocs) {
        if (isFullDoc(doc, interval)) {
          intervalDocs.push(doc);
          continue;
        }
        let ratio = 1;
        if (isPartialDoc(doc, interval)) {
          const { f, t } = doc.dt;
          const intervalLength = interval.to - interval.from;
          const overlap = f.isBetween(interval.from, interval.to)
            ? interval.to - f
            : t - interval.from;
          ratio = overlap / intervalLength;
        }
        // Doc is longer than the interval
        if (isWrappingDoc(doc, interval)) {
          const { f, t } = doc.dt;
          const intervalLength = interval.to - interval.from;
          const docLength = t - f;
          ratio = intervalLength / docLength;
        }
        // Adjust the value
        // If the type is count, we need to adjust the value
        // If the type is average, we don't need to adjust the value
        if (doc.t == ItemType.Count) doc.v *= ratio;
        intervalDocs.push(doc);
        continue;
      }

      interval.docs = intervalDocs;
    }

    const type = intervals[0].docs[0].t;

    const values = intervals
      .map((intr) => intr.docs.map((d: any) => d.v))
      .map((values) =>
        type == ItemType.Average ? values.average() : values.sum()
      )
      .map((v) => Math.round(v));

    return values;
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
