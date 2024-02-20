import fs from "fs";
import path from "path";
import "colors";
import { Configuration } from "@shared/Configuration";
import { Objects } from "@shared/Extensions.Objects";
import { Loading } from "@shared/Loading";
import { Files } from "@shared/Files";
import { WebScript } from "@shared/WebScript/WebScript";
const Handlebars = require("Handlebars");

(async () => {
  const config = (
    await Configuration.new(undefined, path.join(__dirname, `config.yaml`))
  ).data;

  const folder = process.argv[2];

  if (!folder?.length) {
    console.error("No folder specified".bgRed.white);
    process.exit(1);
  }

  const handlebarsHelpers = Objects.parseYaml(
    fs.readFileSync(
      path.join(config.webscript.folder, "handlebars.helpers.yaml"),
      "utf8"
    )
  ).helpers;

  const baseFolder = path.resolve(folder);

  const compPaths = (await Files.getFiles(folder, { recursive: true })).map(
    (compPath) => ({
      absolutePath: compPath,
      relativePath: path.relative(baseFolder, compPath),
    })
  );

  for (const compPath of compPaths) {
    try {
      console.log(`${compPath.relativePath}`.green);
      WebScript.transpile(compPath.absolutePath);
    } catch (ex: any) {
      console.error(`Error processing ${compPath.relativePath}`.bgRed.white);
      throw ex;
    }
  }
})();
