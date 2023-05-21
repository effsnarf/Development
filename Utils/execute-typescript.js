import colors from 'colors';
import fs from 'fs';
import path from 'path';
import { exec, spawn } from 'child_process';

if (typeof(__dirname) == 'undefined') {
    var __dirname = process.cwd();
}

// From the current folder up, find the Shared folder
const findSharedPath = (basePath) => {
    let currentPath = basePath;
    while (currentPath !== '/') {
        const sharedPath = path.join(currentPath, 'Shared');
        if (fs.existsSync(sharedPath)) {
            return path.relative(basePath, sharedPath).replace(/\\/g, '/');
        }
        currentPath = path.join(currentPath, '..');
    }
    throw new Error('Shared folder not found');
};

const executeRecursively = (baseFolder, filter, callback) => {
    const files = fs.readdirSync(baseFolder);
    for (const file of files) {
        const filePath = path.join(baseFolder, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            executeRecursively(filePath, filter, callback);
        } else if (filter(filePath)) {
            callback(filePath);
        }
    }
};

// Replace @shared/ with the relative path to the Shared folder
const preprocessTypeScript = (inputPath, outputPath) => {
    if (!outputPath) outputPath = inputPath;

    const input = fs.readFileSync(inputPath, 'utf8');

    let output = input;

    const sharedPath = findSharedPath(path.dirname(inputPath));

    output = output.replace(/@shared\//g, `${sharedPath}/`);

    fs.writeFileSync(outputPath, output, 'utf8');
}

// Replace the relative path to the Shared folder with @shared/
const postProcessTypeScript = (inputPath, outputPath) => {
    if (!outputPath) outputPath = inputPath;

    const input = fs.readFileSync(inputPath, 'utf8');

    let output = input;

    const sharedPath = findSharedPath(path.dirname(inputPath));

    output = output.replace(new RegExp(`${sharedPath}/`, 'g'), '@shared/');

    fs.writeFileSync(outputPath, output, 'utf8');
}

const inputPath = process.argv[2];

const folder = path.dirname(inputPath);
const filter = (filePath) => filePath.endsWith('.ts') && !filePath.endsWith('.d.ts');

executeRecursively(folder, filter, (filePath) => preprocessTypeScript(filePath));

const onExit = () => {
    executeRecursively(folder, filter, (filePath) => postProcessTypeScript(filePath));
};

// Spawn TypeScript process (ts-node)
const tsNode = spawn('cmd.exe', ['/c', 'npx', 'ts-node', inputPath, ...process.argv.slice(3)], { stdio: 'inherit' });

tsNode.on("exit", (code) => {
    onExit();
});

for (const signal of ["SIGINT", "SIGTERM", "SIGKILL"])
{
    process.on(signal, () => {
    onExit();
  });
}