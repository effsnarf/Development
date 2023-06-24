import fs from "fs";
import "colors";
import { Configuration } from "@shared/Configuration";
import {
  Console,
  Layout,
  Log,
  ObjectLog,
  LargeText,
  Bar,
  Unit,
} from "@shared/Console";
import { Progress } from "@shared/Progress";
import { Database } from "@shared/Database/Database";

(async () => {
  const config = (await Configuration.new()).data;

  const source = await Database.new(config.source.database);
  const target = await Database.new(config.target.database);

  let collIndex = 0;
  for (const collectionName of config.collections) {
    const count = await source.count(collectionName);

    console.log(
      `${`Importing`.gray} ${count.toLocaleString().green} ${
        `documents from`.gray
      } ${collectionName.yellow} (${++collIndex}/${config.collections.length})`
    );

    const progress = Progress.newAutoDisplay(count);

    for await (const doc of source.findIterable(
      "Events",
      undefined,
      undefined,
      undefined,
      undefined,
      true
    )) {
      if (doc.a.startsWith("MG.")) doc.a = "MG";
      if (doc.c.toLowerCase() == "site") {
        doc.c = "site";
      } else {
        doc.c = "network";
      }
      if (doc.e == "timeOnSite") doc.e = "time.on.site";

      source.upsert("Events", doc);
      await target.upsert("Events", doc);
      progress.increment();
    }
    progress.done();
  }

  console.log("Done".green);
  console.log();

  process.exit();
})();
