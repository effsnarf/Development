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

const tsSourcePath = path.resolve(
  __dirname,
  "../Shared/TreeScript/test.ts.yaml"
);

const source = fs.readFileSync(tsSourcePath, "utf8");
const trs = TreeScript.new(source);

console.log(tsSourcePath.toShortPath());
console.log();

console.log(trs.output);

process.exit();

(async () => {
  const chat = await ChatOpenAI.new(Roles.ChatGPT, true);

  const reply = await chat.send("Hello, how are you?");
})();
