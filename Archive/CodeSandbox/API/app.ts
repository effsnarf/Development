import fs from "fs";
import "colors";
import { Configuration } from "@shared/Configuration";
import { Apify } from "@shared/Apify";
import { Database } from "@shared/Database/Database";

import { Tournament } from "../../../Games/Tournament/Tournament";

class Counter {
  count: number = 0;

  constructor(test: number) {
    this.count = test || 0;
  }

  async increase() {
    this.count++;
  }
}

(async () => {
  const config = (await Configuration.new()).data;

  const classes = [Counter, Tournament];

  const apify = Apify.Server.startNew(
    config.server.host,
    config.server.port,
    "",
    classes
  );
})();
