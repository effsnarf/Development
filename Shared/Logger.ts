import fs from "fs";
import { Queue } from "./Queue";

abstract class Logger {
  abstract log(...args: any[]): void | Promise<void>;

  static new(config: any): LoggerBase {
    if (!config) {
      return EmptyLogger.new();
    }

    if ("enabled" in config && !config.enabled) {
      return EmptyLogger.new();
    }

    if (Array.isArray(config)) {
      return MultiLogger.new(config.map((c: any) => Logger.new(c)));
    }

    if (config.path) {
      return FileSystemLogger.new(config.path);
    }

    throw new Error(`Unknown logger type: ${config.type}`);
  }
}

abstract class LoggerBase implements Logger {
  private readonly queue: Queue;

  constructor() {
    this.queue = Queue.new(
      async (items: any[]) => await this._log.apply(this, [items]),
      1000
    );
  }

  async log(...args: any[]) {
    const item = {
      dt: Date.now(),
      args: args,
    };
    this.queue.add(item);
  }

  async flush() {
    await this.queue.flush();
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

class MultiLogger extends LoggerBase {
  private constructor(private readonly loggers: Logger[]) {
    super();
  }

  static new(loggers: Logger[]) {
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
  private constructor(private readonly path: string) {
    super();
  }

  static new(path: string) {
    return new FileSystemLogger(path);
  }

  protected async _log(items: any[]): Promise<void> {
    let text =
      items
        .map((item) => {
          const text = JSON.stringify(item.args, (key, value) => {
            if (typeof value == "string") {
              return value.withoutColors();
            }
            return value;
          });
          return `${new Date(item.dt).toISOString()} ${text}`;
        })
        .join("\n") + "\n";

    text = text.withoutColors();

    fs.appendFileSync(this.path, text);
  }
}

export { Logger };
