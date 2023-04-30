import fs from "fs";
import "colors";
import { Configuration } from "@shared/Configuration";
import { Console } from "@shared/Console";

const config = Configuration.new({
  quitIfChanged: [__filename],
}).data;

const console = Console.new();

console.log("Hello from TypeScript!");
