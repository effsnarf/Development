import "./Extensions";
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

type ConfigPaths = string | string[];

interface ConfigurationOptions {
  quitIfChanged?: string[];
  toAbsolutePaths?: string[];
}

class Configuration {
  static _environment: string | undefined;
  static environments = ["dev", "prod"];
  data: any;

  static new(options: ConfigurationOptions = {}, configPaths?: ConfigPaths) {
    const config = new Configuration();
    configPaths = Configuration.getConfigPaths(configPaths);
    console.log(`${configPaths.length} config file(s) found:`.gray);
    configPaths.forEach((p) => console.log(`  ${p.toShortPath()}`.gray));
    console.log();
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
      .reduce((acc, cur) => cur.deepMerge(acc), {});

    // Replace [dev] or [prod] with the current environment
    traverse(config.data, (node: any, key: string, value: any) => {
      if (typeof value === "object" && value !== null) {
        if (value[Configuration.environment]) {
          node[key] = value[Configuration.environment];
        }
      }
    });

    if (options.quitIfChanged) {
      // If the source file or configuration file changes, exit the process (and restart from the cmd file)
      [...configPaths, ...options.quitIfChanged].forEach((file) => {
        console.log(`${`Watching`.gray} ${file.toShortPath()}`);
        fs.watchFile(file, () => {
          console.log(`${file.yellow} ${`changed, restarting...`.gray}`);
          process.exit();
        });
      });

      console.log();
    }

    console.log(Configuration.toYaml(config.data).gray);

    return config;
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
