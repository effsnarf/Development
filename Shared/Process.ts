const treeKill = require("tree-kill");
const path = require("path");
import { spawn } from "child_process";
import { Events } from "./Events";

class Process {
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
    this.emit("log", { text: `Starting ${this.title.green}` });
    // Switch to the folder of the process
    process.chdir(path.dirname(this.path));
    // Start the process
    this.process = spawn(
      "cmd.exe",
      ["/c", "start", "cmd.exe", "/c", this.path],
      { detached: false }
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
      this.emit("log", { text: `Restarting ${this.title.green}..` });
      try {
        await this.killProcessTree(this.process.pid);
        this.process = null;
      } catch (ex: any) {
        this.emit("log", {
          text: `${
            `Failed to kill (pid ${this.process.pid}) ${
              ` ${this.title} `.bgWhite.black
            }`.bgRed
          }`,
        });
        this.emit("log", { text: ex.toString().bgRed });
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

  emit(event: string, data: any) {
    if (this.events) {
      this.events.emit(event, data);
    } else {
      const text = data.text || data.toString();
      console.log(text);
    }
  }
}

export { Process };
