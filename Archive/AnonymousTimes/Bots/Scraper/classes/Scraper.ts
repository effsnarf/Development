import fs from "fs";
import path from "path";
const axios = require("axios");
const { JSDOM } = require("jsdom");
import { Http } from "../../../../../Shared/Http";
import { NewsArticle } from "./NewsArticle";
import { DatabaseBase } from "../../../../../Shared/Database/DatabaseBase";
import { OpenAI, Model } from "../../../../../Apis/OpenAI/classes/OpenAI";
import {
  ChatOpenAI,
  Roles,
} from "../../../../../Apis/OpenAI/classes/ChatOpenAI";

namespace Scraper {
  abstract class Base<T> {
    public async Scrape(url: string) {
      console.log(`${`Scraping`} ${url.green}...`);
      return this._scrape(url);
    }

    protected abstract _scrape(url: string): Promise<T>;

    protected static async translate(language: string, text: string) {
      const chat = await ChatOpenAI.new(
        Roles.Null,
        false,
        Model.Gpt4,
        false,
        OpenAI.effApiKey
      );

      const response = await chat.send(`Translate this to ${language} please:
        (reply with the translation and nothing else)\n\n\n${text}`);
      return response;
    }
  }

  class Dom {
    // Modify toFullUrl to work without window.location
    static toFullUrl(url: string | null, base: string): string {
      if (!url) return "";
      if (url.startsWith("/")) return `${base}${url}`;
      if (url.startsWith("./")) return `${base}${url.slice(1)}`;
      return url;
    }

    static findEl(el: Element, prop: string): Element | null {
      return el.getElementsByClassName(prop)[0] || null;
    }

    static getElProp(
      el: Element,
      prop: string | null,
      attr: string | null,
      base: string
    ): string {
      if (!prop && attr?.length) {
        if (attr == "href") {
          const aEl = el.getElementsByTagName("a")[0];
          if (aEl) return Dom.toFullUrl(aEl.getAttribute("href"), base);
          return "";
        }
        if (attr == "src") {
          const imgEl = el.getElementsByTagName("img")[0];
          if (imgEl) return Dom.toFullUrl(imgEl.getAttribute("src"), base);
          return "";
        }
      }
      el = Dom.findEl(el, prop || "") || el;
      if (!el) return "";
      if (el.tagName == "IMG") {
        let src = el.getAttribute("src");
        if (src) return Dom.toFullUrl(src, base);
        return "";
      }
      if (attr) return Dom.toFullUrl(el.getAttribute(attr), base);
      if (el.textContent?.length) return el.textContent;
      const imgEl = el.getElementsByTagName("img")[0];
      if (imgEl) return Dom.toFullUrl(imgEl.getAttribute("src"), base);
      return "?";
    }

    static getFromEl(
      el: Element,
      prop: string | null,
      attr: string | null,
      base: string
    ): string {
      return Dom.getElProp(el, prop, attr, base);
    }
  }

  export class Ynet extends Base<NewsArticle[]> {
    private constructor(
      private db: { images: DatabaseBase; articles: DatabaseBase },
      private imagesFolder: string
    ) {
      super();
    }

    static async new(
      db: { images: DatabaseBase; articles: DatabaseBase },
      imagesFolder: string
    ) {
      return new Ynet(db, imagesFolder);
    }

    private static parseDate(dateStr: string) {
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
    }

    private async downloadArticleImage(
      folderPath: string,
      articleId: number,
      url: string,
      type: string
    ) {
      const fileName = `${articleId}/${type}.jpg`;
      const filePath = path.join(folderPath, fileName);
      if (fs.existsSync(filePath)) return;
      await Http.downloadTo(url, filePath);
    }

    private async getArticles(url: string) {
      const protocol = url.split(":")[0];
      const urlBase = `${protocol}://${url.split("/")[2]}`;
      const htmlContent = await Http.fetchHtml(url);
      const dom = new JSDOM(htmlContent);
      const document = dom.window.document;

      const articles = Array.from(document.getElementsByClassName("slotView"))
        .map((el: any) => el as Element)
        .map((el: Element) => {
          const title = Dom.getFromEl(el, "slotTitle", null, urlBase);
          return {
            _id: 0,
            url: Dom.getFromEl(el, null, "href", urlBase),
            title: title,
            subtitle: Dom.getFromEl(el, "slotSubTitle", null, urlBase),
            paragraphs: [] as string[],
            images: {
              teaser: Dom.getFromEl(el, "imageView", null, urlBase),
              items: [] as string[],
            },
            date: Ynet.parseDate(
              Dom.getFromEl(el, "dateView", null, urlBase).trim()
            ).valueOf(),
          } as NewsArticle;
        });

      for (const article of articles) {
        article._id = await this.db.articles.getNewID();
        const existingArticleDoc = (
          await this.db.articles.find("Articles.Hebrew", {})
        ).find((doc: any) => doc.title == article.title);
        if (existingArticleDoc) {
          console.log(`${`Skipping`.gray} ${article.url.gray}...`);
          continue;
        }

        // Scrape article content
        console.log(`Scraping ${article.url.yellow}...`);

        const articleHtml = await Http.fetchHtml(article.url);
        const articleDom = new JSDOM(articleHtml);
        const articleDoc = articleDom.window.document;
        article.subtitle =
          articleDoc.getElementsByClassName("subTitle")[0]?.textContent ||
          article.subtitle;
        const paragraphs = [
          ...articleDoc.getElementsByClassName("text_editor_paragraph"),
        ].map((el) => el.textContent);

        article.paragraphs = paragraphs;

        // Scrape article images
        const images = [
          ...articleDoc.getElementsByClassName("gelleryOpener"),
        ].map((el) => Dom.getFromEl(el, null, "src", urlBase));
        article.images.items = images;

        // Download article images
        await this.downloadArticleImage(
          this.imagesFolder,
          article._id,
          article.images.teaser,
          "teaser"
        );
        for (let i = 0; i < article.images.items.length; i++) {
          const imageUrl = article.images.items[i];
          await this.downloadArticleImage(
            this.imagesFolder,
            article._id,
            imageUrl,
            i.toString()
          );
        }
        (article as any).images.count = article.images.items.length;
        delete (article as any).images.teaser;
        delete (article as any).images.items;

        // Translate article
        console.log(`Translating ${article.title.yellow}...`);

        try {
          const hungarian = {
            ...article,
            title: await Base.translate("hungarian", article.title),
            subtitle: await Base.translate("hungarian", article.subtitle),
            paragraphs: await Promise.all(
              article.paragraphs.map((paragraph: string) =>
                Base.translate("hungarian", paragraph)
              )
            ),
          } as NewsArticle;
          await this.db.articles.upsert("Articles.Hungarian", hungarian);
        } catch (ex: any) {
          console.log(ex.message.bgRed.white);
        }

        // Save article to database
        await this.db.articles.upsert("Articles.Hebrew", article);
      }
      return articles;
    }

    protected async _scrape(url: string) {
      const articles = await this.getArticles(url);
      return articles;
    }
  }
}

export { Scraper };
