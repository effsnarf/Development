import { Cache, CacheBase } from "./Cache";
import { Database } from "./Database/Database";
import { DatabaseBase } from "./Database/DatabaseBase";

enum ItemType {
  Undefined = 0,
  Count = 1,
  Average = 3,
}

interface Interval {
  from: number;
  to: number;
  docs: any[];
  count: number;
  sum: number;
  average: number;
}

interface AnalyticsEvent {
  _id: number;
  dt: { f: number; t: number };
  a: string;
  c: string;
  e: string;
  t: ItemType;
  v: any;
  u: string;
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

    if (url.match(/\/.+\/.+\/.+\/last\/.+\/every\/.+/)) {
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

const isIn = (value: number, interval: Interval) =>
  value.isBetween(interval.from, interval.to);

const docIsInside = (doc: any, interval: Interval) =>
  isIn(doc.dt.f, interval) && isIn(doc.dt.t, interval);

const docPartiallyCovers = (doc: any, interval: Interval) =>
  !docIsInside(doc, interval) &&
  (isIn(doc.dt.f, interval) || isIn(doc.dt.t, interval));

const docIsWrapping = (doc: any, interval: Interval) =>
  doc.dt.f < interval.from && doc.dt.t > interval.to;

const filters = {
  somehowOverlap(
    interval: Interval,
    app: string,
    category: string,
    event: string
  ) {
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
    return filter;
  },
  endIn(interval: Interval, app: string, category: string, event: string) {
    const filter = {
      a: app,
      c: category,
      e: event,
      "dt.t": {
        $gte: interval.from,
        $lte: interval.to,
      },
    };
    return filter;
  },
};

class Analytics {
  private db!: DatabaseBase;
  api!: Api;

  static defaults = {
    database: null as DatabaseBase | null,
  };

  constructor() {}

  static async new(config: any) {
    if (!config) return new Analytics();

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
    if (!this.db) return;

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
    if (!this.db) return;

    const newDoc = await this.db.upsert("Events", { _id: eventID, v: value });
    return newDoc;
  }

  async count(category: string, event: string) {
    if (!this.db) return null;

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
    if (!this.db) return [];

    // What's the overlap ratio where the value represents a count
    const getOverlapRatioForSum = (doc: AnalyticsEvent, interval: Interval) => {
      if (docIsInside(doc, interval)) {
        return 1;
      }
      if (docPartiallyCovers(doc, interval)) {
        const { f, t } = doc.dt;
        const intervalLength = interval.to - interval.from;
        const overlap = f.isBetween(interval.from, interval.to)
          ? interval.to - f
          : t - interval.from;
        return overlap / intervalLength;
      }
      if (docIsWrapping(doc, interval)) {
        const { f, t } = doc.dt;
        const intervalLength = interval.to - interval.from;
        const docLength = t - f;
        return intervalLength / docLength;
      }
      // no overlap
      return 0;
    };

    // What's the overlap ratio where the value represents an average
    const getOverlapRatioForAverage = (
      doc: AnalyticsEvent,
      interval: Interval
    ) => {
      if (docIsInside(doc, interval)) {
        const { f, t } = doc.dt;
        const intervalLength = interval.to - interval.from;
        const docLength = t - f;
        return docLength / intervalLength;
      }
      // otherwise, same as sum
      return getOverlapRatioForSum(doc, interval);
    };

    // Get an example doc to know the type
    const exampleDoc = (
      await this.db.find(
        "Events",
        {
          a: app,
          c: category,
          e: event,
        },
        { _id: -1 }
      )
    )[0];

    if (!exampleDoc) return [];

    let intervals = Analytics.getIntervals(from, to, every);

    // Aggregation is different according to the unit and type (count or average)

    // * requests is count, unit is null
    // In this case, we get all the docs that somehow overlap in the interval,
    // and sum their count * overlap ratios
    if (exampleDoc.u === null && exampleDoc.t === ItemType.Count) {
      for (const interval of intervals) {
        interval.docs = [];
        for (const doc of await this.db.find(
          "Events",
          filters.somehowOverlap(interval, app, category, event)
        )) {
          doc.v = doc.v * getOverlapRatioForSum(doc, interval);
          interval.docs.push(doc);
          continue;
        }
      }
      return intervals.map((intr) => intr.docs.sum((d: any) => d.v));
    }

    // * response.time is average, unit is ms, value is { count, average }
    // In this case, we get all the docs that somehow overlap in the interval,
    // take their [average] values, and weighted average them according to their counts and overlap ratios
    // so the weight is (count * overlap ratio)
    if (exampleDoc.u === "ms" && exampleDoc.t === ItemType.Average) {
      for (const interval of intervals) {
        interval.docs = [];
        for (const doc of await this.db.find(
          "Events",
          filters.somehowOverlap(interval, app, category, event)
        )) {
          doc.weight = doc.v.count * getOverlapRatioForAverage(doc, interval);
          interval.docs.push(doc);
          continue;
        }
      }

      return intervals.map((intr) =>
        intr.docs.average(
          (d: any) => d.v.average,
          (d: any) => d.weight
        )
      );
    }

    // * active.time is count, unit is ms
    // In this case, we get all the docs that *end* in the interval,
    // and average their values
    if (exampleDoc.u === "ms" && exampleDoc.t === ItemType.Count) {
      for (const interval of intervals) {
        interval.docs = [];
        for (const doc of await this.db.find(
          "Events",
          filters.endIn(interval, app, category, event)
        )) {
          interval.docs.push(doc);
          continue;
        }
      }
      return intervals.map((intr) => intr.docs.average((d: any) => d.v));
    }

    throw new Error("Unsupported aggregation");
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
