import "./Extensions";
import fs from "fs";
import { Timer } from "./Timer";
import { Queue } from "./Queue";
import { Reflection } from "./Reflection";
import jsyaml from "js-yaml";

abstract class Logger {
  abstract log(...args: any[]): void | Promise<void>;

  static new(config: any): LoggerBase {
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
      return FileSystemLogger.new(config.path);
    }

    throw new Error(`Unknown logger type:\n${jsyaml.dump(config)}`);
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
          returnValue = jsyaml.dump(returnValue).shorten(200);
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
    let text = items
      .map((item) => {
        if (!item.args.filter((a: any) => a).length) return null;
        const text = item.args.map((arg: any) => {
          if (arg.is(String)) return arg.withoutColors();
          return jsyaml.dump(arg);
        });
        return `${new Date(item.dt).toISOString()} ${text}`;
      })
      .filter((a) => a)
      .join("\n");

    text = text.withoutColors();

    if (text.trim().length) fs.appendFileSync(this.path, text + "\n");
  }
}

export { Logger };
