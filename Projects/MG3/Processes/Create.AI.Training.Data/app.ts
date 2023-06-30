import fs from "fs";
import "colors";
import { Configuration } from "@shared/Configuration";
import { Loading } from "@shared/Loading";
import { Progress } from "@shared/Progress";
import { Database } from "@shared/Database/Database";

(async () => {
  const config = (await Configuration.new()).data;
  const db = await Database.new(config.database);

  if (fs.existsSync(config.data.set.path)) fs.unlinkSync(config.data.set.path);

  console.clear();

  let loading = Loading.startNew(`Finding generators..`);

  const gens = await db.find(
    "Generators",
    { IsQuality: true },
    { InstancesCount: -1 },
    500,
    0,
    true
  );

  loading.stop(`Found ${gens.length} generators.`);

  const genProgress = Progress.newAutoDisplay(gens.length, {});

  for (const gen of gens) {
    let insts = await db.find(
      "Instances",
      { LanguageCode: "en", GeneratorID: gen.generatorID },
      { TotalVotesScore: -1 },
      500,
      0,
      true
    );
    insts = insts.filter((inst) => inst.text0?.length && inst.text1?.length);

    const lines = [];
    for (const inst of insts) {
      const line = {
        prompt: ``,
        completion: ` ${inst.displayName}\n${inst.text0}\n${inst.text1} ###`,
      };
      lines.push(line);
    }

    fs.appendFileSync(
      config.data.set.path,
      lines.map((l) => JSON.stringify(l)).join("\n") + "\n"
    );

    genProgress.increment();
  }

  genProgress.done();

  console.log();
})();
