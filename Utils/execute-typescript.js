const colors = require("colors");
const fs = require("fs");
const path = require("path");
const { exec, spawn } = require("child_process");
const JavaScript = require("../Shared/JavaScript.js");

const inputPath = process.argv[2];
const classPaths = ["Extensions", "StringBuilder", "Loading", "Coder", "TypeScript"].map((className) => path.resolve(__dirname, "../Shared", `${className}.ts`));

const cls = JavaScript.loadTypeScriptClasses(classPaths);

(async () => {
  try {
    let tsCode = fs.readFileSync(inputPath, "utf8");
    
    tsCode = await cls.TypeScript.resolveSharedAliases(tsCode);

    //tsCode = cls.Coder.App.addDebuggingCode(tsCode);

    const newFilePath = path.resolve(path.dirname(inputPath), `${path.basename(inputPath)}.temp.ts`);

    fs.writeFileSync(newFilePath, tsCode, "utf8");

    const onExit = () => {
      try
      {
        if (fs.existsSync(newFilePath)) fs.unlinkSync(newFilePath);
      }
      catch (ex)
      {

      }
    };
    
    // Spawn TypeScript process (ts-node)
    const args = ['/c', 'npx', 'ts-node', newFilePath, ...process.argv.slice(3)];
    //console.log(args);
    const tsNode = spawn('cmd.exe', args, { stdio: 'inherit' });
    
    tsNode.on("exit", (code) => {
        onExit();
    });
    
    for (const signal of ["SIGINT", "SIGTERM", "SIGKILL"])
    {
        process.on(signal, () => {
        onExit();
      });
    }
  } catch (exs) {
    if (!Array.isArray(exs))  exs = [exs];
    console.log(`\n${exs.length} error(s) occurred:`);
    console.error(exs.map((ex) => ex.message).join("\n\n"));
  }
})();

