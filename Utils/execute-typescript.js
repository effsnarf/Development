const colors = require("colors");
const path = require("path");
const { exec, spawn } = require("child_process");
const JavaScript = require("../Shared/JavaScript.js");

const inputPath = process.argv[2];
const classPaths = ["Loading", "TypeScript"].map((className) => path.resolve(__dirname, "../Shared", `${className}.ts`));

const cls = JavaScript.loadTypeScriptClasses(classPaths);

(async () => {
  try {
    const bundleCode = await cls.TypeScript.webpackify(inputPath);

    eval(bundleCode);
  } catch (exs) {
    if (!Array.isArray(exs))  exs = [exs];
    console.log(`\n${exs.length} error(s) occurred:`);
    console.error(exs.map((ex) => ex.message).join("\n\n"));

    console.log(`Press any key to continue..`);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", process.exit.bind(process, 0));

  }
})();

