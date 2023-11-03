import fs from "fs";
import "colors";
import { Configuration } from "@shared/Configuration";
import { Loading } from "@shared/Loading";
import { Database } from "@shared/Database/Database";
import { Gpt } from "@shared/Gpt";

(async () => {
  const config = (await Configuration.new()).data;
  //const db = await Database.new(config.database);

  console.clear();

  const gpt = await Gpt.new();

  // await gpt.task(
  //   "returns a list of eSim enabled android phone names, order by price ascending"
  // );

  const results = (await gpt.google("android phones with esim")).take(5);

  const phoneNames = [] as string[];

  for (const result of results) {
    const phoneNames2 = await gpt.urlToData(
      result.url,
      "android phones that support esim",
      "string[]"
    );
    phoneNames.push(...phoneNames2);
  }

  console.log(phoneNames);
})();
