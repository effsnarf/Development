import path from "path";
import os from "os";
import * as colors from "colors";
import * as fs from "fs";
import * as jsyaml from "js-yaml";
import * as moment from "moment";
import "./Extensions";
import { Objects } from "./Extensions.Objects";
import { Types } from "./Types";
import { ChatOpenAI, Roles } from "../Apis/OpenAI/classes/ChatOpenAI";
import { Cache } from "./Cache";

// #TODO: Move to Extensions
const traverse = function (
  obj: any,
  onValue: (node: any, key: string, value: any) => void
) {
  const traverse = function (node: any, key: string, value: any) {
    onValue(node, key, value);
    if (value && typeof value === "object") {
      for (const k of Object.keys(value)) {
        traverse(value, k, value[k]);
      }
    }
  };
  traverse(obj, "", obj);
};

type ConfigPaths = string | string[];

interface ConfigurationOptions {
  quitIfChanged?: string[];
  toAbsolutePaths?: string[];
  types?: any;
  log?: boolean;
}

class Configuration {
  static log: boolean = true;
  static _environment: string | undefined;
  static environments = ["dev", "prod"];
  options: ConfigurationOptions;
  data: any;
  yaml!: string;
  nextRestartTime: Date | null = null;

  constructor(
    options: ConfigurationOptions,
    public readonly configPaths: string[]
  ) {
    if (!options) options = {};
    if (!("log" in options)) options.log = true;
    this.options = options;
  }

  static async new(
    options?: ConfigurationOptions | undefined,
    configPaths?: ConfigPaths,
    findConfigPaths: boolean = true
  ) {
    if (!options)
      options = {
        quitIfChanged: [],
        toAbsolutePaths: [],
        types: Types,
        log: false,
      };
    configPaths = Configuration.getConfigPaths(configPaths, findConfigPaths);
    const config = new Configuration(options, configPaths);
    config.log(`${configPaths.length} config file(s) found:`.gray);
    configPaths.forEach((p) =>
      config.log(`  ${p.toShortPath()} ${`(${p})`.gray}`)
    );
    config.log();
    // Load all config files into a single object
    config.data = configPaths
      .map((file) => {
        // Read the YAML content
        return { file, yaml: fs.readFileSync(file, "utf8") };
      })
      .map((cp) => {
        // Parse the YAML content
        return { ...cp, data: (jsyaml.load(cp.yaml) as any) || {} };
      })
      .map((cp) =>
        // Replace all relative paths with absolute paths
        Object.assign(
          cp.data,
          Configuration.setAbsolutePaths(cp.file, cp.data, options)
        )
      )
      // Merge all config files into a single object
      .reduce((acc, cur) => Objects.deepMerge(cur, acc), {});

    // Process the config object tree
    traverse(config.data, (node: any, key: string, value: any) => {
      const env = Configuration.getEnvironment(options);
      if (typeof value === "object" && value !== null) {
        // Replace [dev] or [prod] with the current environment
        if (env in value) {
          node[key] = value[env];
        }
        // Remove other environment keys
        for (const otherEnv of Configuration.environments.except(env)) {
          delete value[otherEnv];
        }
        // Remove empty objects
        if (Object.keys(value).length == 0) {
          node[key] = null;
        }
      }
    });

    // Convert any types
    if (options?.types) {
      traverse(config.data, (node: any, key: string, value: any) => {
        // Types could be:
        // { Address: {}, }
        // If any key matches a type name, convert the object to that type
        const typeNames = Object.keys(options?.types.Convert);
        for (const typeName of typeNames) {
          if (key.toLowerCase() === typeName.toLowerCase()) {
            console.log(`Converting ${key} to ${typeName}`.gray);
            console.log(value);
            node[key] = options?.types.Convert[typeName].from.any(value);
            console.log(node[key]);
          }
        }
      });
    }

    // Evaluate any functions
    traverse(config.data, (node: any, key: string, value: any) => {
      if (typeof value === "string") {
        if (value.startsWith("(env) => ")) {
          let func = null;
          try {
            func = eval(`(${value})`);
          } catch (ex) {
            console.log(`Error evaluating function:\n${value}`);
            throw ex;
          }
          const context = Configuration.getConfigContext(config.data);
          node[key] = func.apply(null, [context]);
        }
      }
    });

    // If the source file or configuration file changes, exit the process (and restart from the cmd file)
    [
      ...configPaths,
      ...(options.quitIfChanged ?? []),
      ...[require.main?.filename.replace(".temp.ts", "")]
        .filter((s) => s)
        .map((s) => path.resolve(s as string)),
    ]
      .distinct()
      .forEach((file) => {
        config.log(`${`Watching`.gray} ${file.toShortPath()}`);
        fs.watchFile(file, () => {
          const delay = (
            config.data.process?.restart?.delay || "0s"
          ).deunitify();
          config.log(
            `${file.toShortPath()} ${
              `changed, restarting in ${delay.unitifyTime()}...`.gray
            }`
          );
          setTimeout(() => {
            process.exit();
          }, delay);
        });
      });

    config.log();
    //await (5).seconds().wait({ log: true });

    config.yaml = Configuration.toYaml(config.data);

    const desc = await Configuration.getConfigDescription(config.data);

    config.log(desc);

    config.init();

    return config;
  }

