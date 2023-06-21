import fs from "fs";
import "colors";
import { Configuration } from "@shared/Configuration";
import { Database } from "@shared/Database/Database";
import { ChatOpenAI, Roles } from "../../../../Apis/OpenAI/classes/ChatOpenAI";

(async () => {
  const config = (await Configuration.new()).data;
  const db = await Database.new(config.database.content);

  const batchSize = 10;
  const maxInstancesCount = 100;

  console.log(`Getting generators..`.gray);

  const generators = await db.find(
    "Generators",
    {}, // { Desc: null },
    { InstancesCount: -1 },
    batchSize,
    0,
    true
  );

  console.log(`Found ${generators.length} generators`.gray);

  console.log(generators.map((g) => g.displayName.green).join("\n"));

  for (const generator of generators) {
    let instancesCount = maxInstancesCount;
    const desc = {} as any;
    while (
      (instancesCount > 0 && !Object.values(desc).length) ||
      Object.values(desc).some((a) => !a)
    ) {
      try {
        console.log(`${generator.displayName.green}`);
        console.log(`Getting ${generator.displayName.green} instances..`.gray);
        const instances = await db.find(
          "Instances",
          { LanguageCode: "en", GeneratorID: generator.generatorID },
          { TotalVotesScore: -1 },
          instancesCount,
          0,
          true
        );
        console.log(`Found ${instances.length} instances`.gray);

        const tasks = {
          //haiku: "Write a haiku about this meme",
          //poem: "Write a poem exactly 9 verses long about this meme",
          aiInstances:
            "Write 10 examples of this meme in the topic of cryptocurrency",
        } as any;

        for (const task of Object.entries(tasks)) {
          const message = `${task[1]}
  
        ${generator.displayName}
  
        ${instances.map((inst) =>
          [inst.text0, inst.text1].filter((a) => a).join(", ")
        )}
        `;
          console.log(`Generating ${task[0]}..`.gray);

          const chat = await ChatOpenAI.new(Roles.ChatGPT, false);
          const reply = await chat.send(message);

          console.log(reply);

          desc[task[0]] = reply;
        }
      } catch (ex: any) {
        instancesCount -= 5;
        console.log(`Trying again with ${instancesCount} instances..`.gray);
      }
    }

    generator.desc = desc;

    //db.upsert("Generators", generator);
  }
})();
