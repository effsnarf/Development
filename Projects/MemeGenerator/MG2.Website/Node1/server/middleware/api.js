import path from "path";
import bodyParser from "body-parser";
import "../../Shared/Extensions";
import { TimeSpan } from "../../Shared/TimeSpan";
import { Configuration } from "../../Shared/Configuration";
import { MongoDatabase } from "../../Shared/MongoDatabase";
import { Apify } from "../../../../../../Shared/Apify";
import { Analytics } from "../../Shared/Analytics";

const config = Configuration.new({ log: false }, path.join(__dirname, "../../config.yaml")).data;

Analytics.defaults.connectionString = config.database.analytics.connectionString;
Analytics.defaults.database = config.database.analytics.name;


const analyticsApify = new Apify.Server(
  null,
  null,
  "/",
  [Analytics],
  "../../../../Shared/Apify",
  { singletons: ["Analytics"] }
);

function getTimeIntervals(sinceMinutes, intervalMinutes) {
  const now = Date.now();
  const since = sinceMinutes * 60 * 1000;
  const interval = intervalMinutes * 60 * 1000;
  const start = now - since;
  const intervals = [];
  for (let i = start; i <= now; i += interval) {
    intervals.push({
      start: i,
      end: i + interval
    });
  }
  return intervals;
}

function getEventsInInterval(events, interval) {
  return events.filter(event => {
    if (!event.v?.dt?.start) return event.d >= interval.start && event.d <= interval.end;
    const eventStart = event.v.dt.start;
    const eventEnd = event.v.dt.end;
    return eventEnd >= interval.start && eventStart < interval.end;
  });
}

const dbs = {
  _dbs: new Map(),
  async get(database) {
    if (!this._dbs.has(database)) {
      // Find which connection string to use by the database name
      const dbEntry = Object.values(config.database).find(db => db.name == database);
      if (!dbEntry) throw new Error(`Database ${database} not found in config.yaml`);      
      const db = (await MongoDatabase.new(dbEntry.connectionString, database));
      this._dbs.set(database, db);
    }
    return this._dbs.get(database);
  }
}