  private init() {
    if (this.data.title) process.title = this.data.title;

    this.nextRestartTime = this.getNextRestartTime();
    if (this.nextRestartTime) {
      setTimeout(() => {
        this.log(`Restarting.. (restart time ${this.nextRestartTime})`.bgRed);
        process.exit();
      }, this.nextRestartTime.valueOf() - Date.now());
    }
  }

  private getNextRestartTime() {
    const periodically = this.data.process?.restart?.periodically;
    if (!periodically) return null;
    // Restart periodically ({ from: 00:00, every: 1h })
    const from = moment.duration(periodically.from).asMilliseconds();
    const every = periodically.every.deunitify();
    const startOfDay = new Date().setHours(0, 0, 0, 0).valueOf();
    const times = (24).hours() / every + 1;
    const points = [];
    for (
      let at = startOfDay + from;
      at < startOfDay + from + times * every;
      at += every
    ) {
      points.push(at);
    }

    const nextPoint = points
      .filter((p) => p > Date.now())
      .sortBy((p) => p)
      .first();

    this.log();
    this.log(
      `${`Restarting every`} ${every.unitifyTime()} ${`from`} ${new Date(
        startOfDay + from
      ).toLocaleTimeString()}`
    );
    this.log(`${`Next restart:`} ${new Date(nextPoint).toLocaleTimeString()}`);
    return new Date(nextPoint);
  }

  private static async getConfigDescription(data: any) {
    const yaml = Configuration.toYaml(data);
    // Console colors don't work for some reason in Nuxt
    if (process.env.NODE_ENV) return yaml;
    return yaml.gray;
  }

  static setAbsolutePaths(
    configPath: string,
    data: any,
    options: ConfigurationOptions = {}
  ) {
    if (options.toAbsolutePaths?.length) {
      // Convert all relative paths to absolute paths
      traverse(data, (node: any, key: string, value: any) => {
        if (typeof value === "string") {
          if (options.toAbsolutePaths?.includes(key)) {
            node[key] = path.resolve(path.dirname(configPath), value);
          }
        }
      });
    }
  }

  static toYaml(config: any) {
    // Replace any functions with their string representation
    // (so that they can be saved to YAML)
    // Clone the config object
    config = Objects.clone(config);
    // Convert any functions to strings
    traverse(config, (node: any, key: string, value: any) => {
      if (typeof value === "function") {
        node[key] = value.toString();
      }
    });
    // Convert the config object to YAML
    return jsyaml.dump(config);
  }

