import axios from "axios";
import { Forum, Image } from "../classes/DataTypes";
import { Database } from "../../../../Shared/Database";

interface Item {
  forum: Forum;
  image: Image;
}

class ImageScraper {
  private items: Map<string, Item> = new Map();
  private db: Database;
  private enabled: boolean;

  constructor(db: Database, enabled: boolean) {
    this.db = db;
    this.enabled = enabled;
    this.start();
  }

  async start() {
    return new Promise(async (resolve) => {
      while (true) {
        let item = this.getNextItem();
        if (!item) {
          await this.sleep(1000);
          continue;
        }
        try {
          await this.downloadImage(item.forum, item.image);
          this.items.delete(item.image.filename);
        } catch (ex: any) {
          console.log(`${`Image`.gray} ${`Error`.red}: ${ex.message}`);
        }
      }
    });
  }

  queueSize() {
    return this.items.size;
  }

  private async downloadImage(forum: Forum, image: Image) {
    if (!this.enabled) return;
    let id = parseInt(image.filename);
    let ext = image.filename.split(".").pop() as string;
    if (await this.db.exists(`image`, id, ext)) return;
    let url = `https://i.4cdn.org/${forum.id}/${image.filename}`;
    const buffer = await this.downloadFile(url);
    this.db.setBinary(`image`, id, ext, buffer);
  }

  private async downloadFile(url: string) {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data, "binary");
    return buffer;
  }

  private getNextItem(): Item | null {
    return this.items.values().next().value;
  }

  enqueue(forum: Forum, image: Image) {
    if (this.items.has(image.filename)) return;
    let item = { forum, image };
    this.items.set(image.filename, item);
  }

  async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export { ImageScraper };
