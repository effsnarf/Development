import { DatabaseBase } from "./DatabaseBase";
import { FileSystemDatabase } from "./FileSystemDatabase";
import { MongoDatabase } from "./MongoDatabase";

class Database {
  static async new(configNode: any): Promise<DatabaseBase> {
    if (configNode.path)
      return FileSystemDatabase.new(configNode.path as string);
    if (configNode.connectionString) {
      return MongoDatabase.new(
        configNode.connectionString,
        configNode.database
      );
    }
    throw new Error(
      "Invalid database configuration: " + JSON.stringify(configNode)
    );
  }
}

export { Database };
