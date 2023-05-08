const treeKill = require("tree-kill");
const path = require("path");
import { exec } from "child_process";
import { Events } from "./Events";
import { Types } from "./Types";

interface ProcessInfo {
  pid: number;
  creationDate: Date;
  commandLine: string;
}

class Process {
  private uniqueID;
  started: number = 0;
  process: any;

  private constructor(
    private title: string,
    private path: string,
    private events?: Events
  ) {
    this.uniqueID = `uniqueID(${this.title})`;
  }

  static async start(title: string, path: string, events?: Events) {
    const proc = Process.new(title, path, events);
    const existingProcess = await Process.findProcess(path);
    if (existingProcess) {
      proc.started = existingProcess.creationDate.valueOf();
      // Extract the uniqueID from the command line
      const uniqueID = existingProcess.commandLine
        .split(" ")
        .find((s: string) => s.startsWith("uniqueID("));
      if (!uniqueID) throw new Error("Failed to find uniqueID");
      proc.uniqueID = uniqueID;
      const timespan = (Date.now() - proc.started) / 1000;
      proc.log(
        `${title.green} is already running (pid ${
          existingProcess.pid
        }) (${timespan.stringify(`m`)}min)`
      );
    } else {
      proc.restart();
    }
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
      const processInfo = await this.getProcessInfo();
      if (!processInfo) return;
      this.log(`Stopping ${this.title.green} (pid ${processInfo.pid})..`);
      try {
        await this.killProcessTree(processInfo.pid);
        this.process = null;
      } catch (ex: any) {
        this.log(
          `${
            `Failed to kill (pid ${processInfo.pid}) ${
              ` ${this.title} `.bgWhite.black
            }`.bgRed
          }`
        );
        this.log(ex.toString().bgRed);
        return;
      }
    }
  }

  async isRunning() {
    return await this.getProcessInfo();
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

  private async getProcessInfo(): Promise<ProcessInfo | null> {
    return await Process.findProcess(this.uniqueID);
  }

  static async findProcess(commandLine: string): Promise<ProcessInfo | null> {
    const cmd = `wmic process where "CommandLine like '%${commandLine}%' and Name='cmd.exe'" get ProcessId,CreationDate,CommandLine /format:csv`;
    const output = await Process.execute(cmd);
    const lines = output
      .split("\r\n")
      .filter((line: string) => line.trim()?.length)
      .filter((line: string) => !line.includes("wmic process"));
    const columns = lines[lines.length - 1].split(/,(?=\S)/);
    const pid = parseInt(columns[columns.length - 1]);
    if (!pid) return null;
    return {
      pid,
      creationDate: Types.Convert.date.from.wmic(columns[columns.length - 2]),
      commandLine: columns[columns.length - 3],
    } as ProcessInfo;
  }

  static async execute(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = exec(command, (error: any, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
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
