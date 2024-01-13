import { Database } from "../../Shared/Database/Database";
import { DatabaseBase } from "../../Shared/Database/DatabaseBase";
import { Model, OpenAI } from "../../Apis/OpenAI/classes/OpenAI";
import { ChatOpenAI, Roles } from "../../Apis/OpenAI/classes/ChatOpenAI";

class Shakespearizer {
  private db!: DatabaseBase;
  private chat!: ChatOpenAI;

  // AI text generation is not deterministic.
  // We might want to save several variations of the same sentence.
  private maxVariations = 1;

  private constructor(private config: any) {}

  public static async new(config: any) {
    const shakespearizer = new Shakespearizer(config);
    await shakespearizer.init();
    return shakespearizer;
  }

  private async init() {
    this.db = await Database.new(this.config.database);
    this.chat = await ChatOpenAI.new(Roles.Null, false, Model.Gpt35Turbo);
  }

  private async toShakespearizedEnglish(text: string) {
    text = (text || "").trim();
    if (!text.length) return "";

    const hasPeriod = text.endsWith(".");

    if (!hasPeriod) text += ".";

    const chatPrompt = `
    Sheakspearize this:
    (answer with only the Sheakspearized version and nothing else)
    (make sure to keep all HTML tags intact, if exist)

    ${text}`;

    //let shakespearized = await this.opanAI.complete(completionPrompt);

    let shakespearized = await this.chat.send(chatPrompt);

    // If we had to add a period to the input text, we should remove it from the output.
    if (!hasPeriod && shakespearized.endsWith("."))
      shakespearized = shakespearized.slice(0, -1);

    return shakespearized;
  }

  async shakespearize(text: string) {
    text = (text || "").trim();
    if (!text.length) return "";

    const _id = text.hashCode();
    let item = await this.db.get(_id);
    if (!item) {
      item = {
        _id: _id,
        created: Date.now(),
        text: text,
        shakespearized: [],
      };
    }

    const getNewVariation = async () => {
      const shakespearized = await this.toShakespearizedEnglish(text);
      item.shakespearized.push({
        created: Date.now(),
        text: shakespearized,
      });
      await this.db.set(_id, item);
    };

    if (item.shakespearized.length < 1) {
      await getNewVariation();
    }
    if (item.shakespearized.length < this.maxVariations) {
      setTimeout(getNewVariation, 1);
    }

    const randomIndex = Math.floor(Math.random() * item.shakespearized.length);
    const shakespearized = item.shakespearized[randomIndex];
    return shakespearized.text;
  }
}

export { Shakespearizer };
