import * as colors from "colors";
import "../Shared/Extensions";
import { Timer } from "../Shared/Timer";
import { MongoClient, ObjectId } from "mongodb";

class MongoDatabase {
  private database: string;
  private client: MongoClient;
  public onMethodDone: ((
    method: string,
    args: any[],
    result: any,
    dt: any
  ) => void)[] = [];

  constructor(connectionString: string, database: string) {
    this.database = database;
    this.client = new MongoClient(connectionString);
  }

  public static async new(connectionString: string, database: string) {
    // console.log("Connecting to MongoDB...".gray);
    // console.log(`  ${connectionString.yellow}`);
    // console.log(`  ${database.green}`);

    // Check whether the database exists
    const databaseNames = await MongoDatabase.getDatabaseNames(
      connectionString
    );
    if (!databaseNames.find((d) => d === database)) {
      throw new Error(`Database ${database} not found.`);
    }

    const db = new MongoDatabase(connectionString, database);
    await db.client.connect();
    return db;
  }

  async find(
    collectionName: string,
    query: any,
    sort: any = {},
    limit?: number,
    skip?: number,
    lowercaseFields: boolean = true
  ) {
    let docs = await this.aggregate(collectionName, [
      {
        $match: query,
      },
      {
        $sort: sort,
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);

    if (lowercaseFields)
      docs = docs.map((d) => {
        if (typeof d == "object") return Object.toCamelCaseKeys.apply(d);
        return d;
      });
    return docs;

    return docs;
  }

  async aggregate(collectionName: string, pipeline: any[]) {
    // Remove any empty stages (e.g. { $match: null } or { $match: {} } or { $sort: {} })
    pipeline = pipeline.filter((p) => {
      const values = Object.values(p);
      if (!values) return false;
      // { $match: {...}, [something else]: {...} } - we want to remove this
      if (values.length != 1) return false;

      // { $match: null } - we want to remove this
      if (values[0] == null) return false;

      if (typeof values[0] == "object") {
        const data = values[0] as any;
        // { $match: {} } - we want to remove this
        if (Object.keys(data).length == 0) return false;
      }

      return true;
    });

    const timer = Timer.start();

    const collection = await this.getCollection(collectionName);
    const docs = await (await collection.aggregate(pipeline)).toArray();

    timer.stop();

    this.removeDollarSigns(pipeline);

    this.upsert(
      "_DbAnalytics",
      {
        dt: Date.now(),
        event: "aggregate",
        collection: collectionName,
        pipeline: pipeline,
      },
      false
    );

    return docs;
  }

  async upsert(collectionName: string, doc: any, returnNewDoc: boolean = true) {
    const collection = await this.getCollection(collectionName);

    if (!doc._id) doc._id = await this.getNewID();

    const result = await collection.updateOne(
      { _id: doc._id },
      { $set: doc },
      {
        upsert: true,
      }
    );

    if (!returnNewDoc) return doc._id;

    const newDoc = await collection.findOne({ _id: doc._id });

    return newDoc;
  }

  async count(collectionName: string, query: any) {
    const collection = await this.getCollection(collectionName);

    const result = await collection.countDocuments(query);

    return result;
  }

  async getNewIDs(count: number) {
    const collection = await this.getCollection("_IdentityIntegers");

    const result = await collection.findOneAndUpdate(
      { _id: null } as any,
      { $inc: { uniqueID: count } },
      { upsert: true, returnOriginal: true } as any
    );

    const start = result.value?.uniqueID || 1;
    // Return an array of IDs
    return Array.from(Array(count).keys()).map((i) => start + i);
  }

  async getNewID() {
    const collection = await this.getCollection("_Settings");

    const result = await collection.findOneAndUpdate(
      {},
      { $inc: { UniqueID: 1 } },
      { upsert: true, returnOriginal: false } as any
    );

    return result.value?.UniqueID || 1;
  }

  async getCollectionNames() {
    const collections = await (await this.client.db(this.database))
      .listCollections()
      .toArray();
    return collections.map((c) => c.name);
  }

  async getCollection(collectionName: string) {
    return await (
      await this.client.db(this.database)
    ).collection(collectionName);
  }

  private static async getDatabaseNames(connectionString: string) {
    const client = new MongoClient(connectionString);
    await client.connect();
    const databases = await client.db().admin().listDatabases();
    await client.close();
    return databases.databases.map((d) => d.name);
  }

  private removeDollarSigns(obj: any) {
    obj.traverse((node: any, key: string, value: any) => {
      if (key.startsWith("$")) {
        node[key.substring(1)] = value;
        delete node[key];
      }
    }, true);
  }
}

export { MongoDatabase };
