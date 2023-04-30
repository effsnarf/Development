import "../../Shared/Extensions";
import * as colors from "colors";
import fs from "fs";
import * as yaml from "js-yaml";
import { OpenAI, Message } from "./OpenAI";

class Role {
  static empty = new Role("", null, null, null);

  // "Marvin"
  name: string;
  // "You are Marvin, a super intelligent depressed robot."
  identity: string | null;
  // "Answer with his personality, as concisely as possible."
  howToAnswer: string | null;
  // "Think step by step or debate pros and cons before settling on an answer."
  instructions: string | null;

  constructor(
    name: string,
    identity: string | null,
    howToAnswer: string | null,
    instructions: string | null
  ) {
    this.name = name;
    this.identity = identity;
    this.howToAnswer = howToAnswer;
    this.instructions = instructions;
  }

  static fromYamlFile(path: string): Role {
    let role = yaml.load(fs.readFileSync(path, "utf8")) as Role;
    return new Role(
      role.name,
      role.identity,
      role.howToAnswer,
      role.instructions
    );
  }

  toString() {
    return [this.identity, this.howToAnswer, this.instructions]
      .filter((s) => s?.trim().length)
      .join("\n");
  }
}

class Roles {
  static ChatGPT = new Role(
    "ChatGPT",
    "You are ChatGPT, a large language model trained by OpenAI.",
    null,
    null
  );

  static Hybrid = new Role(
    "Hybrid",
    `You are Hybrid, an artificial intelligence that has extended abilities such as searching Google, executing code, etc.`,
    `All your answers are in the following format:`,
    null
  );

  static Marvin = new Role(
    "Marvin",
    "You are Marvin, a super intelligent depressed robot.",
    "Answer with his personality.",
    "Think step by step or debate pros and cons before settling on an answer."
  );

  static SummaryGPT = new Role(
    "SummaryGPT",
    "You are SummaryGPT, a chatbot who summarizes long texts.",
    null,
    null
  );
}

class ChatOpenAI {
  private _log: boolean;
  private _openAI: OpenAI;
  private _messages: Message[] = [];
  role: Role;

  constructor(role: Role, log: boolean = true) {
    this._log = log;
    this.role = role;
    this._openAI = OpenAI.new(log);
    if (this._log)
      console.log(colors.bgCyan.black(role.toString().shorten(100)));
  }

  public async send(message: string, maxReplyTokens?: number) {
    try {
      this._messages.push({
        role: "user",
        content: JSON.stringify(message),
      });
      let responseMessage = await this._openAI.chat(
        this._messages,
        maxReplyTokens
      );
      this._messages.push(responseMessage);
      return responseMessage.content;
    } catch (ex: any) {
      console.log(colors.red(`An error occurred while sending a message:`));
      console.log(message.shorten(100));
      console.log(colors.red(ex.toString()));
      console.log(this._messages.length);
      // Delete the last message
      this._messages.pop();
      throw ex.response?.data?.error?.message || ex;
    }
  }

  public async sendSeveral(messages: string[], maxReplyTokens?: number) {
    for (let message of messages.slice(0, messages.length - 1)) {
      this._messages.push({ role: "user", content: message });
      //this._messages.push({ role: "system", content: "ok" });
    }
    return await this.send(messages.last(), maxReplyTokens);
  }

  public deleteLastMessage() {
    this._messages.pop();
  }

  static async new(role: Role, log: boolean = true) {
    let chat = new ChatOpenAI(role, log);
    chat._messages.push({ role: "system", content: role.toString() });
    return chat;
  }
}

export { ChatOpenAI, Role, Roles };
