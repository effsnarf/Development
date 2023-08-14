const colors = require("colors");
import * as fs from "fs";
import * as jsyaml from "js-yaml";
import { Config } from "../Shared/Config";
import { Config as OpenAiConfig } from "../../../Apis/OpenAI/classes/Config";
import { Summarizer } from "./classes/Summarizer";

process.title = "Summarizer";

const config = jsyaml.load(fs.readFileSync("../config.yaml", "utf8")) as Config;

const openAiConfig = jsyaml.load(
  fs.readFileSync("../../../Apis/OpenAI/config.yaml", "utf8")
) as OpenAiConfig;

(async () => {
  let summarizer = await Summarizer.new(config, openAiConfig);

  summarizer.start();
})();
