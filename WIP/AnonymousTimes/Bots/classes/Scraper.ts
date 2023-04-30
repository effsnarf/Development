import * as colors from "colors";
import axios from "axios";
import "@shared/Extensions";
import { Config } from "../../Shared/Config";
import { RateLimiter } from "@shared/RateLimiter";
import { Forum, Thread, Image, Timestamp } from "../../Shared/DataTypes";
import { ImageScraper } from "./ImageScraper";
import { FileSystemDatabase } from "@shared/FileSystemDatabase";
import { MongoForumDatabase } from "./MongoForumDatabase";

class Scraper {
  private config: Config;
  private fileSystemDb: FileSystemDatabase;
  private db!: MongoForumDatabase;
  private imageScraper: ImageScraper;
  private rateLimiter: RateLimiter = new RateLimiter();

  private constructor(config: Config) {
    this.config = config;
    this.fileSystemDb = new FileSystemDatabase(config.db.fileSystem.dataDir);
    this.imageScraper = new ImageScraper(
      this.fileSystemDb,
      config.images.download
    );
  }

  static async new(config: Config) {
    const scraper = new Scraper(config);
    scraper.db = await MongoForumDatabase.new(
      config.db.mongo.connection,
      config.db.mongo.database
    );
    return scraper;
  }

  async start() {
    await this.moveFileSystemDbToMongoDb();

    this.rateLimiter.setLimit("api", 1100);
    //
    console.log("Starting scraper".cyan);

    let forums = this.config.fourChan.boards.map(
      (id: any) => ({ id } as Forum)
    );

    while (true) {
      for (const forum of forums) {
        await this.scrapeForum(forum);
      }
    }
  }

  private async moveFileSystemDbToMongoDb() {
    console.log("Moving file system db to mongo db".cyan);
    let threads = await this.fileSystemDb.getDocs("thread", (t) => true);
    console.log(
      `  ${threads.length} ${`threads found in the file system`.gray}`
    );
    let complete = 0;
    for (const thread of threads) {
      let progress = complete / threads.length;
      await this.db.upsertThread(thread);
      await this.fileSystemDb.delete("thread", thread.id);
      complete++;
      console.log(
        `${(progress * 100).toFixed(2)}% ${`threads moved to mongo db`.gray}`
      );
    }
  }

  private async scrapeForum(forum: Forum) {
    return new Promise(async (resolve) => {
      ///while (true)
      {
        console.log(`/${forum.id}/`.green);
        let onlineThreads = await this.getOnlineThreads(forum);
        console.log(`  ${onlineThreads.length} ${`online threads`.gray}`);
        let stickyThreads = await this.db.getStickyThreads(forum);
        console.log(`  ${stickyThreads.length} ${`sticky threads`.gray}`);
        let savedOnlineThreads = await this.db.getOnlineThreads(forum);
        console.log(
          `  ${savedOnlineThreads.length} ${`saved online threads`.gray}`
        );
        console.log();

        // For each saved thread, check if it's still online
        // and update its posts

        let complete = 0;
        for (const savedThread of savedOnlineThreads) {
          let progress = complete / savedOnlineThreads.length;
          let saveThreadIsOnline = onlineThreads.find(
            (t: any) => t.id === savedThread.id
          )
            ? true
            : false;
          if (!saveThreadIsOnline) {
            savedThread.isOnline = false;
          }
          if (saveThreadIsOnline) {
            try {
              let posts = await this.getOnlinePosts(savedThread, progress);
              await this.updateThread(savedThread, posts);
            } catch (ex: any) {
              if (ex.response?.status == 404) {
                savedThread.isOnline = false;
              } else {
                console.log(ex.toString().red);
              }
            }
          }
          await this.db.upsertThread(savedThread);
          complete++;
        }

        // For new threads, get the posts and save it to the database
        let newThreads = onlineThreads
          // Ignore sticky threads
          .filter((ot: any) => !stickyThreads.some((st) => st.id === ot.id))
          // Ignore saved threads
          .filter(
            (ot: any) => !savedOnlineThreads.some((st) => st.id === ot.id)
          );
        console.log(`${newThreads.length} ${`new threads`.gray}`);
        // For each new thread, get the posts and save it to the database
        complete = 0;
        for (const newThread of newThreads) {
          let progress = complete / newThreads.length;
          try {
            let posts = await this.getOnlinePosts(newThread, progress);
            await this.updateThread(newThread, posts);
            await this.db.upsertThread(newThread);
          } catch (ex: any) {
            if (ex.response?.status == 404) {
            } else {
              console.log(ex.toString().red);
            }
          }
          complete++;
        }
      }
      resolve(null);
    });
  }

  private async updateThread(thread: Thread, posts: any[]) {
    thread.created = posts[0].created;
    thread.modified = posts.last().created;
    thread.checked = Timestamp.now();
    thread.posts = {
      count: posts.length,
      items: posts,
    };
    // Download any images
    for (const post of posts.filter((p) => p.image))
      this.imageScraper.enqueue(thread.forum, post.image);
  }

  async getOnlineThreads(forum: Forum) {
    const url = `https://a.4cdn.org/${forum.id}/threads.json`;
    const json = await this.getUrlJson(url);
    let threads = json.flatMap((page: any) => page.threads);
    return threads.map((t: any) => {
      return {
        id: parseInt(t.no),
        forum: forum,
        posts: {
          count: (t.replies || 0) + 1,
        },
        modified: { dt: parseInt(t.last_modified) },
        isOnline: true,
      };
    });
  }

  async getOnlinePosts(thread: Thread, progress: number) {
    console.log(
      `${thread.forum.id.green}/${`${thread.id}`.white} ${
        `${thread.posts?.count} posts`.gray
      } ${
        `(${Math.round(progress * 100)}%)`.green
      } ${`(${this.imageScraper.queueSize()} ${`images in queue`.gray})`}`
    );
    this.rateLimiter.setLimit(`thread.${thread.id}`, 30);
    await this.rateLimiter.limit([`thread.${thread.id}`]);
    const url = `https://a.4cdn.org/${thread.forum.id}/thread/${thread.id}.json`;
    const json = await this.getUrlJson(url, thread.posts.items?.last().created);
    let posts = json.posts;
    thread.isSticky = posts[0].sticky === 1;
    return posts.map((p: any) => {
      return {
        id: parseInt(p.no),
        title: p.sub,
        comment: p.com,
        image: this.getPostImage(p),
        created: new Timestamp(p.time * 1000),
      };
    });
  }

  getPostImage(post: any): Image | null {
    if (!post.ext) return null;
    return {
      filename: `${post.tim}${post.ext}`,
    } as Image;
  }

  async getUrlJson(url: string, ifModifiedSince?: Timestamp) {
    await this.rateLimiter.limit(["api"]);
    const headers: any = {};
    if (ifModifiedSince)
      headers["If-Modified-Since"] = new Date(ifModifiedSince.dt).toUTCString();
    const response = await axios.get(url, { headers });
    return response.data;
  }
}

export { Scraper };
