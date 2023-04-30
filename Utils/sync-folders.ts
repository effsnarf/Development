import fs from "fs";
import path from "path";
import "colors";
import { Configuration } from "@shared/Configuration";
import { Progress } from "@shared/Progress";
import { Files } from "@shared/Files";
import { Console } from "@shared/Console";

console.log();

if (process.argv.length < 4) {
  console.log(
    `${`Usage:`.gray} sync-folders ${`<master>`.green} ${`<clone>`.yellow}`
  );
  `}`;
  process.exit(1);
}

const splitPath = (path: string) => {
  path = path.replace(/\//g, "\\");
  return {
    path: path,
    folder: path.substring(0, path.lastIndexOf("\\")),
    node: path.substring(path.lastIndexOf("\\") + 1),
  };
};

const printReport = (
  progress: Progress,
  message?: string,
  maxLines: number = Number.MAX_VALUE
) => {
  const maxModifiedLines = maxLines - 5;
  console.clear();
  console.log(`Synching`.gray);
  console.log(`  ${master.node.green} ${`<-`.gray} ${clone.node.yellow}`);
  console.log(master.path.gray);
  console.log(clone.path.gray);
  console.log();
  console.log(message || "");
  console.log(progress?.bar || "");
  console.log();
  if (progress?.data)
    console.log(
      `${progress.data.modifieds.length.toLocaleString()} ${
        `modified`.gray
      } \t ${progress.data.skipped.toLocaleString()} ${`skipped`.gray}`
    );
  console.log();
  for (const modified of [...(progress?.data.modifieds || [])]
    .reverse()
    .slice(0, maxModifiedLines))
    console.log(modified.green);
  console.log();
};
// Get the paths, considering the current working directory
const master = splitPath(path.join(process.cwd(), process.argv[2]));
const clone = splitPath(path.join(process.cwd(), process.argv[3]));

(async () => {
  await Files.SyncFolders(
    master.path,
    clone.path,
    { exclude: ["node_modules"] },
    true,
    (progress, message) => {
      printReport(progress, message, 30);
    }
  );
})();
