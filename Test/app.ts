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
    "Which matters more: fitness or intelligence?",
    "this nigga ZESTY",
    "Harvard is great, not for the education but for the connections it gives you in life.",
    "What matters most is deez nutz.",
    "Have fun at the ZOG recruitment pool.",
    "all of you anons may think having a big ass as a man is great but NO it fucking sucks trust me",
    "I dropped out of uni twice and have 25k debt and only got my first job at 25 a couple months ago making minimum wage for an adult",
    ">Harvard",
    "What an ass",
    "oh my Im bout to bust",
  ];

  const texts2 = ["such is life is mother Russia", "fuck this shit"];

  const results = await shakespearizer.shakespearize(texts);

  console.log(results);
})();
