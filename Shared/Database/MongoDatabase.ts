import * as colors from "colors";
import "../Extensions";
import { Objects } from "../Extensions.Objects";
import { Timer } from "../Timer";
import { DatabaseBase } from "./DatabaseBase";
import { MongoClient, ObjectId } from "mongodb";
import { DbOperation } from "./Database";

interface MongoDatabaseOptions {
  verifyDatabaseExists: boolean;
  lowercaseFields: boolean | undefined;
}
class MongoDatabase extends DatabaseBase {
  private client: MongoClient;

  private constructor(
    connectionString: string,
    public database: string,
    public options: MongoDatabaseOptions
  ) {
    super();
    this.client = new MongoClient(connectionString);
  }

  public static async new(
    connectionString: string,
    database: string,
    options: MongoDatabaseOptions = {
      verifyDatabaseExists: false,
      lowercaseFields: undefined,
    }
  ) {
    if (options.verifyDatabaseExists) {
      // Check whether the database exists
      const databaseNames = await MongoDatabase.getDatabaseNames(
        connectionString
      );
      if (!databaseNames.find((d) => d === database)) {
        throw new Error(
          `Database ${database} not found (${connectionString})).`
        );
      }
    }

    const db = new MongoDatabase(connectionString, database, options);
    await db.init();
    return db;
  }

  async init() {
    await this.client.connect();
  }

  async get(key: any): Promise<any> {
    return await this.findOneByID(DatabaseBase._mapCollectionName, key);
  }

  async set(key: any, value: any): Promise<void> {
    await this.upsert(DatabaseBase._mapCollectionName, { _id: key, ...value });
  }

  async has(key: any): Promise<boolean> {
    return (await this.get(key)) != null;
  }

  async find(
    collectionName: string,
    query: any,
    sort?: any,
    limit?: number | undefined,
    skip?: number | undefined,
    lowercaseFields?: boolean | undefined
  ) {
    if (!limit) limit = 10;

    const pipeline = [
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
    ];

    let docs = await this.aggregate(collectionName, pipeline);

    if (lowercaseFields) docs = Objects.toCamelCaseKeys(docs) as any[];

    return docs;
  }

  async *findIterable(
    collectionName: string,
    query: any,
    sort?: any,
    limit?: number | undefined,
    skip?: number | undefined,
    lowercaseFields?: boolean | undefined
  ): AsyncGenerator<any, any, unknown> {
    if (!limit) limit = Number.MAX_SAFE_INTEGER;

    if (skip) {
      const docs = await this.find(
        collectionName,
        query,
        sort,
        limit,
        skip,
        lowercaseFields
      );
      for (const doc of docs) {
        yield doc;
      }
    } else {
      if (!sort || !Object.keys(sort)) throw new Error("Sort is required.");
      const batchSize = 100;
      let skip = 0;
      let docs = await this.find(
        collectionName,
        query,
        sort,
        batchSize,
        skip,
        lowercaseFields
      );
      while (docs.length > 0) {
        for (const doc of docs) {
          yield doc;
        }
        skip += batchSize;
        docs = await this.find(
          collectionName,
          query,
          sort,
          batchSize,
          skip,
          lowercaseFields
        );
      }
    }
  }

  async aggregate(
    collectionName: string,
    pipeline: any[],
    lowercaseFields?: boolean | undefined
  ) {
    if (typeof lowercaseFields != "boolean")
      lowercaseFields = this.options.lowercaseFields;

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
    let docs = await (
      await collection.aggregate(pipeline, { maxTimeMS: 5000 })
    ).toArray();

    timer.stop();

    pipeline = this.removeDollarSigns(pipeline);

    this.upsert(
      "_DbAnalytics",
      {
        dt: Date.now(),
        elapsed: timer.elapsed,
        event: "aggregate",
        collection: collectionName,
        pipeline: pipeline,
      },
      false
    );

    if (lowercaseFields)
      docs = docs.map((d) => {
        if (typeof d == "object") return Objects.toCamelCaseKeys(d);
        return d;
      });

    return docs;
  }

  protected async _upsert(collectionName: string, doc: any) {
    if (this.options.lowercaseFields)
      doc = Objects.toCamelCaseKeys(Objects.clone(doc));

    const collection = await this.getCollection(collectionName);

    const result = await collection.updateOne(
      { _id: doc._id },
      { $set: doc },
      {
        upsert: true,
      }
    );
  }

  protected async _delete(collectionName: string, query: any): Promise<void> {
    const collection = await this.getCollection(collectionName);

    await collection.deleteMany(query);
  }

  async count(collectionName: string, query?: any) {
    const collection = await this.getCollection(collectionName);

    const result = await collection.countDocuments(query);

    return result;
  }

  protected async _setNewID(newID: number) {
    const collection = await this.getCollection("_Settings");

    await collection.updateOne(
      { name: "global.unique.id" },
      { $set: { value: newID } },
      { upsert: true }
    );
  }

  protected async _getNewIDs(count: number) {
    const collection = await this.getCollection("_Settings");

    const result = await collection.findOneAndUpdate(
      { name: "global.unique.id" },
      { $inc: { value: count } },
      { upsert: true, returnOriginal: true } as any
    );

    const start = result.value?.value || 1;
    // Return an array of IDs
    return Array.from(Array(count).keys()).map((i) => start + i);
  }

  async getEntityNames() {
    const collections = await (await this.client.db(this.database))
      .listCollections()
      .toArray();
    return collections.map((c) => c.name).sort();
  }

  async getCurrentOperations(): Promise<DbOperation[]> {
    const client = this.client;
    try {
      await client.connect();
      const db = await client.db(this.database);

      // Run the currentOp command
      const result = await db.admin().command({ currentOp: 1, $all: true });
      return result.inprog.map((op: any) => {
        const startTime = new Date(op.currentOpTime).getTime();
        const elapsedTime = op.microsecs_running
          ? parseInt(op.microsecs_running.toString()) / 1000
          : 0;

        return {
          operationID: op.opid.toString(),
          entity: op.ns ? op.ns.split(".")[1] : "", // Extract collection name from namespace
          type: op.op,
          command: op.command,
          state: op.active ? "active" : "inactive",
          time: {
            started: startTime,
            elapsed: elapsedTime,
          },
          client: op.client || "",
          resources: {
            cpu: "", // MongoDB does not provide direct CPU, memory, disk usage per operation
            memory: "",
            disk: "",
            other: "",
          },
          errors: op.errmsg ? [op.errmsg] : [],
          user: op.clientMetadata?.application?.name || "",
        };
      });
    } catch (e) {
      console.error("Failed to retrieve current operations", e);
      throw e;
    } finally {
      await client.close();
    }
  }

  async getCollection(collectionName: string) {
    return await (
      await this.client.db(this.database)
    ).collection(collectionName);
  }

  private static async getDatabaseNames(connectionString: string) {
    try {
      const client = new MongoClient(connectionString);
      await client.connect();
      const databases = await client.db().admin().listDatabases();
      await client.close();
      return databases.databases.map((d) => d.name);
    } catch (ex: any) {
      console.log("Connection string: ");
      console.log(connectionString);
      throw ex;
    }
  }

  private removeDollarSigns(obj: any) {
    obj = Objects.clone(obj);
    Objects.traverse(obj, (node: any, key: string, value: any) => {
      if (key.startsWith("$")) {
        node[key.substring(1)] = value;
        delete node[key];
      }
    });
    return obj;
  }
}

export { MongoDatabase };
