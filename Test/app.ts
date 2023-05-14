const util = require("util");
import path from "path";
import fs from "fs";
import "colors";
import "@shared/Extensions";
import { Configuration } from "@shared/Configuration";
import { Database } from "@shared/Database/Database";
import { Analytics } from "@shared/Analytics";
import { TreeScript } from "@shared/TreeScript/TreeScript";
import { Apify } from "@shared/Apify";
import { Console } from "@shared/Console";
import { ChatOpenAI, Roles } from "../Apis/OpenAI/classes/ChatOpenAI";

// Testing 230ms, 1.4s, 12s, 1.4m, 12m, 1.4h, 12h, 1.4d, 12d, 1.4w, 12w, 1.4y, 12y
const values = [
  230, 1400, 12000, 84000, 720000, 5040000, 43200000, 302400000, 2592000000,
  18144000000, 155520000000, 1088640000000, 9331200000000,
];

for (const value of values) {
  console.log(
    `${value}ms`.padStart(10),
    `=`,
    `${value.unitifyTime()}`.padStart(10),
    `=`,
    `${value.unitifyTime().deunitifyTime()}`.padStart(10),
    `=`,
    `${value.unitifyTime().severifyTime(1000, 60000, "<")}`.padStart(10)
  );
}

process.exit();

(async () => {
  //const configPath = `../Apps/DatabaseProxy/Server/config.yaml`;
  const configPath = `./config.yaml`;

  const config = (await Configuration.new({}, configPath)).data;

  //const db = await Database.newDb(config.database);

  const analytics = await Analytics.new(await Database.new(config.database));

  await analytics.create("category", "event", { value: 1 });

  console.log(`test string`.bgRed);
})();

// const tsSourcePath = path.resolve(
//   __dirname,
//   "../Shared/TreeScript/test.ts.yaml"
// );

// const source = fs.readFileSync(tsSourcePath, "utf8");
// const trs = TreeScript.new(source);

// console.log(tsSourcePath.toShortPath());
// console.log();

// console.log(trs.output);

// process.exit();

// (async () => {
//   const chat = await ChatOpenAI.new(Roles.ChatGPT, true);

//   const reply = await chat.send("Hello, how are you?");
// })();
