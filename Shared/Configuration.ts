import path from "path";
import * as colors from "colors";
import * as fs from "fs";
import * as jsyaml from "js-yaml";

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

type ConfigPath = string | string[];

interface ConfigurationOptions {
  quitIfChanged?: string[];
  toAbsolutePaths?: string[];
}

class Configuration {
  static _environment: string | undefined;
  static environments = ["dev", "prod"];
  data: any;

  static new(options: ConfigurationOptions = {}, configPath?: ConfigPath) {
    const config = new Configuration();
    configPath = Configuration.getConfigPath(configPath);
    console.log(`${configPath.green}`);
    config.data = jsyaml.load(fs.readFileSync(configPath, "utf8")) as any;
    // Some config values are environment specific
    // Any value that is an object with a key that matches the environment
    // will be replaced with the value of that key
    traverse(config.data, (node: any, key: string, value: any) => {
      if (typeof value === "object" && value !== null) {
        if (value[Configuration.environment]) {
          node[key] = value[Configuration.environment];
        }
      }
    });

    if (options.toAbsolutePaths?.length) {
      // Convert all relative paths to absolute paths
      traverse(config.data, (node: any, key: string, value: any) => {
        if (typeof value === "string") {
          if (options.toAbsolutePaths?.includes(key)) {
            node[key] = path.resolve(path.dirname(configPath as string), value);
          }
        }
      });
    }

    if (options.quitIfChanged) {
      // If the source file or configuration file changes, exit the process (and restart from the cmd file)
      [configPath, ...options.quitIfChanged].forEach((file) => {
        fs.watchFile(file, () => {
          console.log(`${file.yellow} ${`changed, restarting...`.gray}`);
          process.exit();
        });
      });
    }

    console.log(Configuration.toYaml(config.data).gray);

    process.exit();

    return config;
  }

  static toYaml(config: any) {
    return jsyaml.dump(config);
  }

  private static getConfigPath(configPath?: ConfigPath) {
    const isConfigPath = (filePath: string) => {
      if (filePath.endsWith(".config.yaml")) return true;
      if (path.basename(filePath) === "config.yaml") return true;
      return false;
    };
    // If process.argv[] contains a config path, use it
    const argConfigPath = process.argv.find(isConfigPath);
    if (argConfigPath) return argConfigPath.toAbsolutePath(path);
    // In case of string, return it
    if (typeof configPath === "string") return configPath.toAbsolutePath(path);
    // In case of string[], find the file that exists
    if (Array.isArray(configPath)) {
      for (const p of configPath) {
        if (fs.existsSync(p.toAbsolutePath(path)))
          return p.toAbsolutePath(path);
      }
    }
    // If no config file specified in [process.argv] or [configPath],
    // try to find a config file in the current directory
    // (anything that ends with ".config.yaml" or "config.yaml")
    const configPathCandidates = fs
      .readdirSync(process.cwd())
      .filter(isConfigPath);
    if (configPathCandidates.length == 1) return configPathCandidates[0];
    if (configPathCandidates.length > 1)
      throw new Error(
        `Multiple config files found: ${configPathCandidates.join(", ")}`
      );
    // If no config file found, throw an error
    throw new Error(`Config file not found: ${configPath}`);
  }

  // static "environment" getter
  static get environment() {
    if (Configuration._environment) return Configuration._environment;
    let env = (process.env.NODE_ENV || "dev") as string | undefined;
    // If env starts with ["dev", "prod"], replace it with the first match
    env = Configuration.environments.find((e) => env?.startsWith(e));
    Configuration._environment = env;
    console.log(`Environment is ${env?.yellow}`.gray);
    console.log();
    if (env) return env;
    throw new Error(`Invalid environment: ${env}`);
  }
}

export { Configuration };
