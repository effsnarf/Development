import fs from "fs";
import "colors";
import { Loading } from "@shared/Loading";
import { Configuration } from "@shared/Configuration";
import { Database } from "@shared/Database/Database";
import { ChatOpenAI, Roles } from "../../../../Apis/OpenAI/classes/ChatOpenAI";

const wait = (ms: number) => {
  const loading = Loading.startNew(`Waiting ${ms.unitifyTime()}..`);
  //return new Promise((resolve) => setTimeout(resolve, ms));
};

var isLetter = (str: string) => {
  return str.length === 1 && str.match(/[a-z]/i);
};

var removeCamelCaseKeys = (obj: any) => {
  const ret = {} as any;
  for (const key of Object.keys(obj)) {
    if (isLetter(key[0]) && key[0].toLowerCase() == key[0]) continue;
    ret[key] = obj[key];
  }
  return ret;
};

const convertKeysToTitleCase = (obj: any) => {
  const ret = {} as any;
  for (const key of Object.keys(obj)) {
    ret[key[0].toUpperCase() + key.slice(1)] = obj[key];
  }
  return ret;
};

(async () => {
  const config = (await Configuration.new()).data;
  const db = await Database.new(config.database.content);

  let pageIndex = 0;
  const batchSize = 10;
  const maxInstancesCount = 100;

  const tasks = {
    //Haiku: "Write a haiku about this meme",
    Poem: "Write a poem about this meme, with 9 stanzas, 4 lines each.",
    Article:
      "Write a 100 word article about this meme, as if you were an incredibly jaded and sarcastic article writer who's been in the business for 20 years and have already seen it all.",
    //aiInstances: "Write 10 examples of this meme in the topic of artificial intelligence",
  };

  while (true) {
    console.log(`Getting generators..`.gray);

    const generators = (
      await db.find(
        "Generators",
        {}, //{ IsQuality: true },
        { InstancesCount: -1 },
        batchSize,
        batchSize * pageIndex,
        false
      )
    ).map((g: any) => removeCamelCaseKeys(g));

    console.log(`Found ${generators.length} generators`.gray);

    console.log(generators.map((g) => g.DisplayName.gray).join("\n"));

    for (const generator of generators) {
      console.log(generator.DisplayName.green);

      let instancesCount = maxInstancesCount;
      const desc = generator.Desc || {};

      while (
        (instancesCount > 0 && !Object.values(desc).length) ||
        Object.values(desc).some((a) => !a) ||
        Object.keys(tasks).some((k) => !desc[k])
      ) {
        try {
          console.log(`${generator.DisplayName.green}`);
          console.log(
            `Getting ${generator.DisplayName.green} instances..`.gray
          );
          const instances = await db.find(
            "Instances",
            { LanguageCode: "en", GeneratorID: generator.GeneratorID },
            { TotalVotesScore: -1 },
            instancesCount,
            0,
            true
          );
          console.log(`Found ${instances.length} instances`.gray);

          for (const task of Object.entries(tasks)) {
            if (desc[task[0]]) continue;

            const message = `${task[1]}
  
        ${generator.DisplayName}
  
        ${instances.map((inst) =>
          [inst.text0, inst.text1].filter((a) => a).join(", ")
        )}
        `;
            console.log(`Generating ${task[0]}..`.gray);

            const chat = await ChatOpenAI.new(Roles.ChatGPT, false);
            const reply = await chat.send(message);

            console.log(reply.shorten(100).green);

            if (task[0] == "Haiku") {
              desc[task[0]] = reply.split("\n").map((a) => a.trim());
            }

            if (task[0] === "Poem") {
              desc[task[0]] = reply
                .split("\n\n")
                .map((a) => a.trim())
                .filter((a) => a)
                .map((a) => a.split("\n").map((a) => a.trim()));
            } else {
              desc[task[0]] = reply;
            }
          }
        } catch (ex: any) {
          instancesCount -= 5;
          console.log(`Trying again with ${instancesCount} instances..`.gray);
        } finally {
          await wait((1).minutes());
        }
      }

      generator.Desc = desc;

      await db.upsert("Generators", generator);
    }

    pageIndex++;
  }
})();
