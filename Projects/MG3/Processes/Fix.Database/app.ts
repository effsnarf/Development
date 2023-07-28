import fs from "fs";
import "colors";
import { Configuration } from "@shared/Configuration";
import { Loading } from "@shared/Loading";
import { Progress } from "@shared/Progress";
import { Database } from "@shared/Database/Database";
import { ChatOpenAI, Roles } from "../../../../Apis/OpenAI/classes/ChatOpenAI";
import { Model } from "../../../../Apis/OpenAI/classes/OpenAI";
import { MongoDatabase } from "@shared/Database/MongoDatabase";

(async () => {
  const config = (await Configuration.new()).data;
  const db = (await Database.new(config.database)) as MongoDatabase;
  db.options.lowercaseFields = true;

  const chat = await ChatOpenAI.new(Roles.ChatGPT, false, Model.Ada);

  const getModInfo = async (text: string) => {
    if (!text) return {};

    const result = await chat.send(
      `Give me 0-1 scores for this text on the following dimensions:
      - shitpost (unintelligable text, nonsense)
      - offensive (racist, sexist, homophobic, etc)
      - spam (advertising)
      - quality (well written, interesting)
  
      Reply in JSON format:
      { shitpost: 0.5, spam: 0.5, quality: 0.5 }
  
      The text is:
  
      ${text}
      `
    );

    return JSON.parse(result);
  };

  let fixed = 0;

  let progress = null;

  // AI moderation on posts
  console.log(`Fixing ${`Posts`.green}..`);

  const postsCount = await db.count("Posts", { Mod: { $exists: false } });

  progress = Progress.newAutoDisplay(postsCount);

  for await (const post of db.findIterable(
    "Posts",
    {
      Mod: { $exists: false },
    },
    {}
  )) {
    post.Mod = await getModInfo(post.text);

    await db.upsert("Posts", post);

    fixed++;
    progress.increment();
  }

  // Fix Generators.InstancesCount
  if (false) {
    const generatorsCount = await db.count("Generators");
    console.log(`Fixing ${`Generators`.green}.${`InstancesCount`.yellow}..`);
    progress = Progress.newAutoDisplay(generatorsCount);

    for await (const gen of db.findAll("Generators")) {
      if (!gen.displayName) continue;

      const instancesCount = await db.count("Instances", {
        GeneratorID: gen._id,
      });
      if (gen.instancesCount !== instancesCount) {
        fixed++;
      }
      progress.increment();
    }
  }

  progress.done();
})();
