import { DatabaseBase } from "./DatabaseBase";
import { NullDatabase } from "./NullDatabase";
import { ReadWriteDatabase } from "./ReadWriteDatabase";
import { FileSystemDatabase } from "./FileSystemDatabase";
import { MongoDatabase } from "./MongoDatabase";

class Database {
  static async new(config: any): Promise<DatabaseBase> {
    if (!config) return NullDatabase.new();
    if (config.read || config.write) return ReadWriteDatabase.new(config);
    if (config.path) return FileSystemDatabase.new(config.path as string);
    if (config.connectionString) {
      return MongoDatabase.new(config.connectionString, config.database);
    }
    throw new Error(
      "Invalid database configuration: " + JSON.stringify(config)
    );
  }
}

export { Database };
