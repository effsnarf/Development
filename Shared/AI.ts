import path from "path";
import fs from "fs";
import { Console } from "./Console";
import { Objects } from "./Extensions.Objects";
import { ChatOpenAI, Roles, Role } from "../Apis/OpenAI/classes/ChatOpenAI";

namespace AI {
  export namespace Agents {
    export class TerminalGPT {
      private logFilePath = path.join(process.cwd(), "terminal.gpt.log");

      private roleDesc = `you are an autonomous agent, you work completely autonomously, you don't need any human intervention
      you have the ability to execute commands in the OS terminal
      i'll give you a task and you try to accomplish it by executing the proper terminal commands
      you always write what you would like to type in the terminal,
      and i'll reply with the terminal result
      your commands are always executed in C:\

      you can only reply in this properly formatted standard JSON format:

      {
        "analysis": {
          "outcomeSentiment": [positive / negative / neutral],
          "whatHappened": "..", (analyze the response you got)
          // if positive, continue
          // if negative:
          "whatWentWrong": [
            (list of reasons why it failed)
          ]
        },
        "nextStep": {
          "assumption": "..",
          "intention": "..",
          "reasoning": "..",
          "terminal": {
            "command": "[terminal command]",
          }
        }
      }

      make sure to include the exact same fields as above, and don't include any other fields
      you must include all the fields
      
      you can't reply with anything else
      you can't ask any questions or ask for any clarifications
      you can't ask for any help or hints
      you can't ask for any input from the user
      you can only rely on yourself
      `;

      private constructor() {}

      public static async new() {
        const agent = new TerminalGPT();
        return agent;
      }

      async do(task: string) {
        if (fs.existsSync(this.logFilePath)) fs.unlinkSync(this.logFilePath);

        const chat = await ChatOpenAI.new(
          Role.new("TerminalGPT", null, undefined, this.roleDesc),
          false
        );

        let response = await this.send(
          chat,
          `Your task is:
          
          ${task}
          `
        );

        let items = 1;

        let command = null;

        while (items++ < 20) {
          this.log(response);

          console.log(response.nextStep.reasoning.yellow);

          command = response.nextStep.terminal.command;

          console.log(command.cyan);

          //console.log(`Executing command...`.gray);
          const cmdResult = await Console.execute(command, `c:\\`, false);

          //console.log(`Command result:`.gray);
          console.log(cmdResult.green);

          response = await this.send(chat, cmdResult);

          await Console.readLines(`Press enter to continue...`.gray);
        }
      }

      private log(message?: string) {
        if (!message) return;
        if (typeof message !== "string")
          message = JSON.stringify(message, null, 2);
        fs.appendFileSync(this.logFilePath, `${message}\n\n\n`);
      }

      private async send(chat: ChatOpenAI, message: string) {
        const success = false;
        while (true) {
          let json = null;
          try {
            json = await chat.send(message);
            if (json.startsWith("```json")) json = json.slice(7);
            if (json.endsWith("```")) json = json.slice(0, -3);
            const obj = Objects.json.parse(json);
            return obj;
          } catch (ex: any) {
            if (ex.message.includes("Error parsing JSON")) {
              console.log(json);
              message = `The JSON you sent was invalid, please use the exact format specified in the beginning of the conversation. Make sure to escape properly.`;
            } else {
              throw ex;
            }
          }
        }
      }
    }
  }
}

export { AI };
