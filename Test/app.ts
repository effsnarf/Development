const util = require("util");
import path from "path";
import fs from "fs";
import "colors";
import "@shared/Extensions";
import { Configuration } from "@shared/Configuration";
import { Files } from "@shared/Files";
import { Database } from "@shared/Database/Database";
import { Analytics } from "@shared/Analytics";
import { TreeScript } from "@shared/TreeScript/TreeScript";
import { Apify } from "@shared/Apify";
import { Console } from "@shared/Console";
import { ChatOpenAI, Roles } from "../Apis/OpenAI/classes/ChatOpenAI";

const path1 = `C:\\eff\\Development\\${
  `Projects`.green
}\\MemeGenerator\\MG2.Website\\Node1\\`;

console.log(path1.splitOnWidth(22).join("\n"));

process.exit();

(async () => {
  Files.watch(
    [path1],
    { recursive: true, exclude: ["node_modules"] },
    (paths) => {
      console.log(paths);
    },
    (message) => console.log(message)
  );
})();

// (async () => {
//   //const configPath = `../Apps/DatabaseProxy/Server/config.yaml`;
//   const configPath = `./config.yaml`;

//   const config = (await Configuration.new({}, configPath)).data;

//   //const db = await Database.newDb(config.database);

//   const analytics = await Analytics.new(await Database.new(config.database));

//   await analytics.create("category", "event", { value: 1 });

//   console.log(`test string`.bgRed);
// })();

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
