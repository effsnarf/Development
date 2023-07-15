const { exec } = require("child_process");
import colors from "colors";
import { Html } from "./Html";
import { ChatOpenAI, Role } from "../../OpanAI/classes/ChatOpenAI";
import { Google } from "./Google";
import { SummaryGPT } from "./SummaryGPT";

interface GptMessage {
  from: string;
  to: string;
  reasoning: string;
  message: string;
}

class SuperGPT {
  private chat!: ChatOpenAI;

  static async new(roleName: string) {
    // Load the role from a yaml file
    let superGptRole = Role.fromYamlFile(`./Roles/${roleName}.role.yaml`);
    let superGpt = new SuperGPT();
    superGpt.chat = await ChatOpenAI.new(superGptRole, true);
    return superGpt;
  }

  async send(
    from: string = "user",
    to: string = "UserGPT",
    reasoning: string = "",
    message: any
  ) {
    let msg = { from, to, reasoning, message } as GptMessage;
    let response = await this.getResponse(msg);
    await this.processResponse(response);
  }

  async getResponse(msg: GptMessage) {
    let response = await this.chat.send(JSON.stringify(msg));
    try {
      return Objects.json.parse(response) as GptMessage;
    } catch (ex: any) {
      console.log("Error parsing response: " + ex.toString());
      console.log(response);
      throw ex;
    }
  }

  async processResponse(msg: GptMessage) {
    console.log(`${colors.gray(msg.from)}: ${colors.yellow(msg.reasoning)}`);
    switch (msg.to) {
      case "UserGPT":
        console.log(
          `${colors.green(msg.reasoning)}\n${colors.cyan(msg.message)}`
        );
        break;
      case "GoogleBot":
        let query = msg.message;
        console.log(`${colors.gray("GoogleBot searching")} ${query}`);
        let searchResults = await Google.search(query);
        await this.send(
          "GoogleBot",
          msg.from,
          `Search results for "${query}"`,
          searchResults
        );
        break;
      case "FetchBot":
        let url = msg.message;
        console.log(`${colors.gray("FetchBot fetching")} ${url}`);
        try {
          let html = await Html.fromUrl(url);
          let size = Math.round(html.length / 1024);
          console.log(`${colors.gray("FetchBot")} (${size}kb)`);
          let tree = Html.getTree(html, true);
          let texts = Html.getAllTexts(tree, 20);
          let words = texts.join(" ").getWords().join(" ").trim().shorten(1000);
          let response = words as any;
          if (!words.length) response = { error: "Can't browse this page." };
          await this.send("FetchBot", msg.from, `Fetched ${url}`, response);
        } catch (ex: any) {
          await this.send("FetchBot", msg.from, `Error fetching ${url}`, {
            error: "Can't browse this page.",
          });
        }
        break;
      case "OsShellBot":
        try {
          console.log(`${colors.gray("OsShellBot executing")} ${msg.message}`);
          let execResult = await this.shellExecute(msg.message);
          //console.log(`Result: ${execResult}`);
          await this.send("OsShellBot", msg.from, "Shell result", execResult);
        } catch (ex: any) {
          await this.send("OsShellBot", msg.from, "Shell error", ex.toString());
        }
        break;
      default:
        await this.send(msg.from, msg.to, msg.reasoning, msg.message);
        break;
    }
  }

  async shellExecute(command: string, timeout: number = 5000) {
    // Execute the command
    // If it doesn't return in [timeout] seconds, kill it, and return the output
    return new Promise((resolve, reject) => {
      let procStdout: any = null;
      let child = exec(command, (error: any, stdout: any, stderr: any) => {
        procStdout = stdout;
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
      setTimeout(() => {
        child.kill();
        resolve(procStdout);
        //reject("Command timed out.");
      }, timeout);
    });
  }
}

export { SuperGPT };
