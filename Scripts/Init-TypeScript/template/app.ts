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

(async () => {
  const config = (
    await Configuration.new({
      quitIfChanged: [__filename.replace(".temp.ts", "")],
      toAbsolutePaths: [],
      types: Types,
    })
  ).data;

  console.log("Hello from TypeScript!");
})();
