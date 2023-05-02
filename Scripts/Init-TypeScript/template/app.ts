import fs from "fs";
import "colors";
import { Types } from "@shared/Types";
import { Configuration } from "@shared/Configuration";
import { Console } from "@shared/Console";

const config = Configuration.new({
  quitIfChanged: [__filename.replace(".temp.ts", "")],
  toAbsolutePaths: [],
  types: Types,
}).data;

const console = Console.new();

console.log("Hello from TypeScript!");
