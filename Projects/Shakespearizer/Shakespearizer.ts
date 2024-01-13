import { Database } from "../../Shared/Database/Database";
import { DatabaseBase } from "../../Shared/Database/DatabaseBase";
import { Model, OpenAI } from "../../Apis/OpenAI/classes/OpenAI";
import { ChatOpenAI, Roles } from "../../Apis/OpenAI/classes/ChatOpenAI";
import { get } from "http";

class Shakespearizer {
  private db!: DatabaseBase;
  private chat!: ChatOpenAI;

  private constructor(private config: any) {}

  public static async new(config: any) {
    const shakespearizer = new Shakespearizer(config);
    await shakespearizer.init();
    return shakespearizer;
  }

  private async init() {
    this.db = await Database.new(this.config.database);
    this.chat = await ChatOpenAI.new(Roles.Null, true, Model.Gpt35Turbo);
  }

  private async toShakespearizedEnglish(texts: string[]) {
    texts = texts.map((text) => (text || "").trim());

    if (!texts.length) return [];

    const chatPrompt = `
    Rewrite all the strings in this array in the style of Shakespeare:
    (answer in this format and nothing else:)
    { shakespearized: ["...", "...", ...] }

    ${JSON.stringify(texts)}
    `;

    const result = JSON.parse(await this.chat.send(chatPrompt));
    const shakespearizedTexts = result.shakespearized;

    const items = texts.map((text, index) => ({
      text,
      shakespearized: shakespearizedTexts[index],
    }));

    // Cache the shakespearized texts.
    for (const item of items) {
      await this.setCachedShakespearizedText(item.text, item.shakespearized);
    }

    return texts.map((text, index) => ({
      text,
      shakespearized: shakespearizedTexts[index],
    }));
  }

  private async getCachedShakespearizedText(text: string) {
    const _id = text.hashCode();
    const item = await this.db.get(_id);
    if (!item) return null;

    return item.shakespearized;
  }

  private async setCachedShakespearizedText(
    text: string,
    shakespearized: string
  ) {
    const _id = text.hashCode();
    let item = await this.db.get(_id);
    if (!item) {
      item = {
        _id: _id,
        created: Date.now(),
        text,
        shakespearized,
      };
      await this.db.set(_id, item);
    }
  }

  async shakespearize(texts: string[]) {
    const results = [] as any[];

    // Create an initial result set with cached shakespearized texts.
    for (const text of texts) {
      const shakespearized = await this.getCachedShakespearizedText(text);
      results.push({ text, shakespearized });
    }

    // We don't need to shakespearize texts that are already cached.
    const nonShakespearizedResults = results.filter(
      (result) => !result.shakespearized
    );
    const newTexts = nonShakespearizedResults.map((result) => result.text);

    const newResults = await this.toShakespearizedEnglish(newTexts);

    // Update the results with the new shakespearized texts.
    for (const newResult of newResults) {
      const index = results.findIndex((r) => r.text === newResult.text);
      results[index] = newResult;
    }

    return results;
  }
}

export { Shakespearizer };
