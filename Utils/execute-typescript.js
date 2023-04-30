import colors from 'colors';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

if (typeof(__dirname) == 'undefined') {
    var __dirname = process.cwd();
}

const deleteFile = (filePath) => {
    try
    {
        if (fs.existsSync(filePath)) {
            //fs.unlinkSync(filePath);
        }
    }
    catch (ex) {

    }
};

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

const preprocessTypeScript = (inputPath, outputPath) => {
    const input = fs.readFileSync(inputPath, 'utf8');

    let output = input;

    const sharedPath = findSharedPath(path.dirname(inputPath));

    output = output.replace(/@shared\//g, `${sharedPath}/`);

    fs.writeFileSync(outputPath, output, 'utf8');
}

const inputPath = process.argv[2];
const outputPath = `${path.dirname(inputPath)}/${path.basename(inputPath)}.temp.ts`;

preprocessTypeScript(inputPath, outputPath);

// Spawn TypeScript process (ts-node)
const tsNode = spawn('cmd.exe', ['/c', 'npx', 'ts-node', outputPath, ...process.argv.slice(3)], { stdio: 'inherit' });

tsNode.on('exit', (code) => {
    deleteFile(outputPath);
});

for (const signal of ["SIGINT", "SIGTERM", "SIGKILL"])
{
    process.on(signal, () => {
    deleteFile(outputPath);
  });
}