import fs from "fs";
import "colors";
import util from "util";
import { Configuration } from "@shared/Configuration";
import { Loading } from "@shared/Loading";
import { Database } from "@shared/Database/Database";
import { AI } from "@shared/AI";

(async () => {
  const config = (await Configuration.new()).data;
  //const db = await Database.new(config.database);

  //console.log(result);
})();
