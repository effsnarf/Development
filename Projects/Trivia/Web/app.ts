import path from "path";
import fs from "fs";
import "colors";
import "../../../Shared/Extensions";
import { Files } from "../../../Shared/Files";
import { WebComp } from "../../../Shared/WebComp/WebComp";

let transpileWebComponent = (filePath: string) => {
  try {
    WebComp.to.react.jsx(filePath, path.join(__dirname, `./my-app/src`));
  } catch (ex: any) {
    console.log(ex.message.bgRed.white);
  }
};

transpileWebComponent = transpileWebComponent.debounce(100);

(async () => {
  const compFolder = `../Source/components`;

  // get a list of all the files, recursively
  const compFiles = Files.getFiles(compFolder, { recursive: true });

  for (const file of compFiles) {
    transpileWebComponent(file);
  }

  // watch the folder for changes
  fs.watch(compFolder, { recursive: true }, (eventType, filename) => {
    transpileWebComponent(path.join(compFolder, filename || ""));
  });

  // pause the process so it doesn't exit
  await new Promise((resolve) => {});
})();
