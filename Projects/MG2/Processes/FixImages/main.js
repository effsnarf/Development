import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const scanAllFiles = async function(dirPath, cb)
{
    let files = fs.readdirSync(dirPath)

    for (let file of files)
    {
        let fullPath = (dirPath + "/" + file);
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            //console.log(`Scanning ${fullPath}`);
            await scanAllFiles(fullPath, cb)
        } else {
            await cb(fullPath);
        }
    }

}


let dir = `f:\\MemeGenerator\\Images`;


(async() => {
    let countFiles = true;
    let totalFiles = 5240960;
    let largeFiles = 0;
    let processedFiles = 0;
    let maxFileSize = 500;

    if (countFiles)
    {
        console.log(`Counting large image files...`);

        await scanAllFiles(dir, async (filePath) => {
            totalFiles++;
            let kb = (fs.statSync(filePath).size / 1024);
            if (kb > maxFileSize) largeFiles++;
            let percent = (largeFiles * 100 / totalFiles);
            if (0 == (totalFiles % 10000)) console.log(`${(percent.toFixed(2))}% large files ${largeFiles} / ${totalFiles}`);
        });
    }

    console.log(`Reducing file sizes...`);

    await scanAllFiles(dir, async (filePath) => {
        var stats = fs.statSync(filePath)
        var fileSizeInBytes = stats.size;
        var kb = fileSizeInBytes / (1024);
        
        //console.log(filePath);
        let imageID = parseInt(filePath.replaceAll(`/`, `.`).split(`.`).reverse()[1]);
        let tempPath = `d:\\temp\\${imageID}.jpg`;

        if (kb > maxFileSize)
        {
            try
            {
                await (new Promise((resolve, reject) => {
                    sharp(filePath)
                    .resize(1024)
                    .toFile(tempPath, (err, info) => {
                        if (err) reject(err); else resolve();
                    });
                }));

                //let kb2 = (fs.statSync(tempPath).size / 1024);
                //let percent = Math.round(kb2 * 100 / kb);
                //console.log(`(${percent}%) ${imageID}.jpg`);

                fs.copyFileSync(tempPath, filePath);
                fs.unlinkSync(tempPath);
            }
            catch (ex)
            {
                console.log(ex.toString());
            }

            processedFiles++;
            let percent = (processedFiles * 100 / totalFiles);
            console.log(`${(percent.toFixed(2))}% complete ${processedFiles} / ${totalFiles}`);
        }
    });
})();


