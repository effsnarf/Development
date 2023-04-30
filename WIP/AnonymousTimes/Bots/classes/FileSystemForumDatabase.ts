import { Thread } from "../../Shared/DataTypes";
import { FileSystemDatabase } from "@shared/FileSystemDatabase";
import { ForumDatabase } from "./ForumDatabase";

class FileSystemForumDatabase extends ForumDatabase {
  db: FileSystemDatabase;

  constructor(dataDir: string) {
    super();
    this.db = new FileSystemDatabase(dataDir);
  }

  async getThreadTeasers(): Promise<Thread[]> {
    return this.db.getDocs("thread", (t) => !t.isSticky && t.isOnline);
  }

  async getOnlineThreads(): Promise<Thread[]> {
    return this.db.getDocs("thread", (t) => !t.isSticky && t.isOnline);
  }

  async getStickyThreads(): Promise<Thread[]> {
    return this.db.getDocs("thread", (t) => t.isSticky);
  }

  async upsertThread(thread: Thread) {
    return this.db.upsert("thread", thread);
  }
}

export { FileSystemForumDatabase };
