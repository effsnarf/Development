"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeScript = void 0;
const typescript_1 = __importDefault(require("typescript"));
class TypeScript {
    static transpile(tsCode) {
        // Options for the TypeScript compiler
        const compilerOptions = {
            module: typescript_1.default.ModuleKind.CommonJS,
            target: typescript_1.default.ScriptTarget.ES5,
            downlevelIteration: true,
        };
        // Transpile the TypeScript code to JavaScript
        const jsCode = typescript_1.default.transpileModule(tsCode, {
            compilerOptions,
            reportDiagnostics: true,
        }).outputText;
        // Return the JavaScript code as a string
        return jsCode;
    }
}
exports.TypeScript = TypeScript;
