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
  const url = `http://localhost:4042/MemeGenerator/api/Medias/create/one`;

  const body = { media: { test: 1 } };

  const options = {
    url: url,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // We want to proxy the data as-is,
    responseType: "stream",
    // We want to proxy the request as-is,
    // let the client handle the redirects
    maxRedirects: 0,
    timeout: 5000,
    mode: "no-cors",
  } as any;

  try {
    console.log(url.green);

    const response = await axios.post(url, body, options);

    console.log(response.data);
  } catch (ex: any) {
    console.log(ex.message.bgRed.white);

    if (ex.response) {
      const data = await Http.getResponseStream(ex.response);
      console.log(data);
    }
  }

  process.exit();

  //const config = (await Configuration.new()).data;

  // const root = await LiveTree.Api.getFolder("c:/eff/Development");

  // const path = ["Shared", "Timer.ts", "Timer"];

  // let node = root as LiveTree.Node | undefined;
  // while (path.length) {
  //   await node?.populate();
  //   node = await node?.find(path.shift() || "");
  // }
  // await node?.populate();

  // console.log(
  //   util.inspect(
  //     await root.select((n) => {
  //       return { title: n.title, info: n.info };
  //     }),
  //     { depth: 10, colors: true }
  //   )
  // );
})();
