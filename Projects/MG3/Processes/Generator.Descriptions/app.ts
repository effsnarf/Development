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
    { Description: null },
    { InstancesCount: -1 },
    batchSize,
    0,
    true
  );

  for (const generator of generators) {
    console.log(`${generator.displayName.green}`);
  }
})();
