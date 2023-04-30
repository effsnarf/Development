import * as colors from "colors";
import * as fs from "fs";
import * as jsyaml from "js-yaml";
import { Config } from "@shared/Config";
import { Config as OpenAiConfig } from "../../OpenAI/classes/Config";
import { Summarizer } from "./classes/Summarizer";

const config = jsyaml.load(fs.readFileSync("../config.yaml", "utf8")) as Config;

const openAiConfig = jsyaml.load(
  fs.readFileSync("../../OpenAI/config.yaml", "utf8")
) as OpenAiConfig;

(async () => {
  let summarizer = await Summarizer.new(config, openAiConfig);

  summarizer.start();
})();
