import { Apify } from "../../../../Shared/Apify/Apify";
import { SeoArticles } from "../../../Api/SeoArticles";

const apify = new Apify.Server(
  null,
  null,
  "/api",
  [SeoArticles],
  "@shared/Apify"
);

export default async function (req: any, res: any, next: any) {
  const process = async (req: any, reqBody?: string) => {
    const relUrl = req.url.substring(4);
    let result = await apify.processUrl(relUrl, reqBody);
    if (typeof result != "string") {
      res.setHeader("Content-Type", "application/json");
      result = JSON.stringify(result);
    }
    res.end(result);
  };

  if (req.url.startsWith("/api")) {
    if (req.method == "POST") {
      req.on("data", async (data: any) => {
        process(req, data.toString());
      });
      return;
    }
    // GET
    else {
      process(req);
    }
  } else {
    next();
  }
}
