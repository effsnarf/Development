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

  const inputFolder = process.argv[2];
  const outputFolder = process.argv[3];

  if (!inputFolder?.length || !outputFolder?.length) {
    console.error(
      "Please specify input folder (ws.yaml components) and output folder (sfc)"
        .bgRed.white
    );
    process.exit(1);
  }

  const handlebarsHelpers = Objects.parseYaml(
    fs.readFileSync(
      path.join(config.webscript.folder, "handlebars.helpers.yaml"),
      "utf8"
    )
  ).helpers;

  const baseFolder = path.resolve(inputFolder);

  const getSfcPath = (input: any, outputFolder: string) => {
    const compIsApp = input.name == "app";
    const compsFolder = compIsApp ? "" : "components";
    const sfcPath = path.join(
      outputFolder,
      compsFolder,
      `${input.capitalizedName}.vue`
    );
    Files.ensureFolderExists(sfcPath);
    return sfcPath;
  };

  const transpile = (compPath: any) => {
    const input = WebScript.load(inputFolder, compPath.absolutePath);
    WebScript.transpile(input);
    const sfcPath = getSfcPath(input, outputFolder);
    fs.writeFileSync(sfcPath, input.vueSfcComp);
    console.log(`${sfcPath}`.green);
  };

  const compPaths = (await Files.getFiles(inputFolder, { recursive: true }))
    .filter((f) => f.endsWith(".ws.yaml"))
    .map((compPath) => ({
      absolutePath: compPath,
      relativePath: path.relative(baseFolder, compPath),
    }));

  for (const compPath of compPaths) {
    // Watch the file for changes
    fs.watchFile(compPath.absolutePath, () => transpile(compPath));
  }

  const transpileAll = () => {
    for (const compPath of compPaths) {
      transpile(compPath);
    }
  };

  const watchedFolder = path.resolve(`../../../../Shared/WebScript`);
  fs.watch(watchedFolder, transpileAll);

  transpileAll();
})();
