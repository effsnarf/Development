import fs from "fs";
import "colors";
import { Types } from "@shared/Types";
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
import { Database } from "@shared/Database";

(async () => {
  const config = (
    await Configuration.new({
      quitIfChanged: [__filename.replace(".temp.ts", "")],
      toAbsolutePaths: [],
      types: Types,
    })
  ).data;

  const source = Database.new(config.source);
})();
