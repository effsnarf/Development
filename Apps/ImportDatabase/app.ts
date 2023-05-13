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
import { Database } from "@shared/Database/Database";

(async () => {
  const config = (await Configuration.new2(__filename)).data;

  const source = Database.new(config.source.database);
})();
