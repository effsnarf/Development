import "colors";
import { Configuration } from "@shared/Configuration";
import { Loading } from "../../../../Shared/Loading";
import { Database } from "../../../../Shared/Database/Database";
import { Scraper } from "./classes/Scraper";

(async () => {
  const config = (await Configuration.new()).data;
  const db = {
    images: await Database.new(config.article.images.database),
    ynet: await Database.new(config.ynet.database),
  };

  async function main() {
    const url = "https://www.ynet.co.il/news/category/185";
    try {
      const scraper = Scraper.Ynet.new(
        {
          images: db.images,
          articles: db.ynet,
        },
        config.article.images.folder
      );
      (await scraper).Scrape(url);
    } catch (error) {
      console.error("Error:", error);
    } finally {
    }
  }

  await main();
})();
