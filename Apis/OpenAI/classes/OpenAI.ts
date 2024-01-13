import util from "util";
import { getEncoding, encodingForModel } from "js-tiktoken";
import axios, { AxiosResponse } from "axios";
import { Objects } from "../../../Shared/Extensions.Objects";
import * as colors from "colors";

import { Loading } from "../../../Shared/Loading";

interface Message {
  role: "user" | string;
  content: string;
  tool_calls?: any;
}

interface Response {
  choices: {
    text: string;
    message: Message;
  }[];
}

enum Model {
  Default = "gpt-4-vision-preview",
  Gpt4VisionPreview = "gpt-4-vision-preview",
  Gpt4 = "gpt-4",
  Gpt35Turbo = "gpt-3.5-turbo",
  Gpt35Turbo16k = "gpt-3.5-turbo-16k",
  Davinci = "text-davinci-003",
  Ada = "text-ada-001",
}

enum RequestType {
  Completion = "completions",
  Edit = "edits",
  Chat = "chat/completions",
}

class OpenAI {
  public static defaultApiKey: string = `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`;
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
      case Model.Gpt4:
        return 4096;
      case Model.Gpt4VisionPreview:
        return 4096;
      case Model.Davinci:
        return 4096;
      default:
        throw new Error(`Unknown model ${this.model}`);
    }
  }

  static new(
    log: boolean = true,
    model: Model = Model.Default,
    apiKey?: string
  ): OpenAI {
    if (!apiKey) throw new Error("API key not set.");
    return new OpenAI(apiKey, model, log);
  }

  private constructor(apiKey: string, model: Model, log: boolean = true) {
    this._log = log;
    this.endpoint = "https://api.openai.com/v1/";
    this.apiKey = apiKey;
    this.model = model;
    if (!this.model?.length) model = Model.Default;
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
      let tokens = this.countTokens(prompt.substring(0, mid));
      if (tokens > this.maxTotalTokens - replyTokens) {
        max = mid;
      } else {
        min = mid + 1;
      }
      mid = Math.floor((min + max) / 2);
    }
    prompt = prompt.substring(0, mid);
    const tokens = this.countTokens(prompt);
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
      let tokens = this.countTokens(messages.slice(0, mid));
      if (tokens > this.maxTotalTokens - replyTokens) {
        max = mid;
      } else {
        min = mid + 1;
      }
      mid = Math.floor((min + max) / 2);
      if (mid <= 0) throw new Error(`mid is ${mid}`);
    }
    messages = messages.slice(0, mid);
    const tokens = this.countTokens(JSON.stringify(messages));
    console.log(
      `Messages shortened to ${messages.length}/${originalLength} messages, ${tokens} tokens`
        .gray
    );
    return messages;
  }

  private countTokens(message: any) {
    if (!message) {
      throw new Error(`message is ${message}`);
    }
    if (typeof message != "string") {
      message = JSON.stringify(message);
    }
    const tokens = getEncoding("gpt2").encode(message).length;
    return tokens;
  }

  async makeRequest<T>(
    model: string,
    type: string,
    dataProps: any,
    desc?: string,
    tools?: any,
    toolMethods?: any,
    useTools?: boolean
  ): Promise<T> {
    return await this._makeRequest(
      model,
      type,
      dataProps,
      desc,
      tools,
      toolMethods,
      useTools
    );
  }

  private async _makeRequest<T>(
    model: string,
    type: string,
    dataProps: any,
    desc?: string,
    tools?: any,
    toolMethods?: any,
    useTools?: boolean
  ): Promise<T> {
    const promptText =
      dataProps.prompt || dataProps.input || dataProps.messages || dataProps;

    const tokens = this.countTokens(promptText);
    const maxReplyTokens = this.maxTotalTokens - tokens;

    if (!useTools) tools = null;

    // if (false)
    // console.log(
    //   `Max reply tokens: ${maxReplyTokens} (${tokens} tokens used)`.gray
    // );

    const data = {
      model: model,
      tools: tools,
      max_tokens: 500,
      ...dataProps,
    };

    if (false) console.log(data.stringify().shorten(400));

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };

    const endpoint = `${this.endpoint}${type}`;

    let response: AxiosResponse<Response>;
    const loading = Loading.startNew();
    try {
      this.loading.start(desc);
      response = await axios.post<Response>(endpoint, data, {
        headers,
        timeout: (60).seconds(),
      });
      this.log();
      if (dataProps.messages) {
        //this.log(colors.cyan(dataProps.messages.last().content).shorten(100));
      } else {
        this.log(JSON.stringify(dataProps).shorten(100));
      }
    } catch (ex: any) {
      let msg = ex.response?.data?.error?.message || ex.message;
      //this.log();
      //this.log(msg);
      if (msg.includes("Rate limit reached")) {
        await this.wait(msg.bgRed.white, (5).seconds());
        return await this.makeRequest<T>(model, type, dataProps, desc);
      }
      if (["ECONNRESET", "socket hang up"].some((err) => msg.includes(err)))
        return await this.makeRequest<T>(model, type, dataProps, desc);
      //console.log(util.inspect(data, false, null, true));
      throw msg ? new Error(msg) : ex;
    } finally {
      loading.stop();
      this.loading.stop();
    }

    let choices = response.data.choices;
    if (choices.length > 1)
      throw new Error(`${choices.length} choices returned`);
    if (choices[0].text) choices[0].text = choices[0].text.trim();
    const responseMessage = choices[0].message;

    try {
      if (responseMessage)
        responseMessage.content = responseMessage.content?.trim();
      let reply = (choices[0].text || responseMessage) as T;
      if (typeof reply == "string") {
        if (reply.toString().startsWith("```json")) {
          reply = reply.substring(7, reply.length - 3) as T;
        }
      }

      // Step 2: check if the model wanted to call a function
      const toolCalls = responseMessage.tool_calls;
      if (responseMessage.tool_calls) {
        data.messages.push(responseMessage);
        // Step 3: call the function
        // Note: the JSON response may not always be valid; be sure to handle errors
        const availableFunctions = toolMethods;
        for (const toolCall of toolCalls) {
          const functionResponse = await this.executeToolCall(
            toolMethods,
            toolCall
          );
          data.messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: toolCall.function.name,
            content: functionResponse,
          }); // extend conversation with function response
        }
        // get a new response from the model where it can see the function response
        const secondResponse = await this._makeRequest(
          model,
          type,
          data,
          desc,
          tools,
          toolMethods
        );
        return secondResponse as T;
      }

      this.log();
      this.log((reply as any)?.content || reply);
      return reply;
    } catch (ex: any) {
      console.log(util.inspect(responseMessage, false, null, true));
      throw ex;
    }
  }

  private async executeToolCall(toolMethods: any, toolCall: any) {
    const loading = Loading.startNew();
    try {
      const functionName = toolCall.function.name;
      const functionToCall = toolMethods[functionName];
      if (!functionToCall) return `Error: function ${functionName} not found`;
      const functionArgs = JSON.parse(toolCall.function.arguments);
      console.log();
      console.log(
        `${functionName} (${JSON.stringify(functionArgs)})`.bgWhite.black
      );
      const timeout = (5).seconds();
      let functionResponse = null;
      try {
        functionResponse = await Objects.awaitWithTimeout(
          async () => await functionToCall(functionArgs),
          timeout
        );
      } catch (ex: any) {
        functionResponse = `Error: ${ex.message}`;
      }
      return functionResponse;
    } finally {
      loading.stop();
    }
  }

  private async wait(message: string, ms: number) {
    return new Promise((resolve: Function) => {
      const loading = Loading.startNew(
        `${`${`waiting`.gray} ${ms.unitifyTime()}`} ${message}`
      );
      setTimeout(() => {
        loading.stop();
        resolve();
      }, ms);
    });
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
    maxReplyTokens?: number,
    desc?: string,
    json?: boolean,
    tools?: any,
    toolMethods?: any,
    useTools?: boolean
  ): Promise<Message> {
    if (maxReplyTokens) {
      //messages = this.shortenMessages(messages, maxReplyTokens);
    }
    const data = {
      messages,
    } as any;

    if (json) data.response_format = { type: "json_object" };

    return await this.makeRequest<Message>(
      this.model,
      RequestType.Chat,
      data,
      desc,
      tools,
      toolMethods,
      useTools
    );
  }

  private log(message?: string) {
    if (!this._log) return;

    try {
      const obj = JSON.parse(message || "null");
      console.log(obj);
      return;
    } catch (ex) {
      // Ignore
    }

    if (message) console.log(message);
    else console.log();
  }
}

export { OpenAI, Message, Model };
