import fs from "fs";
import "colors";
import { Configuration } from "@shared/Configuration";
import { Database } from "@shared/Database/Database";

(async () => {
  const config = (await Configuration.new()).data;

  const db = await Database.new(config.database);

  const filter = {
    UrlName: "Courage-Wolf",
  };

  const sort = {
    InstancesCount: -1,
  };

  const limit = 10;
  const skip = 0;

  const insts = await db.find("Instances", filter, sort, limit, skip);

  console.log(`Found ${insts.length} instances.`.green);

  console.log(
    insts.map((inst) => [inst.text0, inst.text].onlyTruthy().join(", "))
  );
})();
