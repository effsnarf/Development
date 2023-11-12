import { Loading } from "./Loading";
import { Google } from "./Google";
import { OpenAI } from "../Apis/OpenAI/classes/OpenAI";
import { ChatOpenAI, Roles } from "../Apis/OpenAI/classes/ChatOpenAI";
import { TypeScript } from "./TypeScript";

enum GptDataType {
  JavaScriptCode = "JavaScriptCode",
  TypeScriptTypes = "TypeScriptTypes",
  FunctionDeclaration = `FunctionDeclaration`,
  Explanation = `Explanation`,
}

type CodeExpression = string;
type TypeScriptDataType = string;

type FuncDecl = {
  name: string;
  args: CodeExpression;
  returnType: TypeScriptDataType;
  func: Function;
};

type JsonSchema = any;

class Gpt {
  private chat!: ChatOpenAI;

  private constructor() {}

  static async new() {
    const gpt = new Gpt();
    gpt.chat = await ChatOpenAI.new(Roles.ChatGPT, false);
    return gpt;
  }

  async task(taskDesc: string) {
    const gptFunc = await this.createFunction(taskDesc);

    return gptFunc;
  }

  async textToData(
    text: string,
    dataRequired: string,
    dataType: TypeScriptDataType,
    progress: { processed: number; total: number } = { processed: 0, total: 0 }
  ) {
    if (!progress.total) {
      progress.total = text.length;
    }
    try {
      const result = await this.call(
        `get the data from this text:
        the data i need is:
        ${dataRequired}
        
        the text is:
        
        ${text}`,
        dataType,
        true,
        false
      );

      progress.processed += text.length;

      console.log(
        `${(progress.processed / progress.total).toProgressBar(50)} ${`${
          dataType.toString().blue.bold
        } ${dataRequired.gray}`}`
      );

      return result;
    } catch (ex: any) {
      const lengthErrors = [
        "is less than the minimum",
        "maximum context length",
      ];
      try {
        if (!lengthErrors.some((le) => ex.toString().includes(le))) throw ex;
        const blocks = this.splitInTwo(text);
        //console.log(`Splitting to ${blocks.map((b) => b.length)} blocks`.gray);
        const results = [] as any[];
        for (const block of blocks) {
          const result = await this.textToData(
            block,
            dataRequired,
            dataType,
            progress
          );
          results.push(result);
        }
        const joinedResults = await this.call(
          `join these to one ${dataType}:
        
        ${results.map((r) => JSON.stringify(r)).join("\n\n\n")}`,
          dataType
        );
      } catch (ex2: any) {
        console.log("error 2");
        console.log(ex);
        throw ex2;
      }
    } finally {
    }
  }

  async urlToData(
    url: string,
    dataRequired: string,
    dataType: TypeScriptDataType
  ) {
    const html = await this.fetch(url);
    const text = html.htmlToText();
    return await this.textToData(text, dataRequired, dataType);
  }

  private async fetch(url: string): Promise<string> {
    return new Promise(async (resolve: Function) => {
      //const loading = Loading.startNew(`${`fetching`.gray} ${url.yellow}`);
      const text = await (await fetch(url)).text();
      //loading.stop();
      resolve(text);
    });
  }

  private splitInTwo(text: string) {
    if (!text?.length) return [];
    const lines = text.split("\n");
    let length1 = 0;
    const half = Math.round(lines.length / 2);
    const lines1 = [] as string[];
    for (const line of lines) {
      if (length1 > half) break;
      lines1.push(line);
      length1 += line.length;
    }
    const lines2 = lines.slice(lines1.length);
    return [lines1.join("\n"), lines2.join("\n")];
  }

  async createFunction(funcDesc: string) {
    const returnTypeSchema = await this.call(
      `describe the return type of this task:\n\n${funcDesc}`,
      GptDataType.TypeScriptTypes
    );

    const existingGptFunctions = `
    assuming these types exist:
    ${`type GoogleSearchResult = {
        title: string;
        url: string;
        description: string;
    }`}

    assuming that you can use a gpt object with the following methods (no need to import it):
    
    async gpt.google(query: string): Promise<GoogleSearchResult[]>;
    returns a list of Google search results for the query

    async gpt.getWebPage(url: string): Promise<string>
    returns the content of the web page at the url

    async gpt.getDataFromNaturalText(text: string, detailedDataDescription: string, dataSchema: string (of a TypeScript type)): Promise<any>
    
    `;

    const writeFunctionTaskDesc = `
    write a complete implementation of a TypeScript function declaration with a return type:
    ${returnTypeSchema}
    
    that does this:
    ${funcDesc}
    
    ${existingGptFunctions}
    
    `;

    const funcDecl = await this.call(
      writeFunctionTaskDesc,
      GptDataType.FunctionDeclaration
    );

    const funcName = funcDecl.split("(")[0].trim().split(" ").last();
    const funcArgs = funcDecl
      .split("(")[1]
      .split(")")[0]
      .trim() as CodeExpression;
    const funcReturnType = funcDecl
      .split(":")[1]
      .trim()
      .split("{")[0]
      .trim() as CodeExpression;

    const jsFuncDecl = await this.call(
      `transpile this to JavaScript
        ${funcDecl}
        `,
      GptDataType.JavaScriptCode
    );

    return {
      name: funcName,
      args: funcArgs,
      returnType: funcReturnType,
      func: eval(`(${jsFuncDecl})`),
    } as FuncDecl;
  }

  async google(query: string) {
    return await Google.search(query);
  }

  async call(
    prompt: string,
    returnType: GptDataType | JsonSchema,
    briefly = true,
    log?: boolean
  ) {
    try {
      let responseText = await this.chat.send(
        `answer with ${(returnType as string)
          .getCaseWords()
          .join(" ")
          .toLowerCase()} and nothing else. ${
          !briefly ? "" : `answer with the shortest possible answer`
        }\n${prompt}`,
        undefined,
        log
      );

      responseText = responseText.replace("```typescript", "");
      responseText = responseText.replace("```javascript", "");
      responseText = responseText.replace("```", "");

      try {
        return JSON.parse(responseText);
      } catch {
        return responseText;
      }
    } finally {
    }
  }
}

export { Gpt };
