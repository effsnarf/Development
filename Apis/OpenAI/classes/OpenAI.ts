const { encode, decode } = require("gpt-3-encoder");

import axios, { AxiosResponse } from "axios";
import * as colors from "colors";

import { Loading } from "../../../Shared/Loading";

interface Message {
  role: "user" | string;
  content: string;
}

interface Response {
  choices: {
    text: string;
    message: Message;
  }[];
}

enum Model {
  Gpt35Turbo = "gpt-3.5-turbo",
  Gpt35Turbo16k = "gpt-3.5-turbo-16k",
  Ada = "text-ada-001",
}

enum RequestType {
  Completion = "completions",
  Edit = "edits",
  Chat = "chat/completions",
}

class OpenAI {
  public static apiKey: string = `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`;
  private _log: boolean;
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly model: Model;
  private messages: Message[];
  private readonly loading = new Loading();
  // This includes the request and the response
  private get maxTotalTokens() {
    switch (this.model) {
      case Model.Gpt35Turbo:
        return 4096;
      case Model.Gpt35Turbo16k:
        return 16384;
      case Model.Ada:
        return 2049;
      default:
        throw `Unknown model ${this.model}`;
    }
  }

  static new(log: boolean = true, model: Model = Model.Gpt35Turbo16k): OpenAI {
    if (!this.apiKey)
      throw new Error("API key not set. Use OpenAI.apiKey = 'your key'");
    return new OpenAI(this.apiKey, model, log);
  }

  private constructor(apiKey: string, model: Model, log: boolean = true) {
    this._log = log;
    this.endpoint = "https://api.openai.com/v1/";
    this.apiKey = apiKey;
    this.model = model;
    this.messages = [];
  }

  // Makes sure that the prompt is not too long
  // replyTokens is the number of tokens to allow for the reply
  shortenPrompt(prompt: string, replyTokens: number) {
    // Based on this.maxTotalTokens, binary search for the right length
    let min = 0;
    let max = prompt.length;
    let mid = Math.floor((min + max) / 2);
    while (min < max) {
      let tokens = this.getTokens(prompt.substring(0, mid));
      if (tokens > this.maxTotalTokens - replyTokens) {
        max = mid;
      } else {
        min = mid + 1;
      }
      mid = Math.floor((min + max) / 2);
    }
    prompt = prompt.substring(0, mid);
    const tokens = this.getTokens(prompt);
    console.log(`Prompt shortened to ${tokens} tokens`.gray);
    return prompt;
  }

  // Makes sure that the total tokens if JSON.stringify(messages) is not too much
  // replyTokens is the number of tokens to allow for the reply
  shortenMessages(messages: Message[], replyTokens: number) {
    const originalLength = messages.length;
    // Based on this.maxTotalTokens, binary search for the right length
    let min = 0;
    let max = messages.length;
    let mid = Math.floor((min + max) / 2);
    while (min < max) {
      let tokens = this.getTokens(messages.slice(0, mid));
      if (tokens > this.maxTotalTokens - replyTokens) {
        max = mid;
      } else {
        min = mid + 1;
      }
      mid = Math.floor((min + max) / 2);
      if (mid <= 0) throw `mid is ${mid}`;
    }
    messages = messages.slice(0, mid);
    const tokens = this.getTokens(JSON.stringify(messages));
    console.log(
      `Messages shortened to ${messages.length}/${originalLength} messages, ${tokens} tokens`
        .gray
    );
    return messages;
  }

  private getTokens(message: any) {
    if (!message) {
      throw `message is ${message}`;
    }
    if (typeof message != "string") {
      message = JSON.stringify(message);
    }
    const tokens = encode(message).length;
    return tokens;
  }

  async makeRequest<T>(model: string, type: string, dataProps: any) {
    const tokens = this.getTokens(
      dataProps.prompt || dataProps.input || dataProps.messages || dataProps
    );
    const maxReplyTokens = this.maxTotalTokens - tokens;
    if (false)
      console.log(
        `Max reply tokens: ${maxReplyTokens} (${tokens} tokens used)`.gray
      );

    const data = {
      model: model,
      max_tokens: maxReplyTokens,
      ...dataProps,
    };

    if (false) console.log(data.stringify().shorten(400));

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };

    const endpoint = `${this.endpoint}${type}`;

    let response: AxiosResponse<Response>;
    try {
      this.loading.start();
      response = await axios.post<Response>(endpoint, data, {
        headers,
        timeout: (30).seconds(),
      });
      this.log();
      if (dataProps.messages) {
        //this.log(colors.cyan(dataProps.messages.last().content).shorten(100));
      } else {
        this.log(JSON.stringify(dataProps).shorten(100));
      }
    } catch (ex: any) {
      let msg = ex.response?.data?.error?.message;
      this.log();
      this.log(msg.red);
      throw msg || ex;
    } finally {
      this.loading.stop();
    }

    let choices = response.data.choices;
    if (choices.length > 1) throw `${choices.length} choices returned`;
    if (choices[0].text) choices[0].text = choices[0].text.trim();
    if (choices[0].message)
      choices[0].message.content = choices[0].message.content.trim();
    let reply = (choices[0].text || choices[0].message) as T;
    this.log();
    this.log(((reply as any)?.content || reply).green);
    return reply;
  }

  public async complete(prompt: string) {
    return await this.makeRequest<string>(this.model, RequestType.Completion, {
      prompt,
    });
  }

  public async edit(input: string, instruction: string) {
    return await this.makeRequest<string>(this.model, RequestType.Edit, {
      input,
      instruction,
    });
  }

  public async chat(
    messages: Message[],
    maxReplyTokens?: number
  ): Promise<Message> {
    if (maxReplyTokens) {
      messages = this.shortenMessages(messages, maxReplyTokens);
    }
    return await this.makeRequest<Message>(Model.Gpt35Turbo, RequestType.Chat, {
      messages,
    });
  }

  private log(message?: string) {
    if (this._log) {
      if (message) console.log(message);
      else console.log();
    }
  }
}

export { OpenAI, Message, Model };
