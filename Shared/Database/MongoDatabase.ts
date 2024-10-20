import * as colors from "colors";
import "../Extensions";
import { Objects } from "../Extensions.Objects";
import { Timer } from "../Timer";
import { DatabaseBase } from "./DatabaseBase";
import { MongoClient, ObjectId } from "mongodb";
import { DbOperation, DbField } from "./Database";

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

  async execute(script: string, args: any[]) {
    const db = await this.client.db(this.database);

    const result = await db.command({ eval: script, args: args });

    let data = result.retval._batch || result.retval || result;

    if (data.toArray && typeof data.toArray == "function") {
      data = await data.toArray();
    }

    return data;
  }

  async find(
    collectionName: string,
    query: any,
    sort?: any,
    limit?: number | undefined,
    skip?: number | undefined,
    lowercaseFields?: boolean | undefined
  ) {
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
    try {
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
        await collection.aggregate(pipeline, { maxTimeMS: 30000 })
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
    } catch (ex: any) {
      console.log("Failed to aggregate");
      console.log(collectionName);
      console.log(Objects.inspect(pipeline, false, null, true));
      throw ex;
    }
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

  async getEntityFields(entityName: string): Promise<DbField[]> {
    const collection = await this.getCollection(entityName);

    const doc = await collection.findOne({});

    if (!doc) return [];

    const fields = Object.keys(doc)
      .sort()
      .map((k) => {
        return {
          name: k,
          type: Objects.getTypeName(doc[k]),
        };
      });

    return fields;
  }

  async getCurrentOperations(minElapsed?: number): Promise<DbOperation[]> {
    try {
      const db = await this.client.db(this.database);

      // Run the currentOp command
      const result = await db.admin().command({ currentOp: 1, $all: true });

      let ops = result.inprog
        // Filter out system operations
        .filter((op: any) => op.ns?.length)
        .filter((op: any) => !op.ns?.startsWith("system."))
        .map((op: any) => {
          const startTime = new Date(op.currentOpTime).getTime();
          const elapsedTime = op.microsecs_running
            ? parseInt(op.microsecs_running.toString()) / 1000
            : 0;

          if (minElapsed && elapsedTime < minElapsed) return null;

          return {
            id: op.opid.toString(),
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

      ops = ops.filter((op: any) => op != null);

      return ops;
    } catch (e) {
      console.error("Failed to retrieve current operations", e);
      throw e;
    }
  }

  async killOp(opID: number): Promise<void> {
    const db = await this.client.db("admin");
    await db.command({ killOp: 1, op: opID });
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
