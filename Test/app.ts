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
import { Google } from "@shared/Google";
import { Coder } from "@shared/Coder";
import { Cache } from "@shared/Cache";
import { LiveTree } from "@shared/LiveTree";
import { Diff } from "@shared/Diff";
import { AI } from "@shared/AI";
import { OpenAI, Model } from "../Apis/OpenAI/classes/OpenAI";
import { ChatOpenAI, Role, Roles } from "../Apis/OpenAI/classes/ChatOpenAI";
//import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAI2 } from "../Apis/OpenAI/classes/OpenAI2";
import { Shakespearizer } from "../Projects/Shakespearizer/Shakespearizer";
import { Pexels } from "../Apis/Images/Pexels/Pexels";

(async () => {
  const chat = await ChatOpenAI.new(
    Roles.Null,
    true,
    Model.Default,
    false,
    OpenAI.effApiKey
  );

  await chat.send("hello");
})();