  private static getConfigPaths(
    configPaths?: ConfigPaths,
    findConfigPaths: boolean = true
  ) {
    if (!findConfigPaths) {
      if (typeof configPaths === "string")
        return [configPaths.toAbsolutePath(path)];
      if (Array.isArray(configPaths))
        return configPaths.map((p) => p.toAbsolutePath(path));
      return [];
    }
    const isConfigPath = (filePath: string) => {
      if (filePath.endsWith(".config.yaml")) return true;
      if (path.basename(filePath) === "config.yaml") return true;
      return false;
    };
    // If process.argv[] contains config paths, use them
    const argConfigPaths = process.argv.filter(isConfigPath);
    if (argConfigPaths.length)
      return argConfigPaths.map((p) => p.toAbsolutePath(path));
    // In case of string, return it
    if (typeof configPaths === "string")
      return [configPaths.toAbsolutePath(path)];
    // In case of string[], find the files that exists
    if (Array.isArray(configPaths)) {
      return configPaths
        .filter((p) => fs.existsSync(p.toAbsolutePath(path)))
        .map((p) => p.toAbsolutePath(path));
    }
    // If no config file specified in [process.argv] or [configPaths],
    // try to find a config file in the current directory
    // (anything that ends with ".config.yaml" or "config.yaml")
    const existingFiles = fs
      .readdirSync(process.cwd())
      .filter(isConfigPath)
      .map((p) => p.toAbsolutePath(path));

    if (existingFiles.length) return existingFiles;

    // If no config file found, throw an error
    throw new Error(`Config file(s) not found: ${configPaths}`);
  }

  // static "environment" getter
  static getEnvironment(options?: ConfigurationOptions) {
    if (Configuration._environment) return Configuration._environment;
    let env = (process.env.NODE_ENV || "dev") as string | undefined;
    // If env starts with ["dev", "prod"], replace it with the first match
    env = Configuration.environments.find((e) => env?.startsWith(e));
    Configuration._environment = env;
    if (options?.log) {
      console.log(`Environment is ${env?.yellow}`.gray);
      console.log();
    }
    if (env) return env;
    throw new Error(`Invalid environment: ${env}`);
  }

  static getConfigContext(configData: any) {
    const context = {
      Objects,
      os,
      process,
      path,
      config: configData,
    } as any;
    context.getLogPath = Configuration.getLogPath;
    return context;
  }

  //** @param (String) type - "debug", "error", etc */
  static getLogPath(title: string, type?: string) {
    const parts = [];
    parts.push(process.argv[1].findParentDir("Development"));
    parts.push("Logs");
    // Add the title to the log path
    if (type) parts.push(`${type.toTitleCase()}`);
    parts.push(`${title}`);
    const now = new Date();
    // Add yyyy\mm\dd to the log path
    parts.push(...now.toISOString().split("T")[0].split("-").slice(0, 3));
    // Add hh-mm to the log path
    const time = now
      .toISOString()
      .split("T")[1]
      .split(":")
      .slice(0, 2)
      .join("-");
    const hour = parseInt(time.split("-")[0]);
    const minute = parseInt(time.split("-")[1]);
    // We want to separate one day's logs into multiple folders and files
    // One folder per hour would result in 24 folders per day
    // We want to keep at most 5-6 folders per folder to ease navigation
    // So we'll divide the day into 6 parts of 4 hours each
    const folders = [];
    folders.push(Math.floor(hour / 4));
    // subdivide every 4 hour folder further into 1 hour folders
    folders.push(Math.floor(hour % 4));
    // subdivide every 1 hour folder further into 6 10-minute folders
    folders.push(Math.floor(minute / 10));
    // subdivide every 10-minute folder further into 5 2-minute folders
    folders.push(Math.floor((minute % 10) / 2));
    // and finally, subdivide every 2-minute folder further into 4 30-second log files
    folders.push(Math.floor((minute % 2) / 0.5) * 60);
    // Folderception
    const filename = `${folders.pop()}.log`;
    parts.push(...folders);
    // Create the log folder if it doesn't exist
    const folderPath = path.join(...parts.map((p) => p.toString()));
    fs.mkdirSync(folderPath, { recursive: true });
    const filePath = path.join(folderPath, filename);
    return filePath;
  }

  private log(...args: any[]) {
    if (!Configuration.log) return;
    if (!this.options.log) return;
    console.log(...args);
  }

  static isDevEnv()
  {
    const compName = os.hostname().toLowerCase();
    if (compName == "eff-pc") return true;
    if (compName == "efftop") return true;
    return false;
  }
}

export { Configuration };