export default async function (req, res, next) {
  const processRequest = async (data) => {

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');

    const dbEvents = (await dbs.get(config.database.analytics.name));
    const dbContent = (await dbs.get(config.database.content.name));

    const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress);

    if (req.url == "/ip") {
      res.end(ip);
      return;
    }

    // /Instances/[sinceMinutes]/[intervalMinutes]
    if (req.url.startsWith("/instances"))
    {
      const sinceMinutes = parseInt(req.url.split("/")[2] || "30");
      const intervalMinutes = parseInt(req.url.split("/")[3] || "1");
      const to = Date.now();
      const from = to - 1000 * 60 * sinceMinutes;

      const intervals = getTimeIntervals(sinceMinutes, intervalMinutes);

      const instancesPerInterval = await Promise.all(intervals.map(async interval => {
        const instancesCount = await dbContent.count("Instances", {
          CreatedDate: {
            $gte: (new Date(interval.start)),
            $lt: (new Date(interval.end))
          }
        });
        return {
          start: interval.start,
          count: instancesCount
        };
      }));

      // Sort by start time ascending and get the counts
      const counts = instancesPerInterval.sort((a, b) => a.start - b.start).map(i => i.count);

      res.end(JSON.stringify({
        total: {
          text: `Instances in the last ${TimeSpan.fromMinutes(sinceMinutes)}`,
          value: counts.reduce((a, b) => a + b, 0)
        },
        chart: {
          text: `Instances / ${TimeSpan.fromMinutes(intervalMinutes)} in the last ${TimeSpan.fromMinutes(sinceMinutes)}`,
          data: counts
        }
      }));
      
      return;
    }

    // /analytics/events/[sinceMinutes]/[intervalMinutes]
    if (req.url.startsWith("/events"))
    {
      const sinceMinutes = parseInt(req.url.split("/")[2] || "30");
      const intervalMinutes = parseInt(req.url.split("/")[3] || "1");
      const to = Date.now();
      const from = to - 1000 * 60 * sinceMinutes;

      const intervals = getTimeIntervals(sinceMinutes, intervalMinutes);

      const events = await dbEvents.find("Events", {
        "v.dt.end": { $gte: from }
      });

      const counts = intervals.map(interval => {
        // Find which events are in the interval
        const eventsInInterval = getEventsInInterval(events, interval);
        return eventsInInterval.length;
      });

      res.end(JSON.stringify({
        total: {
          text: `Events in the last ${TimeSpan.fromMinutes(sinceMinutes)}`,
          value: events.length
        },
        chart: {
          text: `Events / ${TimeSpan.fromMinutes(intervalMinutes)} in the last ${TimeSpan.fromMinutes(sinceMinutes)}`,
          data: counts
        }
      }));
      
      return;
    }

    if (req.url.startsWith("/users/online")) {
      const sinceMinutes = parseInt(req.url.split("/")[3] || "30");
      const to = (new Date()).valueOf();
      const from = to - 1000 * 60 * sinceMinutes;

      const docs = await dbEvents.aggregate("Events",
      [
        {
          $match: {
            "v.dt.end": { $gte: (Date.now() - sinceMinutes * 60 * 1000) },
            "e": "visit"
          }
        },
        {
          $group: {
            _id: "$v.user.ip",
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 }
          }
        }
      ]);
      res.end(JSON.stringify((!docs.length) ? null : docs[0].count));
      return;
    }

    // Number of visits
    if (req.url.startsWith("/visits/count")) {
      const sinceMinutes = parseInt(req.url.split("/")[3] || "30");
      const intervalMinutes = parseInt(req.url.split("/")[4] || "1");
      const to = (new Date()).valueOf();
      const from = to - 1000 * 60 * sinceMinutes;

      const visits = await dbEvents.find("Events", {
        "e": "visit",
        "v.dt.end": { $gte: (Date.now() - sinceMinutes * 60 * 1000) }
      });

      const intervals = getTimeIntervals(sinceMinutes, intervalMinutes);

      const counts = intervals.map(interval => {
        // Find which visits are in the interval
        const visitsInInterval = getEventsInInterval(visits, interval);
        return visitsInInterval.length;
      });
      
      res.end(JSON.stringify({
        total: {
          text: `Visits in the last ${TimeSpan.fromMinutes(sinceMinutes)}`,
          value: visits.length
        },
        chart: {
          text: `Visits / ${TimeSpan.fromMinutes(intervalMinutes)} in the last ${TimeSpan.fromMinutes(sinceMinutes)}`,
          data: counts
        }
      }));
      return;
    }

    // Average visit time (only active time)
    if (req.url.startsWith("/visits/time")) {
      const sinceMinutes = parseInt(req.url.split("/")[3] || "30");
      const intervalMinutes = parseInt(req.url.split("/")[4] || "1");
      const to = (new Date()).valueOf();
      const from = to - 1000 * 60 * sinceMinutes;

      const visits = await dbEvents.find("Events", {
        "e": "visit",
        "v.dt.end": { $gte: (Date.now() - sinceMinutes * 60 * 1000) }
      });

      const intervals = getTimeIntervals(sinceMinutes, intervalMinutes);

      const lengths = intervals.map(interval => {
        // Find which visits are in the interval
        const visitsInInterval = getEventsInInterval(visits, interval);
        // Calculate the average length of the visits in the interval
        let length = visitsInInterval.reduce((sum, visit) => sum + (visit.v.dt.active), 0);
        // Visit time we want to show in seconds
        length = (length / 1000);
        return parseInt(length / visitsInInterval.length);
      });
      
      res.end(JSON.stringify({
        total: {
          text: `Avg. visit time in the last ${TimeSpan.fromMinutes(sinceMinutes)}`,
          value: parseInt(lengths.reduce((sum, length) => sum + length, 0) / lengths.length)
        },
        chart: {
          text: `Avg. visit time / ${TimeSpan.fromMinutes(intervalMinutes)} in the last ${TimeSpan.fromMinutes(sinceMinutes)}`,
          data: lengths
        }
      }));
      return;

    }

    // Requests
    if (req.url.startsWith("/requests/count/"))
    {
      const sinceMinutes = parseInt(req.url.split("/")[3] || "30");
      const intervalMinutes = parseInt(req.url.split("/")[4] || "1");
      const to = (new Date()).valueOf();
      const from = to - 1000 * 60 * sinceMinutes;

      const intervals = getTimeIntervals(sinceMinutes, intervalMinutes);

      const requests = await dbEvents.find("Events", {
        "e": "requests.per.minute",
        "d": { $gte: (Date.now() - sinceMinutes * 60 * 1000) }
      });

      const counts = intervals.map(interval => {
        // Find which requests are in the interval
        const requestsInInterval = getEventsInInterval(requests, interval);
        // Sum the requests count in the interval
        let count = requestsInInterval.reduce((sum, request) => (sum + request.v), 0);
        return count;
      });

      res.end(JSON.stringify({
        total: {
          text: `Requests in the last ${TimeSpan.fromMinutes(sinceMinutes)}`,
          value: parseInt(counts.reduce((sum, count) => (sum + count), 0))
        },
        chart: {
          text: `Requests / ${TimeSpan.fromMinutes(intervalMinutes)} in the last ${TimeSpan.fromMinutes(sinceMinutes)}`,
          data: counts
        }
      }));
      return;

    }

    // /aggregate/[pipeline]
    if (req.url.startsWith("/aggregate/"))
    {
      const pipeline = JSON.parse(decodeURI(req.url.split("/")[2]));

      // Add $limit if not present
      if (!pipeline.find(p => p.$limit))
      {
        pipeline.push({ $limit: 10 });
      }

      const events = await dbEvents.aggregate("Events", pipeline);

      res.end(JSON.stringify(events));
      return;
    }

    res.end(await analyticsApify.processUrl(ip, req.url, data, { stringify: true }));
    return;
  };

  const process = async(data) => {
    try
    {
      await processRequest(data);
    }
    catch (ex)
    {
      res.end(ex.message + "\n" + ex.stack);
    }
  }

  if (req.method === 'GET') {
    process();
  }
  else if (req.method === 'POST') {
    let body = '';
    req.on('data', (data) => {
      body += data;
    });
    req.on('end', async () => {
      process(body);
    });
  }
  else {
    res.end("Unsupported method");
  }
}

