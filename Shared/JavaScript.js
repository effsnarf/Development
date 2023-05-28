const util = require("util");
const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const transpileTypeScriptToJavaScript = (tsCode) => {
// Options for the TypeScript compiler (no generators)
const compilerOptions = {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES5,
    lib: ["es2015", "es2016", "es2017", "es2018", "es2019", "es2020"],
    strict: true,
};

// Transpile the TypeScript code to JavaScript
const jsCode = ts.transpileModule(tsCode, {
    compilerOptions,
    reportDiagnostics: true,
}).outputText;

// Return the JavaScript code as a string
return jsCode;
}
  
class JavaScript
{
    static loadTypeScriptClasses(classPaths) {
        const classes = {};

        const tempPath = path.resolve(os.tmpdir(), `${Date.now()}`);
        if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath);

        //console.log(`${`Transpiling`.gray} ${(classPaths.map((classPath) => path.basename(classPath).yellow).join(", "))}`);

        classPaths.forEach((classPath) => {
            //console.log(`${`Transpiling`.gray} ${classPath.yellow}`);
            const className = path.basename(classPath).split(".")[0];
            let jsCode = transpileTypeScriptToJavaScript(fs.readFileSync(classPath, "utf8"));
            jsCode = jsCode.replace(/_1\.default\b/g, "_1");
            const javaScriptClassPath = path.resolve(tempPath, `${className}.js`);
            fs.writeFileSync(javaScriptClassPath, jsCode, "utf8");
        });

        // Load the JavaScript files
        classPaths.forEach((classPath) => {
            const className = path.basename(classPath).split(".")[0];
            const javaScriptClassPath = path.resolve(tempPath, `${className}.js`);
            classes[className] = require(javaScriptClassPath)[className];
        });
        
        // Delete the temporary directory
        fs.rmdirSync(tempPath, { recursive: true });

        return classes;
    }
}

module.exports = JavaScript;