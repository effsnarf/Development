import fs from "fs";
import "colors";
import { Configuration } from "@shared/Configuration";
import { Database } from "@shared/Database/Database";

(async () => {
  const config = (await Configuration.new()).data;

  const db = await Database.new(config.database.content);

  const batchSize = 10;

  console.log(`Getting generators..`.gray);

  const generators = await db.find(
    "Generators",
    {},
    { InstancesCount: -1 },
    batchSize,
    0,
    true
  );

  console.log(`Found ${generators.length} generators`.gray);

  for (const generator of generators) {
    console.log(`${generator.displayName.green}`);
  }
})();
