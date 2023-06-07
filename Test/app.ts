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
  //const config = (await Configuration.new()).data;

  console.log("test".blue.bold);

  const root = await LiveTree.Api.getFolder("c:/eff/Development");

  const parts1 = await root.getSubParts([
    "Shared",
    "LoadBalancer.ts",
    "LoadBalancer",
    "sendToClient",
  ]);

  console.log(parts1);

  // // Create the express app
  // const httpServer = express();
  // httpServer.use(express.json());

  // const handleRequest = async (req: any, res: any) => {
  //   try {
  //     const path = req.url.split("/").slice(2);
  //     const nodes = await LiveTree.Api.getSubNodes(path);
  //     return res.end(JSON.stringify(nodes.map((n) => n.title)));
  //   } catch (ex: any) {
  //     return res.status(500).end(ex.message);
  //   }
  // };

  // httpServer.get("/tree", handleRequest);
  // httpServer.get("/tree/*", handleRequest);

  // // Start the server
  // httpServer.listen(config.server.port, config.server.host);
})();
