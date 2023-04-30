import { Forum, Thread, ThreadTeaser } from "../../Shared/DataTypes";

abstract class ForumDatabase {
  abstract getThreadTeasers(): Promise<ThreadTeaser[]>;
  abstract getOnlineThreads(forum: Forum): Promise<Thread[]>;
  abstract getStickyThreads(forum: Forum): Promise<Thread[]>;
  abstract upsertThread(thread: Thread): Promise<void>;
}

export { ForumDatabase };
