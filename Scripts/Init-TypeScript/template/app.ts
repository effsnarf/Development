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

(async () => {
  const config = (await Configuration.new()).data;

  console.log("Hello from TypeScript!");
})();
