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
  static _environment: string | undefined;
  static environments = ["dev", "prod"];
  options: ConfigurationOptions;
  data: any;
  yaml!: string;

  constructor(
    options: ConfigurationOptions,
    public readonly configPaths: string[]
  ) {
    if (!options) options = {};
    if (!("log" in options)) options.log = true;
    this.options = options;
  }

  static async new(
    options: ConfigurationOptions = {
      quitIfChanged: [],
      toAbsolutePaths: [],
      types: Types,
    },
    configPaths?: ConfigPaths
  ) {
    configPaths = Configuration.getConfigPaths(configPaths);
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
        return { ...cp, data: jsyaml.load(cp.yaml) as any };
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
        if (value[env]) {
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
        const typeNames = Object.keys(options.types.Convert);
        for (const typeName of typeNames) {
          if (key.toLowerCase() === typeName.toLowerCase()) {
            console.log(`Converting ${key} to ${typeName}`.gray);
            console.log(value);
            node[key] = options.types.Convert[typeName].from.any(value);
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
          config.log(`${file.yellow} ${`changed, restarting...`.gray}`);
          process.exit();
        });
      });

    const periodically = config.data.process?.restart?.periodically;
    if (periodically) {
      // Restart periodically ({ from: 00:00, every: 1h })
      const from = moment.duration(periodically.from).asMilliseconds();
      const every = periodically.every.deunitifyTime();
      const startOfDay = new Date().setHours(0, 0, 0, 0).valueOf();
      const times = (24).hours() / every;
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

      config.log();
      config.log(
        `${`Restarting every`.gray} ${every.unitifyTime()} ${
          `from`.gray
        } ${new Date(startOfDay + from).toLocaleTimeString()}`
      );
      config.log(
        `${`Next restart:`.gray} ${new Date(nextPoint).toLocaleTimeString()}`
      );
      const check = () => {
        const now = new Date(new Date().setMilliseconds(0));
        if (now.valueOf() == nextPoint) {
          config.log(`${`Restarting at ${now}`.gray}`);
          process.exit();
        }
      };
      setInterval(check, (0.5).seconds());
    }

    config.log();
    //await (5).seconds().wait({ log: true });

    config.yaml = Configuration.toYaml(config.data);

    const desc = await Configuration.getConfigDescription(config.data);

    config.log(desc);

    return config;
  }

  private static async getConfigDescription(data: any) {
    return Configuration.toYaml(data).gray;
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

  private static getConfigPaths(configPaths?: ConfigPaths) {
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
    const context = { process, path, config: configData } as any;
    context.getLogPath = (title: string) =>
      Configuration.getLogPath(configData, title);
    return context;
  }

  static getLogPath(configData: any, title: string) {
    const parts = [];
    parts.push(process.argv[1].findParentDir("Development"));
    parts.push("Logs");
    const now = new Date();
    // Add yyyy\mm\dd to the log path
    parts.push(...now.toISOString().split("T")[0].split("-").slice(0, 3));
    // Add hh-mm to the log path
    parts.push(
      now.toISOString().split("T")[1].split(":").slice(0, 2).join("-")
    );
    // Add title to the log path
    if (!title.endsWith(".log")) title += ".log";
    parts.push(title);
    return path.join(...parts);
  }

  private log(...args: any[]) {
    if (!this.options.log) return;
    console.log(...args);
  }
}

export { Configuration };
