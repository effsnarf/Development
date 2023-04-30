"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Configuration = void 0;
const fs = __importStar(require("fs"));
const jsyaml = __importStar(require("js-yaml"));
const traverse = function (obj, onValue) {
    const traverse = function (node, key, value) {
        onValue(node, key, value);
        if (value && typeof value === "object") {
            for (const k of Object.keys(value)) {
                traverse(value, k, value[k]);
            }
        }
    };
    traverse(obj, "", obj);
};
class Configuration {
    static new(configPath, options = {}) {
        const config = new Configuration();
        config.data = jsyaml.load(fs.readFileSync(configPath, "utf8"));
        // Some config values are environment specific
        // Any value that is an object with a key that matches the environment
        // will be replaced with the value of that key
        traverse(config.data, (node, key, value) => {
            if (typeof value === "object" && value !== null) {
                if (value[Configuration.environment]) {
                    node[key] = value[Configuration.environment];
                }
            }
        });
        console.log(Configuration.toYaml(config.data).gray);
        if (options.quitIfChanged) {
            // If the source file or configuration file changes, exit the process (and restart from the cmd file)
            [configPath, ...options.quitIfChanged].forEach((file) => {
                fs.watchFile(file, () => {
                    console.log(`${file.yellow} ${`changed, restarting...`.gray}`);
                    process.exit();
                });
            });
        }
        return config;
    }
    static toYaml(config) {
        return jsyaml.dump(config);
    }
    // static "environment" getter
    static get environment() {
        if (Configuration._environment)
            return Configuration._environment;
        let env = (process.env.NODE_ENV || "dev");
        // If env starts with ["dev", "prod"], replace it with the first match
        env = Configuration.environments.find((e) => env === null || env === void 0 ? void 0 : env.startsWith(e));
        Configuration._environment = env;
        console.log(`Environment is ${env === null || env === void 0 ? void 0 : env.yellow}`.gray);
        console.log();
        if (env)
            return env;
        throw new Error(`Invalid environment: ${env}`);
    }
}
exports.Configuration = Configuration;
Configuration.environments = ["dev", "prod"];
