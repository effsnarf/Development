const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const zipname = process.argv[2];
const folder = process.argv[3];
const target = process.argv[4];

if (!zipname || !folder || !target) {
  console.error('Error: Zip name, folder to compress, and target folder are required.');
  console.log('Usage: node compress.js <zipname> <folder> <target>');
  console.log('Example: node compress.js myproject c:\\projects\\myproject c:\\backups');
  process.exit(1);
}

const now = new Date();
const dt = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
const tm = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit' }).replace(/:/g, '-');
const datetime = `${dt}_${tm}`;

const zipPath = path.join(target, `${zipname}_${datetime}.zip`);
const excludeArgs = ['-xr!node_modules', '-xr!.nuxt', '-xr!.git'];

const args = ['a', '-r', zipPath, folder, ...excludeArgs];

console.log(`Creating zip file: ${zipPath}`);

const zipProcess = spawn('C:\\Program Files\\7-Zip\\7z.exe', args);

zipProcess.stdout.on('data', (data) => {
  //console.log(`stdout: ${data}`);
});

zipProcess.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

zipProcess.on('close', (code) => {
    if (code == 0) {
        console.log(`Zip file created: ${zipPath}`);
    }
  
    // Scan the target folder for the two newest zip files
    const zipFiles = fs.readdirSync(target)
      .filter(file => file.endsWith('.zip'))
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(target, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time)
      .slice(0, 2);
  
    // Compare the two newest zip files
    if (zipFiles.length === 2) {
      const zip1 = fs.readFileSync(path.join(target, zipFiles[0].name));
      const zip2 = fs.readFileSync(path.join(target, zipFiles[1].name));
  
      if (zip1.equals(zip2)) {
        console.log();
        console.log(`The two newest zip files are equal.\nDeleting ${zipFiles[0].name}.`);
        fs.unlinkSync(path.join(target, zipFiles[0].name));
      } else {
      }
      }
  });
  