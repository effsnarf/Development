const util = require("util");
import path from "path";
import fs from "fs";
import "colors";
import "@shared/Extensions";
import { Configuration } from "@shared/Configuration";
import { TreeScript } from "@shared/TreeScript/TreeScript";
import { Apify } from "@shared/Apify";
import { Console } from "@shared/Console";
import { ChatOpenAI, Roles } from "../apis/OpenAI/classes/ChatOpenAI";

const s = `Hello, ${"world".green}! This is ${"TreeScript".bgYellow.black}!`;

console.log(s.colorsToHandleBars());

console.log(s.colorsToHandleBars().handleBarsColorsToHtml());

process.exit();

const treeScriptConfig = Configuration.new(
  undefined,
  "@shared/TreeScript/TreeScript.config.yaml"
).data;

const treeScriptSource = path.resolve(
  __dirname,
  "../Apps/DatabaseProxy/Server/app.ts.yaml"
);

const source = fs.readFileSync(treeScriptSource, "utf8");
const trs = TreeScript.new(source, treeScriptConfig);

console.log(trs.compile());

process.exit();

(async () => {
  const chat = await ChatOpenAI.new(Roles.ChatGPT, true);

  const reply = await chat.send("Hello, how are you?");
})();
