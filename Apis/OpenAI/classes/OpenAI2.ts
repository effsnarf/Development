import OpenAI from "openai";
import { Configuration as Config2 } from "../../../Shared/Configuration";
import { Loading } from "../../../Shared/Loading";
import fs from "fs";

namespace OpenAI2 {
  class Assistant {
    static async create() {}

    static async test() {
      const config = (await Config2.new()).data;

      const loading = Loading.startNew("OpenAI");

      const openai = new OpenAI();

      const prompt = fs.readFileSync(`c:/eff/prompt.txt`, "utf8");

      const assistant = await openai.beta.assistants.create({
        name: "Math Tutor",
        instructions: "You are a database expert.",
        tools: [{ type: "code_interpreter" }],
        model: "gpt-4-1106-preview",
      });

      const thread = await openai.beta.threads.create();

      const message = await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: prompt,
      });

      let run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistant.id,
        instructions: "",
      });

      while (["queued", "in_progress"].includes(run.status)) {
        run = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      }

      console.log(run.status);

      const messages = await openai.beta.threads.messages.list(thread.id);

      loading.stop();

      console.log(`Loading: ${loading.elapsed.unitifyTime()}`);

      return messages.data.map((m) => m.content).map((a) => a[0]);
    }
  }
}

export { OpenAI2 };
