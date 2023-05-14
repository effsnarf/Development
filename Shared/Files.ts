import fs from "fs";
import path from "path";
import "../Shared/Extensions";
import { Progress } from "../Shared/Progress";

interface PathFilter1 {
  include: string[];
}

interface PathFilter2 {
  exclude: string[];
}

type PathFilter3 = (path: string) => boolean;

type PathFilter = any;

const pathFilterToFunction = (filter: PathFilter) => {
  // (path) => true/false
  if (typeof filter == "function") return filter;

  if (filter.include) {
    return (path: string) => {
      const nodes = path.replace(/\//g, "\\").split("\\");
      const leaf = nodes.last();
      return filter.include.includes(leaf);
    };
  }

  if (filter.exclude) {
    return (path: string) => {
      const nodes = path.replace(/\//g, "\\").split("\\");
      const leaf = nodes.last();
      const result = !filter.exclude.includes(leaf);
      return result;
    };
  }

  throw new Error("Unrecognized path filter");
};

class Files {
  static *listFiles(
    folder: string,
    options?: { recursive?: boolean }
  ): Generator<string> {
    const { recursive = true } = options || {};

    function* traverseDirectory(currentPath: string): Generator<string> {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        if (entry.isFile()) {
          yield fullPath;
        } else if (entry.isDirectory() && recursive) {
          yield* traverseDirectory(fullPath);
        }
      }
    }

    yield* traverseDirectory(folder);
  }

  static watch(
    paths: string[],
    options: { recursive: boolean; exclude: string[] } = {
      recursive: false,
      exclude: [],
    },
    callback: (paths: string[]) => void,
    onLog?: (message: string) => void
  ) {
    if (!paths.length) throw new Error("No paths provided");

    const { recursive, exclude } = options;

    let timeout: number = 0;
    let changedPaths: string[] = [];

    for (const watchPath of paths) {
      const watcher = fs.watch(watchPath, { recursive });

      watcher.on("change", (event, filename) => {
        if (typeof filename != "string") return;
        if (filename.split("\\").some((part) => exclude.includes(part))) return;
        clearTimeout(timeout);
        const filePath = path.resolve(watchPath, filename);
        if (!changedPaths.includes(filePath)) changedPaths.push(filePath);
        setTimeout(() => {
          if (changedPaths.length) {
            if (onLog) {
              onLog(`Change detected in ${watchPath.toShortPath()}`);
              onLog(`  ${changedPaths.length.pluralize("files")} changed`);
              for (const changedPath of changedPaths) {
                onLog(`    ${changedPath.toShortPath()}`);
              }
            }
            callback(changedPaths);
          }
          changedPaths = [];
        }, 400);
      });

      if (onLog) {
        onLog(`Watching ${watchPath.toShortPath()}`);
        if (exclude.length) {
          onLog(`Excluding ${exclude.map((s) => s.yellow).join(", ")}`);
        }
      }
    }
  }

  static async syncFolders(
    master: string,
    clone: string,
    filter: PathFilter,
    recursive: boolean = true,
    onProgress: (progress: Progress, message?: string) => void = () => {},
    progress?: Progress
  ) {
    return new Promise(async (resolve) => {
      const isRoot = !progress;

      // Count the number of files/folders in the master directory (recursively)
      if (!progress) {
        const pathsCount = await Files.CountPaths(master, filter, recursive);

        // onProgress(
        //   progress!,
        //   `${pathsCount.toLocaleString()} ${`items in `.gray} ${
        //     master.toShortPath().yellow
        //   }`
        // );

        progress = Progress.new(
          pathsCount,
          { skipped: 0, modifieds: [] },
          (percent) => onProgress(progress!, percent.toString())
        );
      }

      // Create the clone directory if it does not exist
      if (!fs.existsSync(clone)) {
        fs.mkdirSync(clone);
      }

      // Get all the files in the master directory
      const files = fs.readdirSync(master);

      for (const file of files) {
        try {
          // Get the full path of the file
          const masterPath = path.join(master, file);

          // Skip files that do not pass the filter
          if (!pathFilterToFunction(filter)(masterPath)) {
            progress.data.skipped++;
            continue;
          }

          // Increment the progress
          progress.increment();

          // Get the full path of the clone file
          const clonePath = path.join(clone, file);

          // If the master file is a directory
          if (fs.statSync(masterPath).isDirectory()) {
            // If the recursive flag is not set, skip this directory
            if (!recursive) continue;

            // Create the clone directory if it does not exist
            if (!fs.existsSync(clonePath)) {
              fs.mkdirSync(clonePath);
              progress.data.modifieds.push(clonePath);
              onProgress(progress, `  ${`Created`.cyan} ${clonePath.yellow}`);
            }

            await Files.syncFolders(
              masterPath,
              clonePath,
              filter,
              recursive,
              onProgress,
              progress
            );
            continue;
          }

          // Copy the file if the clone does not exist
          if (!fs.existsSync(clonePath)) {
            fs.copyFileSync(masterPath, clonePath);
            progress.data.modifieds.push(clonePath);
            onProgress(
              progress,
              `  ${`Created`.cyan} ${
                clonePath.toShortPath(masterPath).yellow
              } <- ${masterPath.toShortPath(clonePath).green}`
            );
            continue;
          }

          // Copy the file if the master and clone files are not equal
          if (!Files.areFilesEqual(masterPath, clonePath)) {
            fs.copyFileSync(masterPath, clonePath);
            progress.data.modifieds.push(clonePath);
            onProgress(
              progress,
              `  ${`Copied`.cyan} ${
                clonePath.toShortPath(masterPath).yellow
              } <- ${masterPath.toShortPath(clonePath).green}`
            );
            continue;
          }
        } finally {
          if (progress.isTimeForAnotherReport()) onProgress(progress);
        }
      }

      if (isRoot) {
        progress.done();
        onProgress(progress);
      }

      resolve(null);
    });
  }

  // Count the number of files/folders in a directory (recursively)
  static async CountPaths(
    directory: string,
    filter: PathFilter,
    recursive: boolean = true,
    onCount: (count: number) => void = () => {}
  ): Promise<number> {
    return new Promise(async (resolve, reject) => {
      let count = 0;

      const files = fs.readdirSync(directory);

      for (const file of files) {
        const path = `${directory}/${file}`;

        if (!pathFilterToFunction(filter)(path)) continue;

        onCount(++count);

        if (fs.statSync(path).isDirectory()) {
          if (recursive) {
            count += await Files.CountPaths(path, filter, recursive);
            onCount(count);
          }
        }
      }

      resolve(count);
    });
  }

  // If their size is different, they are not equal
  // If their size is the same, compare their contents
  static areFilesEqual(path1: string, path2: string): boolean {
    const stats1 = fs.statSync(path1);
    const stats2 = fs.statSync(path2);

    if (stats1.size !== stats2.size) {
      return false;
    }

    const buffer1 = fs.readFileSync(path1);
    const buffer2 = fs.readFileSync(path2);

    if (buffer1.equals(buffer2)) {
      return true;
    } else {
      return false;
    }
  }
}

export { Files };
