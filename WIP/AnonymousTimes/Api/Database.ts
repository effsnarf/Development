// Exposts certain database functions to the API
import { Config } from "../Shared/Config";
import { Thread, ThreadTeaser } from "../Shared/DataTypes";
import { ForumDatabase } from "../Bots/classes/ForumDatabase";
import { MongoForumDatabase } from "../Bots/classes/MongoForumDatabase";

class Database {
  private forumDb!: ForumDatabase;
  static config: Config;

  static async new() {
    const database = new Database();
    database.forumDb = await MongoForumDatabase.new(
      Database.config.db.mongo.connection,
      Database.config.db.mongo.database
    );
    return database;
  }

  async getThreadTeasers(): Promise<ThreadTeaser[]> {
    const threads = await this.forumDb.getThreadTeasers();
    return threads;
  }
}

export { Database };
