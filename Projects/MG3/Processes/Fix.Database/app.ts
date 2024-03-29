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

  const getModInfo = async (text: string) => {
    if (!text) return {};

    const chat = await ChatOpenAI.new(Roles.ChatGPT, false, Model.Ada);

    try {
      const result = await chat.send(
        `Give me 0-1 scores for this text on the following dimensions:
      - shitpost (unintelligable text, nonsense)
      - offensive (racist, sexist, homophobic, etc)
      - spam (advertising)
      - quality (well written, interesting)
      - language (two letter language code)
  
      Reply in JSON format:
      { shitpost: 0.5, offensive: 0.5, spam: 0.5, quality: 0.5, language: "en" }
  
      The text is:
  
      ${text}
      `
      );

      return JSON.parse(result);
    } catch (ex: any) {
      console.log(text.bgRed.white);
      console.log(ex.message?.bgRed.white);
      return null;
    }
  };

  let docsCount = 0;
  let fixed = 0;
  let progress = null;

  let filter = {} as any;
  let sort = {} as any;

  // #region Posts

  // AI moderation on posts
  console.log(`Fixing ${`Posts`.green} moderation..`);

  let postsCount = await db.count("Posts", { Mod: { $exists: false } });

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

  // Fix Posts.Created
  console.log(`Fixing ${`Posts`.green} date..`);

  filter = {
    Created: { $type: "string" },
  };

  sort = {
    Created: -1,
  };

  postsCount = await db.count("Posts", filter);

  progress = Progress.newAutoDisplay(postsCount);

  for await (const post of db.findIterable("Posts", filter, sort)) {
    post.created = new Date(post.created).valueOf();

    await db.upsert("Posts", post);

    fixed++;
    progress.increment();
  }

  // #endregion

  // #region Instances

  console.log(`Fixing ${`Instances.Created`.green}..`);
  filter = { Created: { $type: "string" } };
  docsCount = await db.count("Instances", filter);
  console.log(`${docsCount} instances to fix..`);
  progress = Progress.newAutoDisplay(docsCount);
  for await (const instance of db.findIterable("Instances", filter, {
    Created: -1,
  })) {
    instance.Created = new Date(instance.Created);
    await db.upsert("Instances", instance);
    fixed++;
    progress.increment();
  }

  console.log(`Fixing ${`Instances.Created (null)`.green}..`);
  filter = { Created: null };
  docsCount = await db.count("Instances", filter);
  console.log(`${docsCount} instances to fix..`);
  progress = Progress.newAutoDisplay(docsCount);
  for await (const instance of db.findIterable("Instances", filter, {
    _id: -1,
  })) {
    let created = instance.createdDate;
    if (typeof created === "string") created = new Date(created);
    instance.created = created;
    instance.createdDate = created;
    await db.upsert("Instances", instance);
    fixed++;
    progress.increment();
  }
  // #endregion

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

  process.exit();
})();
