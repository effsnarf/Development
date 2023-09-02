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
import { ChatOpenAI, Roles } from "../Apis/OpenAI/classes/ChatOpenAI";
import { Model } from "../Apis/OpenAI/classes/OpenAI";
import { Google } from "@shared/Google";
import { Coder } from "@shared/Coder";
import { Cache } from "@shared/Cache";
import { LiveTree } from "@shared/LiveTree";
import { Diff } from "@shared/Diff";

type malkovich = string;

class Malkovich {
  async malkovich(malkovich: malkovich) {
    // Wait 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Malkovich".green);
  }
}

const malkovitch = new Malkovich();

function removeQuoteLinks(s: string) {
  return s.replace(/<a href=".*?" class="quotelink">.*?<\/a>/g, "");
}

(async () => {
  var lhs = {
    name: "my object",
    description: "it's an object!",
    details: {
      it: "has",
      an: "array",
      with: ["a", "few", "elements"],
    },
  };

  var rhs = {
    name: "updated object",
    description: "it's an object!",
    details: {
      it: "has",
      an: "array",
      with: ["a", "few", "more", "elements", { than: "before" }],
    },
  };

  const changes = Diff.getChanges(lhs, rhs);

  console.log(lhs);

  console.log(changes);

  const newLhs = Diff.applyChanges(lhs, changes);

  console.log(newLhs);
})();
