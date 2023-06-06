const util = require("util");
import path from "path";
import fs from "fs";
import "colors";
import * as moment from "moment";
import axios from "axios";
import "@shared/Extensions";
import { Timer } from "@shared/Timer";
import { Objects } from "@shared/Extensions.Objects";
import { Configuration } from "@shared/Configuration";
import { Logger } from "@shared/Logger";
import { Files } from "@shared/Files";
import { Progress } from "@shared/Progress";
import { Database } from "@shared/Database/Database";
import { Analytics, ItemType } from "@shared/Analytics";
import { TreeScript } from "@shared/TreeScript/TreeScript";
import { Apify } from "@shared/Apify";
import { Console } from "@shared/Console";
import { ChatOpenAI, Roles } from "../Apis/OpenAI/classes/ChatOpenAI";
import { Google } from "@shared/Google";
import { Coder } from "@shared/Coder";
import { Cache } from "@shared/Cache";
import { LiveTree } from "@shared/LiveTree";

type malkovich = string;

class Malkovich {
  async malkovich(malkovich: malkovich) {
    // Wait 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Malkovich".green);
  }
}

const malkovitch = new Malkovich();

(async () => {
  let path = [];

  const nodes = await LiveTree.Node.getSubNodes([]);

  //console.log(nodes.map((n) => n.title));

  const shared = nodes.find((n) => n.title.text == "Shared");

  //console.log(shared?.title);

  const traverseSubNodes = async (node?: LiveTree.Types.Node, indent = 0) => {
    let padding = " ".repeat(indent * 2);

    console.log(`${padding}`, node?.title);

    const subNodes = await LiveTree.Node.getSubNodes(node?.path);

    indent++;
    padding = " ".repeat(indent * 2);

    for (const subNode of subNodes) {
      await traverseSubNodes(subNode, indent + 1);
    }
  };

  await traverseSubNodes(shared);

  // const sharedNodes = await LiveTree.Node.getSubNodes(shared?.path);

  // const classFile = sharedNodes.find((n) => n.title.text == "Analytics.ts");

  // console.log(classFile?.title);

  // const classes = await LiveTree.Node.getSubNodes(classFile?.path);

  // console.log(classes.map((t) => t.title));
  // const class1 = classes[0];

  // const methods = await LiveTree.Node.getSubNodes(class1?.path);

  // console.log(methods.map((t) => t.title));

  // const debugLogger = Logger.new({
  //   path: `c:\\eff\\Development\\Logs\\${new Date()
  //     .toLocaleString()
  //     .sanitizePath()}.log`,
  // });

  // await debugLogger.log("test");

  // const tsCode = Coder.App.addDebuggingCode(
  //   path.resolve(`../Apps/DatabaseProxy/Server/app.ts`)
  // );

  // fs.writeFileSync(
  //   path.resolve(path.dirname(process.argv[1]), "test.ts"),
  //   tsCode
  // );

  process.exit();

  // const url = `https://db.memegenerator.net/MemeGenerator`;
  // //const url = `https://memegenerator.net/api/client.js`;

  // for (let i = 0; i < 100; i++) {
  //   try {
  //     const timer = Timer.start();
  //     const response = await axios.get(url);
  //     console.log(
  //       `${response.status.severifyByHttpStatus()} ${timer.elapsed
  //         ?.unitifyTime()
  //         .padStart(6)} ${response.data.length
  //         .unitifySize()
  //         .padStart(6)} ${url}`
  //     );
  //   } catch (ex: any) {
  //     console.log(ex.message.bgRed);
  //   }
  // }

  // process.exit();

  // const db = await Database.new({ path: "C:\\Database\\Cache\\Test" });

  // const doc = { TestKey: "TestValue" };

  // await db.upsert("TestCollection", doc);

  // await db.set("TestKey", doc);

  // console.log(doc);

  // process.exit();

  // const config = (await Configuration.new()).data;

  // const cache = await Cache.new(config.cache);

  // const value = await cache.get("test key 1", () => "test value 1");

  // console.log(value);
})();

// for (var i = 0; i <= 100; i += 10) {
//   const percent = i / 100;
//   const value = i * 1000;
//   //console.log(value.unitifyTime(), value.unitifyTime().deunitify());

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
