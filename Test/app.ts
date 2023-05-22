const util = require("util");
import path from "path";
import fs from "fs";
import "colors";
import "@shared/Extensions";
import { Objects } from "@shared/Extensions.Objects";
import { Configuration } from "@shared/Configuration";
import { Logger } from "@shared/Logger";
import { Files } from "@shared/Files";
import { Progress } from "@shared/Progress";
import { Database } from "@shared/Database/Database";
import { Analytics } from "@shared/Analytics";
import { TreeScript } from "@shared/TreeScript/TreeScript";
import { Apify } from "@shared/Apify";
import { Console } from "@shared/Console";
import { ChatOpenAI, Roles } from "../Apis/OpenAI/classes/ChatOpenAI";
import { Google } from "@shared/Google";

const token =
  "eyJhbGciOiJSUzI1NiIsImtpZCI6IjJkOWE1ZWY1YjEyNjIzYzkxNjcxYTcwOTNjYjMyMzMzM2NkMDdkMDkiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYmYiOjE2ODQ2NzQxODcsImF1ZCI6IjM2ODAzMjg0Mjcta2FhZDhuNWI4MDhlcjVzZ3QzaWVxZHB1M3NnZGU4cDYuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTE0MzU3MTIwMTM1NjYwOTMwMzMiLCJlbWFpbCI6ImZlcmVuYy5zb21vc0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXpwIjoiMzY4MDMyODQyNy1rYWFkOG41YjgwOGVyNXNndDNpZXFkcHUzc2dkZThwNi5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsIm5hbWUiOiJFZmYgRnJhbmNpcyIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BR05teXhicEt6TWwwUEJ5NWVEbFBzUGFwUVVhc0d0MGhKN2RiOTVpcDBQOWFnPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IkVmZiIsImZhbWlseV9uYW1lIjoiRnJhbmNpcyIsImlhdCI6MTY4NDY3NDQ4NywiZXhwIjoxNjg0Njc4MDg3LCJqdGkiOiI1MmEyM2VhMDg3ZjI1NWJlMDA2OTJjYzk4MGI1MjQxZTMyODQzOGJmIn0.Thpzj-UcFlVIC8eodFab5nvpmfVBfa1Zspw5a9Rud3nCfC10e3rD5IHgVnVnxCaByXZCeAV1_m_GOufCt4LsB0RmZOMvBgugm34yMNoQ60Vbyw3tu7g-aUndbm_asxzpgkwEcu7UhE3pdcKdU5JbZ2FdeK7arXrmHrIGJvBlqS-onxwXCBy5XSngQvXzb30TLwHVnnxYIIr7jB06ZQm9YNNb7TjEUKTBGUUOG59zojA_tapZtXVIQ9vCAcp7lQo611qY28NZxXJ9zOvJgcgBaOPXgt2plNhnhEioNg1dTif0s9mVM_-rkcCdnqdqM2CYXUEKZ2Q6wgbLmBIkvzAeUw";

type malkovich = string;

class Malkovich {
  async malkovich(malkovich: malkovich) {
    // Wait 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Malkovich".green);
  }
}

const logger = Logger.new(console.log);

const malkovitch = new Malkovich();

logger.hookTo(malkovitch);

(async () => {
  const funcStr =
    "(env) => env.path.resolve(env.process.cwd(), `..`, `${env.config.title}.debug.log`)";
  const func = eval(funcStr);
  console.log(func.toString());
  process.exit();
})();

// for (var i = 0; i <= 100; i += 10) {
//   const percent = i / 100;
//   const value = i * 1000;
//   //console.log(value.unitifyTime(), value.unitifyTime().deunitifyTime());

//   console.log(
//     percent.unitifyPercent(),
//     percent.unitifyPercent().severify(0.9, 0.8, ">")
//   );
// }

// const progress = Progress.newAutoDisplay(100, { skipped: 0, modifieds: [] });

// (async () => {
//   for (let i = 0; i < 100; i++) {
//     progress.increment();
//     await new Promise((resolve) => setTimeout(resolve, 100));
//   }
// })();

// const path1 = `C:\\eff\\Development\\${
//   `Projects`.green
// }\\MemeGenerator\\MG2.Website\\Node1\\`;

// console.log(path1.splitOnWidth(22).join("\n"));

// process.exit();

// (async () => {
//   Files.watch(
//     [path1],
//     { recursive: true, exclude: ["node_modules"] },
//     (paths) => {
//       console.log(paths);
//     },
//     (message) => console.log(message)
//   );
// })();

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
