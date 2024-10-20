import fs from "fs";
import path from "path";
import "colors";
import { Configuration } from "@shared/Configuration";
import { Objects } from "@shared/Extensions.Objects";
import { Loading } from "@shared/Loading";
import { Files } from "@shared/Files";
import { WebScript } from "@shared/WebScript/WebScript";
const Handlebars = require("Handlebars");

const structureFolders = ["layouts", "pages", "components"];

const getTime = () => new Date().toLocaleTimeString();

(async () => {
  const config = (
    await Configuration.new(undefined, path.join(__dirname, `config.yaml`))
  ).data;

  const argv = process.argv;
  const outputFolder = argv[argv.length - 1];
  const inputFolders = argv.slice(2, argv.length - 1);

  if (!inputFolders.length || !outputFolder?.length) {
    console.error(
      "Please specify input folder (ws.yaml components) and output folder (sfc)"
        .bgRed.white
    );
    process.exit(1);
  }

  const handlebarsHelpers = Objects.parseYaml(
    fs.readFileSync(
      path.join(__dirname, config.webscript.folder, "handlebars.helpers.yaml"),
      "utf8"
    )
  ).helpers;

  const withoutStructureFolder = (compName: string) => {
    for (const folder of structureFolders) {
      if (compName.toLowerCase().startsWith(folder))
        return compName.substring(folder.length);
    }
    return compName;
  };

  const getSfcPath = (input: any, outputFolder: string) => {
    outputFolder = path.normalize(outputFolder);
    const isPage = outputFolder.includes("\\pages");
    const compName = withoutStructureFolder(input.capitalizedName);
    let fileName = `${compName}.vue`;
    const lastFolder = path.normalize(outputFolder).split("\\").pop() as string;
    // .vue files in [pages] and [layouts] are lowercase
    if (lastFolder != "components") fileName = fileName.toLowerCase();

    const sfcPath = isPage
      ? path.join(outputFolder, compName.toLowerCase(), "_.vue")
      : path.join(outputFolder, fileName);

    Files.ensureFolderExists(sfcPath);
    return sfcPath;
  };

  const transpile = async (
    compPath: any,
    inputFolder: string,
    outputFolder: string
  ) => {
    const input = WebScript.load(inputFolder, compPath.absolutePath);
    await WebScript.transpile(input);
    const sfcPath = getSfcPath(input, outputFolder);
    fs.writeFileSync(sfcPath, input.vueSfcComp);
    console.log(
      `${getTime().gray} ${input.name.padEnd(20).cyan} \t ${inputFolder.padEnd(30).gray} \t ${sfcPath.green}`
    );
  };

  const getCompPaths = async (inputFolder: string) => {
    const baseFolder = path.resolve(inputFolder);
    const paths = (await Files.getFiles(inputFolder, { recursive: true }))
      .filter((f) => f.endsWith(".ws.yaml"))
      .map((compPath) => ({
        absolutePath: compPath,
        relativePath: path.relative(baseFolder, compPath),
      }));
    //if (!paths.length) console.log(`No paths found in ${inputFolder}`.yellow);
    return paths;
  };

  const transpileAllInFolder = async (
    inputFolder: string,
    outputFolder: string
  ) => {
    for (const compPath of await getCompPaths(inputFolder)) {
      await transpile(compPath, inputFolder, outputFolder);
    }
  };

  const transpileAll = async () => {
    for (const inputFolder of inputFolders) {
      console.log(`transpiling ${inputFolder} to ${outputFolder}`.green);
      for (const folder of structureFolders) {
        await transpileAllInFolder(
          path.join(inputFolder, folder),
          path.join(outputFolder, folder)
        );
      }
    }
  };

  const webscriptFolder = path.resolve(
    path.join(__dirname, `../../../Shared/WebScript`)
  );

  Files.watch(
    [...inputFolders, webscriptFolder],
    { recursive: true, exclude: [] },
    transpileAll
  );

  transpileAll();
})();
