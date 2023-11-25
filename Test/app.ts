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
import { OpenAI } from "langchain/llms/openai";
import { ChatOpenAI, Role, Roles } from "../Apis/OpenAI/classes/ChatOpenAI";
//import { ChatOpenAI } from "langchain/chat_models/openai";

const openAIApiKey = "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";

(async () => {
  const config = (await Configuration.new()).data;

  const chat = await ChatOpenAI.new(Roles.DAN);

  //const terminalGPT = await AI.Agents.TerminalGPT.new();

  //const result = await terminalGPT.do("which projects am i working on?");

  //console.log(result);

  process.exit();
})();

// function breakIntoStatements(fn: Function) {
//   const code = fn.toString();
//   const parsed = esprima.parseScript(code, { loc: true });
//   const statements = parsed.body[0].body.body;

//   return statements.map((stmt: any) => {
//     const startLine = stmt.loc.start.line;
//     const endLine = stmt.loc.end.line;
//     const lines = code.split("\n").slice(startLine - 1, endLine);
//     return lines.join("\n").trim();
//   });
// }

// // Test function
// function test() {
//   let x = 1;
//   let y = 2;
//   return x + y;
// }

// const result = breakIntoStatements(test);
// console.log(result);
