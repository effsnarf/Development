import colors from "colors";
const axios = require("axios");
import { ProgressReport } from "./classes/ProgressReport";
import { Html } from "./classes/Html";
import { OpenAI } from "./classes/OpenAI";
import { ChatOpenAI, Role, Roles } from "./classes/ChatOpenAI";
import { SuperGPT } from "./classes/SuperGPT";
import * as yaml from "js-yaml";
import * as fs from "fs";
import * as readline from "readline";
import { Google } from "./classes/Google";
import { SummaryGPT } from "./classes/SummaryGPT";
import { Apify } from "./classes/Apify";

interface Config {
  apiKey: string;
}

const config: Config = yaml.load(
  fs.readFileSync("./config.yaml", "utf8")
) as Config;

async function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<string>((resolve) => {
    // set input color to white
    rl.setPrompt(colors.white(question));
    rl.question(question, (answer) => {
      rl.close();
      // reset color
      resolve(answer);
    });
  });
}

function onReport(report: ProgressReport) {
  let ss = [report.text];
  // If progress is available, add it to the text
  if (report.progress) ss.push(`${report.progress * 100}%`);
  // Text is white, progress is gray
  ss[0] = colors.cyan(ss[0]);
  if (ss[1]) ss[1] = colors.gray(ss[1]);
  // Join the text and progress
  console.log(ss.join(" "));
}

OpenAI.apiKey = config.apiKey;

Apify.Server.startNew("localhost", 9000, "/api", [ChatOpenAI]);

if (false) {
  (async () => {
    let chatOpenAI = new ChatOpenAI(Roles.ChatGPT);

    while (true) {
      console.log();
      await chatOpenAI.send(await askQuestion(colors.gray("ChatGPT> ")));
    }

    let superGpt = await SuperGPT.new("SuperGPT");

    while (true) {
      try {
        const userMessage = await askQuestion(colors.gray("SuperGPT> "));
        const reply = await superGpt.send("user", "UserGPT", "", userMessage);
      } catch (ex: any) {
        console.log(colors.red(ex.toString()));
      }
    }
  })();
}
