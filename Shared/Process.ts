const treeKill = require("tree-kill");
const path = require("path");
import { exec } from "child_process";
import { Events } from "./Events";

class Process {
  private uniqueID = `uniqueID(${Math.random().toString(36).substring(2, 15)})`;
  started!: number;
  process: any;

  private constructor(
    private title: string,
    private path: string,
    private events?: Events
  ) {
    // process.on("exit", () => {
    //   if (!this.process) {
    //     this.emit("log", {
    //       text: `Exiting ${this.path}, killing process ${title.green}`,
    //     });
    //     this.process.kill();
    //   }
    // });
  }

  static start(title: string, path: string, events?: Events) {
    const proc = Process.new(title, path, events);
    proc.restart();
    return proc;
  }

  static new(title: string, path: string, events?: Events) {
    return new Process(title, path, events);
  }

  async restart() {
    await this.stop();
    this.start();
  }

  start() {
    this.started = Date.now();
    this.log(`Starting ${this.title.green}`);
    // Switch to the folder of the process
    process.chdir(path.dirname(this.path));
    // Start the process
    this.process = exec(
      `cmd.exe /c start cmd.exe /c ${this.path} ${this.uniqueID}`,
      //["/c", "start", "cmd.exe", "/c", this.path],
      //{ detached: false }
      (err, stdout, stderr) => {
        if (err) {
          console.error("Error:", err);
          return;
        }
        const lines = stdout.trim();
        this.log(lines);
      }
    );

    this.process.title = this.title;
    // Log the output
    this.process.stdout.on("data", (data: any) => this.emit("stdout", data));
    this.process.stderr.on("data", (data: any) => this.emit("stderr", data));
    // If the process exits
    this.process.on("exit", (code: any) => this.emit("exit", code));
  }

  async stop() {
    // If the process is running
    if (this.process) {
      const processID = await this.getProcessID();
      this.log(`Restarting ${this.title.green} (pid ${processID})..`);
      try {
        await this.killProcessTree(processID);
        this.process = null;
      } catch (ex: any) {
        this.log(
          `${
            `Failed to kill (pid ${processID}) ${
              ` ${this.title} `.bgWhite.black
            }`.bgRed
          }`
        );
        this.log(ex.toString().bgRed);
        return;
      }
    }
  }

  private killProcessTree(pid: number) {
    return new Promise((resolve, reject) => {
      treeKill(pid, "SIGKILL", (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(null);
        }
      });
    });
  }

  private async getProcessID(): Promise<number> {
    return new Promise((resolve, reject) => {
      const cmd = `wmic process where "CommandLine like '%${this.uniqueID}%' and Name='cmd.exe'" get ProcessId,CommandLine /format:csv`;
      const child = exec(cmd, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          const lines = stdout
            .split("\r\n")
            .filter((line) => line.trim()?.length)
            .filter((line) => !line.includes("wmic process"));
          const columns = lines[lines.length - 1].split(/,(?=\S)/);
          resolve(parseInt(columns[columns.length - 1]));
        }
      });
    });
  }

  private log(text: string) {
    this.emit("log", { text });
  }

  private emit(event: string, data: any) {
    if (this.events) {
      this.events.emit(event, data);
    } else {
      const text = data.text || data.toString();
      console.log(text);
    }
  }
}

export { Process };
