const colors = require("colors");
const path = require("path");
const { exec, spawn } = require("child_process");
const JavaScript = require("../Shared/JavaScript.js");

const inputPath = process.argv[2];
const classPaths = ["Loading", "TypeScript"].map((className) => path.resolve("../Shared", `${className}.ts`));

const cls = JavaScript.loadTypeScriptClasses(classPaths);

(async () => {
  try {
    const bundleCode = await cls.TypeScript.webpackify(inputPath);
    eval(bundleCode);
  } catch (err) {
    console.error(err);
  }
})();






// // Read the contents of the bundle file
// const bundleCode = fs.readFileSync(bundlePath, 'utf8');
// // Create a new script context
// const scriptContext = vm.createContext({});
// // Run the bundle code within the script context
// vm.runInContext(bundleCode, scriptContext);

// // Call webpack with the configuration
// webpack(webpackConfig, (err, stats) => {
//   if (err || stats.hasErrors()) {
//     console.error(err || stats.compilation.errors);
//     return;
//   }

//   // Load and execute the bundled code
//   const bundlePath = path.resolve(__dirname, 'dist', 'bundle.js');
//   const bundledCode = require(bundlePath);
//   bundledCode.run();
// });

// const executeRecursively = (baseFolder, filter, callback) => {
//     const files = fs.readdirSync(baseFolder);
//     for (const file of files) {
//         const filePath = path.join(baseFolder, file);
//         const stat = fs.statSync(filePath);
//         if (stat.isDirectory()) {
//             executeRecursively(filePath, filter, callback);
//         } else if (filter(filePath)) {
//             callback(filePath);
//         }
//     }
// };

// // Replace the relative path to the Shared folder with @shared/
// const postProcessTypeScript = (inputPath, outputPath) => {
//     if (!outputPath) outputPath = inputPath;

//     const input = fs.readFileSync(inputPath, 'utf8');

//     let output = input;

//     const sharedPath = findSharedPath(path.dirname(inputPath));

//     output = output.replace(new RegExp(`${sharedPath}/`, 'g'), '@shared/');

//     fs.writeFileSync(outputPath, output, 'utf8');
// }

// const folder = path.dirname(inputPath);
// const filter = (filePath) => filePath.endsWith('.ts') && !filePath.endsWith('.d.ts');

// executeRecursively(folder, filter, (filePath) => preprocessTypeScript(filePath));

// const onExit = () => {
//     executeRecursively(folder, filter, (filePath) => postProcessTypeScript(filePath));
// };

// // Spawn TypeScript process (ts-node)
// const tsNode = spawn('cmd.exe', ['/c', 'npx', 'ts-node', inputPath, ...process.argv.slice(3)], { stdio: 'inherit' });

// tsNode.on("exit", (code) => {
//     onExit();
// });

// for (const signal of ["SIGINT", "SIGTERM", "SIGKILL"])
// {
//     process.on(signal, () => {
//     onExit();
//   });
// }
