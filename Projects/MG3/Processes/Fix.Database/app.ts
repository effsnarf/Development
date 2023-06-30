import fs from "fs";
import "colors";
import { Configuration } from "@shared/Configuration";
import { Loading } from "@shared/Loading";
import { Progress } from "@shared/Progress";
import { Database } from "@shared/Database/Database";

(async () => {
  const config = (await Configuration.new()).data;
  const db = await Database.new(config.database);

  const loading = Loading.startNew(
    `Fixing ${`Generators`.green}.${`InstancesCount`.yellow}..`
  );

  const generatorsCount = await db.count("Generators");

  const progress = Progress.newAutoDisplay(generatorsCount);

  for await (const gen of db.findIterable("Generators", {}, { _id: 1 })) {
    progress.increment();
  }

  progress.done();
})();
