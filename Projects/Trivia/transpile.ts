import path from "path";
import fs from "fs";
import "colors";
import "../../../Shared/Extensions";
import { Files } from "../../../Shared/Files";
import { WebComp } from "../../../Shared/WebComp/WebComp";

let transpileWebComponent = (filePath: string) => {
  try {
    WebComp.transpile(filePath, path.join(__dirname, `./my-app/src`));
  } catch (ex: any) {
    console.log(ex.message.bgRed.white);
  }
};

console.log(`WebcComp Transpiler`.yellow);

(async () => {
  const compFolder = `../Source/components`;

  const transpileAll = () => {
    // get a list of all the files, recursively
    const compFiles = Files.getFiles(compFolder, { recursive: true });

    compFiles.forEach(transpileWebComponent);
  };

  transpileAll();

  // watch the template for changes
  fs.watch(
    path.join(__dirname, `../../../Shared/WebComp/Templates`),
    { recursive: true },
    transpileAll
  );

  // watch the folder for changes
  fs.watch(compFolder, { recursive: true }, (eventType, filename) => {
    transpileWebComponent(path.join(compFolder, filename || ""));
  });

  // pause the process so it doesn't exit
  await new Promise((resolve) => {});
})();
