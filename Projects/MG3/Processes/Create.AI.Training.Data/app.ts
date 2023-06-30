import fs from "fs";
import "colors";
import { Configuration } from "@shared/Configuration";
import { Loading } from "@shared/Loading";
import { Progress } from "@shared/Progress";
import { Database } from "@shared/Database/Database";

(async () => {
  const config = (await Configuration.new()).data;
  const db = await Database.new(config.database);
  fs.unlinkSync(config.data.set.path);

  console.clear();

  const filter = {
    LanguageCode: "en",
    UrlName: "Insanity-Wolf",
  };

  const sort = {
    TotalVotesScore: -1,
  };

  const limit = 500;
  const skip = 0;

  const loading = Loading.startNew(`Finding instances...`);

  let insts = await db.find("Instances", filter, sort, limit, skip, true);
  insts = insts.filter((inst) => inst.text0?.length && inst.text1?.length);

  loading.stop(`Found ${insts.length} instances.`);

  const progress = Progress.newAutoDisplay(insts.length, {});

  for (const inst of insts) {
    const line = {
      prompt: inst.displayName,
      completion: `${inst.text0}\n${inst.text1}###`,
    };
    fs.appendFileSync(config.data.set.path, JSON.stringify(line) + "\n");
    progress.increment();
  }

  progress.done();
  console.log();
})();
