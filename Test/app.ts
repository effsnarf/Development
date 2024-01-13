const util = require("util");
import path from "path";
import fs from "fs";
import "colors";
import axios from "axios";
import "@shared/Extensions";
import { Http } from "@shared/Http";
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
import { Model } from "../Apis/OpenAI/classes/OpenAI";
import { Google } from "@shared/Google";
import { Coder } from "@shared/Coder";
import { Cache } from "@shared/Cache";
import { LiveTree } from "@shared/LiveTree";
import { Diff } from "@shared/Diff";
import { AI } from "@shared/AI";
import { OpenAI } from "../Apis/OpenAI/classes/OpenAI";
import { ChatOpenAI, Role, Roles } from "../Apis/OpenAI/classes/ChatOpenAI";
//import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAI2 } from "../Apis/OpenAI/classes/OpenAI2";

(async () => {
  const query = "python.exe";

  const driveStats = await Files.getDriveStats();
  const c = driveStats.find((x) => x.drive === "c");

  const window = Console.getWindowSize();
  const maxWidth = window.width - 10;
  let processedSize = 0;
  let ex = null as any;
  const started = Date.now();

  for (let filePath of Files.listFiles("c:\\")) {
    try {
      const fileStats = fs.statSync(filePath);
      processedSize += fileStats.size;
    } catch (ex2: any) {
      ex = ex2;
    } finally {
      const fileDir = path.dirname(filePath);
      const fileName = path.basename(filePath);
      const progress = processedSize / (c?.usedSpace || 0);
      const timeElapsed = Date.now() - started;
      const timeTotal = timeElapsed / progress;
      const timeRemaining = timeTotal - timeElapsed;
      console.log(fileDir.shorten(maxWidth).gray);
      console.log(fileName.shorten(maxWidth).green);
      console.log(
        `${progress.toProgressBar(50)}`,
        processedSize.unitifySize(),
        c?.usedSpace.unitifySize(),
        timeRemaining.unitifyTime()
      );
      //console.log((ex?.message || "").shorten(maxWidth).bgRed.white);
      for (let i = 0; i < 3; i++) {
        Console.moveCursorUp();
      }
    }
  }
})();
