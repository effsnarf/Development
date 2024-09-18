import "colors";
import { Console } from "../../Shared/Console";
import { Progress } from "../../Shared/Progress";
import { Files } from "../../Shared/Files";

const argv = process.argv;

if (argv.length < 4) throw `Usage: FolderSync [input folder] [output folder]`;

const folders = {
  input: argv[2],
  output: argv[3],
};

console.log(
  `Synching`.green,
  folders.input.yellow,
  ` -> `.gray,
  folders.output.yellow
);
console.log("\n");

const filter = {
  exclude: ["node_modules"],
};

const window = Console.getWindowSize();
let prog!: Progress;

const onProgress = (progress: Progress, message?: string) => {
  Console.moveCursorUp(2);
  prog = progress;
  console.log(progress.bar);
  console.log((message || "").shorten(window.width));
};

(async () => {
  await Files.syncFolders(
    folders.input,
    folders.output,
    filter,
    true,
    onProgress
  );

  const summary = prog.data;
  console.log(
    `${summary.skipped.length} skipped \t ${summary.modified.length} modified \t ${summary.deleted.length} deleted`
      .gray
  );
})();
