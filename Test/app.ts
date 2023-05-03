import path from "path";
import fs from "fs";
import "colors";
import "@shared/Extensions";
import { TreeScript } from "@shared/TreeScript";
import { Apify } from "@shared/Apify";
import { Console } from "@shared/Console";
import { ChatOpenAI, Roles } from "../apis/OpenAI/classes/ChatOpenAI";

const trsSource = path.resolve(
  __dirname,
  "../Apps/DatabaseProxy/Server/app.ts.yaml"
);

const source = fs.readFileSync(trsSource, "utf8");
const trs = TreeScript.new(source);

console.log(trs.yaml);

process.exit();

(async () => {
  const chat = await ChatOpenAI.new(Roles.ChatGPT, true);

  const reply = await chat.send("Hello, how are you?");
})();
