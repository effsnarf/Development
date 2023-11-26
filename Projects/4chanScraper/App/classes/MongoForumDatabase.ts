import "../../../../Shared/Extensions";
import { Forum, Thread, ThreadTeaser } from "../classes/DataTypes";
import { MongoDatabase } from "../../../../Shared/Database/MongoDatabase";
import { ForumDatabase } from "./ForumDatabase";

class MongoForumDatabase extends ForumDatabase {
  private db!: MongoDatabase;

  private constructor(connectionString: string, database: string) {
    super();
  }

  static async new(connectionString: string, database: string) {
    const db = new MongoForumDatabase(connectionString, database);
    db.db = await MongoDatabase.new(connectionString, database);
    return db;
  }

  async getThreadTeasers() {
    const threads = (await this.db.find(
      "Threads",
      {
        "forum.id": "fit",
        //isOnline: true,
        isSticky: { $ne: true },
        analysis: { $exists: true },
      },
      {
        modified: -1,
        "posts.count": -1,
      }
    )) as Thread[];

    const teasers = threads.map((t) => {
      const firstPost = t.posts.items[0];

      return {
        id: t.id,
        entity: t.analysis.entity,
        title: t.analysis.title,
        subtitle: (firstPost.title || firstPost.comment)
          .stripHtmlTags()
          .decodeHtml()
          .shorten(200),
        summary: t.analysis.article,
        quotes: t.quotes,
        forum: t.forum,
        posts: {
          count: t.posts.count,
        },
        image: firstPost.image,
        created: t.created,
        modified: t.modified,
      } as ThreadTeaser;
    });

    return teasers;
  }

  async getOnlineThreads(forum: Forum) {
    return (await this.db.find("Threads", {
      forum: { id: forum.id },
      isOnline: true,
      isSticky: { $ne: true },
    })) as Thread[];
  }

  async getStickyThreads(forum: Forum) {
    return (await this.db.find("Threads", {
      forum: { id: forum.id },
      isSticky: true,
    })) as Thread[];
  }

  async upsertThread(thread: Thread) {
    await this.db.upsert("Threads", thread);
  }
}

export { MongoForumDatabase };
