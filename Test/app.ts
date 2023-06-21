const util = require("util");
import path from "path";
import fs from "fs";
import "colors";
import express from "express";
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
  console.log(Configuration.getEnvironment());

  //const config = (await Configuration.new()).data;

  const root = await LiveTree.Api.getFolder("c:/eff/Development");

  const path = ["Shared", "Timer.ts", "Timer"];

  let node = root as LiveTree.Node | undefined;
  while (path.length) {
    await node?.populate();
    node = await node?.find(path.shift() || "");
  }
  await node?.populate();

  console.log(
    util.inspect(
      await root.select((n) => {
        return { title: n.title, info: n.info };
      }),
      { depth: 10, colors: true }
    )
  );
})();
