import fs from "fs";
import path from "path";
import "colors";
import { Objects } from "@shared/Extensions.Objects";
import { Files } from "@shared/Files";
import { WebScript } from "@shared/WebScript/WebScript";

(async () => {
  if (process.argv.length < 4) {
    console.log(`Usage: start.cmd <sourceFolder> <outputFolder>`);
    return;
  }

  const sourceFolder = path.resolve(process.argv[2]);
  const outputFolder = path.resolve(process.argv[3]);

  const loadSource = (path: string) => {
    let yaml = fs.readFileSync(path, "utf8");
    yaml = yaml.replace(/\@/g, "on_");
    const source = Objects.parseYaml(yaml);
    return source;
  };

  const inputFilePaths = Files.getFiles(sourceFolder, { recursive: true });

  const inputs = inputFilePaths
    .filter((s) => s.endsWith(".ws.yaml"))
    .map((s) => {
      return {
        path: s,
        name: WebScript.pathToComponentName(sourceFolder, s),
        source: loadSource(s),
      };
    });

  await WebScript.transpile(inputs);
})();
