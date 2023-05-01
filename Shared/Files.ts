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
  static async SyncFolders(
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

        onProgress(
          progress!,
          `${pathsCount.toLocaleString()} ${`items in `.gray} ${
            master.toShortPath().yellow
          }`
        );

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
          progress.addOne();

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
              onProgress(
                progress,
                `${`Created`.cyan} ${clonePath.toShortPath()}`
              );
            }

            await Files.SyncFolders(
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
            onProgress(progress, `${`Copied`.cyan} ${clonePath.toShortPath()}`);
            continue;
          }

          // Copy the file if the master and clone files are not equal
          if (!Files.AreFilesEqual(masterPath, clonePath)) {
            fs.copyFileSync(masterPath, clonePath);
            progress.data.modifieds.push(clonePath);
            onProgress(
              progress,
              `${`Modified`.cyan} ${clonePath.toShortPath()}`
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
  static AreFilesEqual(path1: string, path2: string): boolean {
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
