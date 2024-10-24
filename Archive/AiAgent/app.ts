import fs from "fs";
import "colors";
import { Configuration } from "@shared/Configuration";
import { Console } from "@shared/Console";
import { Objects } from "@shared/Extensions.Objects";
import { Loading } from "@shared/Loading";
import { Database } from "@shared/Database/Database";
import { OpenAI } from "../../Apis/OpenAI/classes/OpenAI";
import { ChatOpenAI, Roles } from "../../Apis/OpenAI/classes/ChatOpenAI";
import { Model } from "../../Apis/OpenAI/classes/OpenAI";

(async () => {
  const config = (await Configuration.new()).data;

  const chat = await ChatOpenAI.new(
    Roles.AiAgent,
    false,
    Model.Gpt4,
    true,
    OpenAI.effApiKey
  );

  console.clear();
  console.log(
    `\n${"AiAgent".green} ${`is ready to chat using`.gray} ${
      chat.model?.blue
    }\n`
  );

  console.log(`Abilities:`.gray);
  console.log(
    `  ${(chat.tools || [])
      .map((tool) => tool.function.description.green)
      .join(`\n  `.gray)}`
  );

  const sendRequest = async (message: string) => {
    const reply = await chat.send(message);
    await processReply(reply);
  };

  const processReply = async (replyText: any) => {
    const delimiter = "```";
    const nextShellCommand = `If you can run another command to clarify or progress, ask it in the JSON format`;

    const aiReply = await Objects.try(() => JSON.parse(replyText), null);

    if (!aiReply) {
      console.log();
      console.log(replyText.yellow);
      //const nextReply = await chat.send(`Please reply in the JSON format.`);
      //await processReply(nextReply);
      return;
    }
  };

  while (true) {
    const userMessage = await Console.readLine("\n> ");

    if (userMessage == "quit") process.exit(0);

    try {
      await sendRequest(userMessage);
    } catch (ex: any) {
      console.log(ex.stack.bgRed.white);
    }
  }
})();
