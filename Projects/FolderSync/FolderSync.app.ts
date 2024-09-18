import "../../Shared/Extensions";
import "colors";
import { Console } from "../../Shared/Console";
import { Progress } from "../../Shared/Progress";
import { Files } from "../../Shared/Files";

const argv = process.argv;

if (argv.length < 4) {
  console.log(argv);
  throw `Usage: FolderSync [input folder] [output folder]`;
}

const folders = {
  input: argv[2],
  output: argv[3],
};

const filter = (path: string) => {
  if (path.includes("node_modules")) return false;
  // Google Drive sync
  if (path.includes(".tmp.")) return false;
  return true;
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
  while (true) {
    console.clear();
    console.log(
      `Synching`.green,
      folders.input.yellow,
      ` -> `.gray,
      folders.output.yellow
    );
    console.log("\n");

    await Files.syncFolders(
      folders.input,
      folders.output,
      filter,
      true,
      onProgress
    );

    Console.moveCursorUp();
    Console.clearLine();

    const summary = prog.data;
    console.log(
      `${summary.skipped.length} skipped \t ${summary.modified.length} modified \t ${summary.deleted.length} deleted`
        .gray
    );

    console.log();

    await (10).minutes().wait({ log: true });
  }
})();
