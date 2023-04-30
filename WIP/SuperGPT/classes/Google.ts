const unirest = require("unirest");
const cheerio = require("cheerio");

const getOrganicData = (query: string, callback: any) => {
  return unirest
    .get(
      `https://www.google.com/search?q=${encodeURIComponent(query)}&gl=us&hl=en`
    )
    .headers({
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36",
    })
    .then((response: any) => {
      let $ = cheerio.load(response.body);

      let titles: any[] = [];
      let links: any[] = [];
      let snippets: any[] = [];
      let displayedLinks: any[] = [];

      $(".yuRUbf > a > h3").each((i: number, el: any) => {
        titles[i] = $(el).text();
      });
      $(".yuRUbf > a").each((i: number, el: any) => {
        links[i] = $(el).attr("href");
      });
      $(".g .VwiC3b ").each((i: number, el: any) => {
        snippets[i] = $(el).text();
      });
      $(".g .yuRUbf .NJjxre .tjvcx").each((i: number, el: any) => {
        displayedLinks[i] = $(el).text();
      });

      const organicResults = [];

      for (let i = 0; i < titles.length; i++) {
        organicResults[i] = {
          title: titles[i],
          url: links[i],
          snippet: snippets[i],
          content: {
            texts: null,
          },
        };
      }

      callback(organicResults);
    });
};

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  content: {
    texts: string[];
  };
}

class Google {
  static async search(query: string): Promise<SearchResult[]> {
    return new Promise((resolve, reject) => {
      getOrganicData(query, (organicResults: any) => {
        resolve(organicResults);
      });
    });
  }
}

export { Google };
