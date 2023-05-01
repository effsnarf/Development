import path from "path";
import fs from "fs";
import "colors";
import "@shared/Extensions";
import { Console } from "@shared/Console";
import { ChatOpenAI, Roles } from "../apis/OpenAI/classes/ChatOpenAI";

(async () => {
  const chat = await ChatOpenAI.new(Roles.ChatGPT, true);

  const reply = await chat.send("Hello, how are you?");
})();
