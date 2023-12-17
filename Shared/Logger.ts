import "./Extensions";
import fs from "fs";
import path from "path";
import { Console } from "./Console";
import { Objects } from "./Extensions.Objects";
import { Timer } from "./Timer";
import { Queue } from "./Queue";
import { Reflection } from "./Reflection";
import jsyaml from "js-yaml";

abstract class Logger {
  static new(config: any): LoggerBase {
    const getNewLogger = () => {
      if (!config) {
        return EmptyLogger.new();
      }

      if ("enabled" in config && !config.enabled) {
        return EmptyLogger.new();
      }

      if (typeof config === "function") {
        return FunctionLogger.new(config);
      }

      if (Array.isArray(config)) {
        return MultiLogger.new(config.map((c: any) => Logger.new(c)));
      }

      if (config.path) {
        return FileSystemLogger.new(config.path, config.overwrite);
      }

      throw new Error(`Unknown logger type:\n${jsyaml.dump(config)}`);
    };

    const logger = getNewLogger();
    logger.log("Logger started");
    return logger;
  }

  static console(lines?: number) {
    return ConsoleLogger.new(lines);
  }
}

abstract class LoggerBase implements Logger {
  private readonly queue: Queue;

  constructor() {
    this.queue = Queue.new(
      async (items: any[]) => await this._log.apply(this, [items]),
      1000
    );

    process.on("exit", async () => {
      await this.flush();
    });
  }

  async log(...args: any[]) {
    if (!args?.length) return;
    const item = {
      dt: Date.now(),
      args: args,
    };
    this.queue.add(item);
  }

  async flush() {
    await this.queue.flush();
  }

  hookTo(object: any) {
    Reflection.bindClassMethods(
      object,
      (className, methodName, args) => {
        const timer = Timer.start();
        this.log(className, methodName, args);
        return timer;
      },
      (beforeResult, className, methodName, args, returnValue) => {
        const timer = beforeResult as Timer;
        try {
          returnValue = jsyaml.dump(returnValue);
        } catch (ex: any) {
          returnValue = `[${typeof returnValue}]`;
        }
        this.log(
          timer.elapsed?.unitifyTime().withoutColors(),
          className,
          methodName,
          args,
          returnValue
        );
      }
    );
  }

  protected abstract _log(items: any[]): Promise<void>;
}

class EmptyLogger extends LoggerBase {
  private constructor() {
    super();
  }

  static new() {
    return new EmptyLogger();
  }

  protected async _log(items: any[]): Promise<void> {}
}

interface LogLine {
  args: any[];
}
class ConsoleLogger extends LoggerBase {
  private hasWritten = false;
  private logLines: LogLine[] = [];

  private constructor(public lines: number = 10) {
    super();
  }

  static new(lines?: number) {
    return new ConsoleLogger(lines);
  }

  protected async _log(items: any[]): Promise<void> {
    for (const item of items) {
      this._logArgs(item.args);
    }
  }

  private _logArgs(args: any[]) {
    if (this.hasWritten) Console.moveCursorUp(this.logLines.length);
    while (this.logLines.length > this.lines) this.logLines.shift();
    this.logLines.push({
      args: args,
    });
    for (const line of this.logLines) {
      Console.clearLine();
      console.log(...line.args);
    }
    this.hasWritten = true;
  }
}

class FunctionLogger extends LoggerBase {
  private constructor(private readonly func: Function) {
    super();
  }

  static new(func: Function) {
    return new FunctionLogger(func);
  }

  protected async _log(items: any[]): Promise<void> {
    await this.func(items);
  }
}

class MultiLogger extends LoggerBase {
  private constructor(private readonly loggers: LoggerBase[]) {
    super();
  }

  static new(loggers: LoggerBase[]) {
    return new MultiLogger(loggers);
  }

  protected async _log(items: any[]): Promise<void> {
    await Promise.all(
      this.loggers.flatMap((logger) =>
        items.flatMap((item) => item.args.map((arg: any) => logger.log(arg)))
      )
    );
  }
}

class FileSystemLogger extends LoggerBase {
  private readonly logPath: string;

  private constructor(logPath: string, private overwrite?: boolean) {
    super();
    if (!logPath.isEqualPath(logPath.sanitizePath())) {
      logPath = logPath.sanitizePath();
      console.warn(`Sanitizing path: ${logPath.yellow}`);
    }
    const folderPath = path.dirname(logPath);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    this.logPath = logPath;
  }

  static new(path: string, overwrite?: boolean) {
    return new FileSystemLogger(path, overwrite);
  }

  protected async _log(items: any[]): Promise<void> {
    const folder = path.dirname(this.logPath);
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    let text = items
      .map((item) => {
        if (!item.args.filter((a: any) => a).length) return null;
        const text = item.args.map((arg: any) =>
          typeof arg == "string" ? arg : Objects.jsonify(arg).withoutColors()
        );
        return `${new Date(item.dt).toISOString()} ${text}`;
      })
      .filter((a) => a)
      .join("\n");

    text = text.withoutColors();

    if (text.trim().length)
      if (this.overwrite) {
        fs.writeFileSync(this.logPath, text);
      } else {
        fs.writeFileSync(this.logPath, text + "\n", { flag: "a" });
      }
  }
}

export { Logger, LoggerBase };
