import fs from "fs";
import "colors";
import { Configuration } from "@shared/Configuration";
import { Loading } from "@shared/Loading";
import { Database } from "@shared/Database/Database";

(async () => {
  const config = (await Configuration.new()).data;
  const db = await Database.new(config.database);

  const loading = Loading.startNew("Processing..");
})();
