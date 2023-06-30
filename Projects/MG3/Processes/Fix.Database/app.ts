import fs from "fs";
import "colors";
import { Configuration } from "@shared/Configuration";
import { Loading } from "@shared/Loading";
import { Progress } from "@shared/Progress";
import { Database } from "@shared/Database/Database";

(async () => {
  const config = (await Configuration.new()).data;
  const db = await Database.new(config.database);

  let fixed = 0;

  const generatorsCount = await db.count("Generators");

  console.log(`Fixing ${`Generators`.green}.${`InstancesCount`.yellow}..`);
  const progress = Progress.newAutoDisplay(generatorsCount);

  for await (const gen of db.findIterable(
    "Generators",
    {},
    { _id: 1 },
    undefined,
    undefined,
    true
  )) {
    const instancesCount = await db.count("Instances", {
      GeneratorID: gen._id,
    });
    if (gen.instancesCount !== instancesCount) {
      fixed++;
      console.log(gen);
      console.log(gen.displayName, instancesCount - gen.instancesCount);
    }
    progress.increment();
  }

  progress.done();
})();
