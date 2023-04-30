import * as fs from "fs";
import * as jsyaml from "js-yaml";
import { Config } from "../Shared/Config";
import { Apify } from "@shared/Apify/Apify";
import { Database } from "./Database";

const config: Config = jsyaml.load(
  fs.readFileSync("../config.yaml", "utf8")
) as Config;

Database.config = config;

Apify.Server.startNew(
  "localhost",
  3009,
  "/api",
  [Database],
  "../../Shared/Apify"
);
