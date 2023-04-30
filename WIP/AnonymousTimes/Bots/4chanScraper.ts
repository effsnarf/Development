const colors = require("colors");
import * as fs from "fs";
import * as jsyaml from "js-yaml";
import { Config } from "@shared/Config";
import { Scraper } from "./classes/Scraper";

const config: Config = jsyaml.load(
  fs.readFileSync("../config.yaml", "utf8")
) as Config;

(async () => {
  let scraper = await Scraper.new(config);

  scraper.start();
})();
