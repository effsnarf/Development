import * as fs from "fs";
import * as jsyaml from "js-yaml";
import { Apify } from "../../Shared/Apify/Apify";
import { OpenAI } from "../../OpenAI/classes/OpenAI";
import { SeoArticles } from "./SeoArticles";

const config = (jsyaml.load(fs.readFileSync("../config.yaml", "utf8")) as any);

OpenAI.apiKey = (jsyaml.load(fs.readFileSync("../../OpenAI/config.yaml", "utf8")) as any).apiKey;

if (true)
{
  const apify = new Apify.Server(config.api.host,
    config.api.port,
    "/api",
    [SeoArticles],
    "../../Shared/Apify");

    apify.start();
}

