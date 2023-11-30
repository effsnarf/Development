import { DatabaseBase } from "./DatabaseBase";
import { NullDatabase } from "./NullDatabase";
import { ReadWriteDatabase } from "./ReadWriteDatabase";
import { FileSystemDatabase } from "./FileSystemDatabase";
import { MongoDatabase } from "./MongoDatabase";

type DbField = {
  name: string;
  type: string;
};

type DbOperation = {
  id: string;
  entity: string; // Refers to SQL tables or MongoDB collections
  type: string; // Adjusted from operationType to type
  command: string;
  state: string;
  time: {
    started: number; // Timestamp as a plain number
    elapsed: number; // Elapsed time in milliseconds
  };
  client: string; // Client information, such as IP address, client ID, etc.
  resources: {
    cpu: string;
    memory: string;
    disk: string;
    other: string;
  };
  errors: string[]; // Array of strings for errors
  user: string; // User who initiated the operation
};

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

export { Database, DbOperation, DbField };
