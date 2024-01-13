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
import { Shakespearizer } from "../Projects/Shakespearizer/Shakespearizer";

(async () => {
  const shakespearizer = await Shakespearizer.new({
    database: {
      path: `c:\\eff\\Development\\Projects\\Shakespearizer\\Data`,
    },
  });

  const texts = [
    "If you could browse 4chan like this, would you use it?",
    "I enter a board directly into the search bar, scroll down, right-click-new tab interesting threads, gather enough, enter a new board, repeat the process. Then it's just visiting the tabs, no need for browsing. It doesn't seem like your model will improve my shitposting life.",
    "This ChatGPT is endlessly entertaining",
    "i like it anon",
    "2 things - ",
    "I don't think it's awful for browsing archives.",
    "you know what i come to 4chan for?",
    "i thought about. maybe it would be good to have a daily/weekly 4chan review with a summary of the best threads and best posts for those who dont have time.",
    "why not?",
    "compared to 4chan it looks like the sistine chapel",
  ];

  const results = await shakespearizer.shakespearize(texts);

  console.log(results);
})();
