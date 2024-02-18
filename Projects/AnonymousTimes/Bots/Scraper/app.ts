import fs from "fs";
import "colors";
import path from "path";
import { Configuration } from "@shared/Configuration";
import { Loading } from "../../../../Shared/Loading";
import { Database } from "../../../../Shared/Database/Database";
import { OpenAI, Model } from "../../../../Apis/OpenAI/classes/OpenAI";
import { ChatOpenAI, Roles } from "../../../../Apis/OpenAI/classes/ChatOpenAI";
const axios = require("axios");
const { JSDOM } = require("jsdom");

const parseDate = (dateStr: string) => {
  const parts = dateStr.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid date format");
  }

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
  const year = parseInt(parts[2], 10);

  // Adjust year for shorthand notation (e.g., '24' to '2024')
  const fullYear = year < 100 ? year + 2000 : year;

  return new Date(fullYear, month, day);
};

const downloadImage = async (url: string, filePath: string) => {
  try {
    const folder = path.dirname(filePath);

    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

    const response = await axios.get(url, {
      responseType: "stream",
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise<void>((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (error) {
    console.error("Error downloading the image:", error);
    throw error;
  }
};

(async () => {
  const config = (await Configuration.new()).data;
  const db = await Database.new(config.database);

  const chat = await ChatOpenAI.new(
    Roles.Null,
    false,
    Model.Gpt4,
    false,
    OpenAI.effApiKey
  );

  const translate = async (language: string, text: string) => {
    const response = await chat.send(`Translate this to ${language} please:
    (reply with the translation and nothing else)\n\n\n${text}`);
    return response;
  };

  const downloadArticleImage = async (
    articleId: number,
    url: string,
    type: string
  ) => {
    const fileName = `${articleId}/${type}.jpg`;
    const filePath = path.join(config.images.path, fileName);
    if (fs.existsSync(filePath)) return;
    await downloadImage(url, filePath);
  };

  async function fetchHtml(url: string): Promise<string> {
    const response = await axios.get(url);
    return response.data;
  }

  async function processHtml(htmlContent: string) {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // Modify toFullUrl to work without window.location
    function toFullUrl(url: string | null, base: string): string {
      if (!url) return "";
      if (url.startsWith("/")) return `${base}${url}`;
      if (url.startsWith("./")) return `${base}${url.slice(1)}`;
      return url;
    }

    function findEl(el: Element, prop: string): Element | null {
      return el.getElementsByClassName(prop)[0] || null;
    }

    function getElProp(
      el: Element,
      prop: string | null,
      attr: string | null,
      base: string
    ): string {
      if (!prop && attr?.length) {
        if (attr == "href") {
          const aEl = el.getElementsByTagName("a")[0];
          if (aEl) return toFullUrl(aEl.getAttribute("href"), base);
          return "";
        }
        if (attr == "src") {
          const imgEl = el.getElementsByTagName("img")[0];
          if (imgEl) return toFullUrl(imgEl.getAttribute("src"), base);
          return "";
        }
      }
      el = findEl(el, prop || "") || el;
      if (!el) return "";
      if (el.tagName == "IMG") {
        let src = el.getAttribute("src");
        if (src) return toFullUrl(src, base);
        return "";
      }
      if (attr) return toFullUrl(el.getAttribute(attr), base);
      if (el.textContent?.length) return el.textContent;
      const imgEl = el.getElementsByTagName("img")[0];
      if (imgEl) return toFullUrl(imgEl.getAttribute("src"), base);
      return "?";
    }

    function getFromEl(
      el: Element,
      prop: string | null,
      attr: string | null,
      base: string
    ): string {
      return getElProp(el, prop, attr, base);
    }

    // This part of the code should be used in a context where `document` is available,
    // such as in a browser or a jsdom environment.
    async function extractArticles(document: Document, base: string) {
      const articles = Array.from(
        document.getElementsByClassName("slotView")
      ).map((el) => {
        const title = getFromEl(el, "slotTitle", null, base);
        const _id = title.hashCode();
        return {
          _id,
          hebrew: {
            title: title,
            subtitle: getFromEl(el, "slotSubTitle", null, base),
            paragraphs: [] as string[],
          },
          hungarian: {
            title: "",
            subtitle: "",
            paragraphs: [] as string[],
          },
          images: {
            teaser: getFromEl(el, "imageView", null, base),
            items: [] as string[],
          },
          url: getFromEl(el, null, "href", base),
          date: parseDate(
            getFromEl(el, "dateView", null, base).trim()
          ).valueOf(),
        };
      });

      for (const article of articles) {
        const existingArticleDoc = (await db.find("Articles", {})).find(
          (doc) => doc._id == article._id
        );
        if (existingArticleDoc) {
          console.log(`${`Skipping`.gray} ${article.url.gray}...`);
          continue;
        }

        // Scrape article content
        console.log(`Scraping ${article.url.yellow}...`);

        const articleHtml = await fetchHtml(article.url);
        const articleDom = new JSDOM(articleHtml);
        const articleDoc = articleDom.window.document;
        article.hebrew.subtitle =
          articleDoc.getElementsByClassName("subTitle")[0]?.textContent ||
          article.hebrew.subtitle;
        const paragraphs = [
          ...articleDoc.getElementsByClassName("text_editor_paragraph"),
        ].map((el) => el.textContent);

        article.hebrew.paragraphs = paragraphs;

        // Scrape article images
        const images = [
          ...articleDoc.getElementsByClassName("gelleryOpener"),
        ].map((el) => getFromEl(el, null, "src", base));
        article.images.items = images;

        // Download article images
        await downloadArticleImage(
          article._id,
          article.images.teaser,
          "teaser"
        );
        for (let i = 0; i < article.images.items.length; i++) {
          const image = article.images.items[i];
          await downloadArticleImage(article._id, image, i.toString());
        }
        (article as any).images.count = article.images.items.length;
        delete (article as any).images.teaser;
        delete (article as any).images.items;

        // Translate article
        console.log(`Translating ${article.hebrew.title.yellow}...`);

        try {
          article.hungarian = {
            title: await translate("hungarian", article.hebrew.title),
            subtitle: await translate("hungarian", article.hebrew.subtitle),
            paragraphs: await Promise.all(
              article.hebrew.paragraphs.map((paragraph) =>
                translate("hungarian", paragraph)
              )
            ),
          };
        } catch (ex: any) {
          console.log(ex.message.bgRed.white);
        }

        // Save article to database
        await db.upsert("Articles", article);
      }
      return articles;
    }

    // Example usage in a jsdom context:
    const articles = await extractArticles(
      dom.window.document,
      dom.window.location.href
    );
  }

  async function main() {
    const url = "https://www.ynet.co.il/news/category/185";
    console.log(`${`Scraping`} ${url.green}...`);
    try {
      //const articles = await db.find("Articles", {});
      //console.log(articles);
      const htmlContent = await fetchHtml(url);
      await processHtml(htmlContent);
    } catch (error) {
      console.error("Error:", error);
    } finally {
    }
  }

  await main();
})();
