import fs from "fs";
import "colors";
import { Configuration } from "@shared/Configuration";
import { Loading } from "@shared/Loading";
import { Console } from "@shared/Console";
import { Database } from "@shared/Database/Database";

(async () => {
  const config = (await Configuration.new()).data;

  const connectionString = config.connectionString;

  const dbs = (
    await Promise.all(
      config.dbs.map(
        async (dbName: string) =>
          await Database.new({ connectionString, database: dbName })
      )
    )
  ).toMap((db) => db.database);

  // const items = await dbs.MG3.find("Items", {});
  //return items;

  console.clear();

  console.log(Object.keys(dbs).join(", ").yellow);

  while (true) {
    console.log();
    const s = await Console.readLines("Enter MongoDB code:");

    const loading = Loading.startNew("Executing..");

    const func = eval(`(async (dbs) => { ${s} })`);

    try {
      const result = await func(dbs);
      loading.stop();
      console.log(result);
    } catch (ex: any) {
      console.log(ex.message.trim(200).red);
    } finally {
      loading.stop();
    }
  }
})();
