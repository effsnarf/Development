import path from "path";
import fs from "fs";
import "colors";
import "@shared/Extensions";
import { Apify } from "@shared/Apify/Apify";
import { Console } from "@shared/Console";
import { ChatOpenAI, Roles } from "../apis/OpenAI/classes/ChatOpenAI";

const apify = new Apify.Server(
  "localhost",
  80,
  "/",
  [ChatOpenAI],
  path.join(__dirname, "../Shared/Apify")
);

console.log(apify.getApifyClientSourceJs());

process.exit();

(async () => {
  const chat = await ChatOpenAI.new(Roles.ChatGPT, true);

  const reply = await chat.send("Hello, how are you?");
})();
