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
    const targetMaxID =
      ((await target.find(collectionName, {}, { _id: -1 }, 1))[0]?._id || 0) -
      100000;

    console.log(
      `${`Importing`.gray} ${`documents from`.gray} ${
        collectionName.yellow
      } (${++collIndex}/${config.collections.length}) starting from ID ${
        targetMaxID.toLocaleString().yellow
      }`
    );

    const progress = Progress.newAutoDisplay();

    let importedCount = 0;

    for await (const doc of source.findIterable(
      collectionName,
      undefined,
      undefined,
      undefined,
      undefined,
      true
    )) {
      if (doc._id <= targetMaxID) continue;

      if (doc.a.startsWith("MG.")) doc.a = "MG";
      if (doc.c.toLowerCase() == "site") {
        doc.c = "site";
      } else {
        doc.c = "network";
      }
      if (doc.e == "timeOnSite") doc.e = "time.on.site";
      if (doc.e == "time.on.site") doc.e = "active.time";

      source.upsert(collectionName, doc);
      await target.upsert(collectionName, doc);
      progress.increment();
      importedCount++;
    }
    progress.done();
    console.log();
    console.log(
      `Imported ${importedCount.toLocaleString().green} documents in the ${
        collectionName.yellow
      } collection.`
    );
  }

  console.log("Done".green);
  console.log();

  process.exit();
})();
