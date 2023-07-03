import util from "util";
import fs from "fs";
import path from "path";
import os from "os";
const md5 = require("md5");
import "colors";
import axios from "axios";
const formidable = require("formidable");
const spawn = require("child_process").spawn;
import mime from "mime-types";
import http from "http";
import "@shared/Extensions";
import { Configuration } from "@shared/Configuration";
import { Loading } from "@shared/Loading";
import { Database } from "@shared/Database/Database";
import { MongoDatabase } from "@shared/Database/MongoDatabase";

const debug = (...args: any[]) => {
  args = args.map((a) => (typeof a == "string" ? a.gray : a));
  console.log(...args);
};

(async () => {
  const config = (await Configuration.new()).data;
  const db = (await Database.new(config.database)) as MongoDatabase;
  db.options.lowercaseFields = true;

  const getFileContent = async (filePath: string) => {
    // debug(`${`Reading`.gray} ${filePath})}`);
    if (
      ["ico", "png", "webp", "jpeg", "jpg"].some((ext) =>
        filePath.endsWith(`.${ext}`)
      )
    ) {
      // debug(`File format is an image`);
      return fs.readFileSync(filePath);
    }

    // debug(`File format is not an image`);
    return fs.readFileSync(filePath, "utf8");
  };

  const processUpload = async (
    writeStatus: (status: number) => void,
    req: any,
    res: any
  ) => {
    // debug("Processing upload request");
    const loading = Loading.startNew("Processing upload request");
    try {
      // debug("Processing upload request");
      var form = new formidable.IncomingForm();
      form.parse(req, async function (err: any, fields: any, files: any) {
        const tempFilePath = (Object.values(files)[0] as any)[0].filepath;
        const imageMd5 = md5(fs.readFileSync(tempFilePath));
        const size = fs.statSync(tempFilePath).size;
        let image = await db.findOne("MgImages", { Md5: imageMd5 });
        if (image) {
          fs.unlinkSync(tempFilePath);
        } else {
          image = await db.upsert("MgImages", {
            Created: Date.now(),
            Md5: imageMd5,
          });
          const newFilePath = getSplitDirImagePath(image._id, "jpg", false);
          fs.renameSync(tempFilePath, newFilePath);
        }
        // debug(`${`Saved`.gray} ${newFilePath.yellow}`);
        writeStatus(200);
        res.end(JSON.stringify(image));

        loading.stop();

        console.log(
          `${loading.elapsed.unitifyTime()}\t${size.unitifySize()}Uploaded\t${
            image._id
          }`
        );
      });
    } finally {
      loading.stop();
    }
  };

  const getSplitDirImagePath = (
    imageID: number,
    ext: string,
    noBg: boolean
  ) => {
    const noBgStr = noBg ? ".nobg" : "";
    const f1 = Math.floor(imageID / 1024 / 1024);
    const f2 = Math.floor(imageID / 1024);
    const imagePath = `${config.folders.images}\\${f1}\\${f2}\\${imageID}${noBgStr}.${ext}`;
    return imagePath;
  };

  const getImagePath = async (ps: string[]) => {
    const noBg = ps.includes("nobg");
    const noBgStr = noBg ? ".nobg" : "";
    ps = ps.except("nobg");
    const ext = ps[ps.length - 1];
    let imageID = 0;
    if (ps.length == 4) {
      imageID = parseInt(ps[2]);
    } else if (ps.length > 4) {
      const size = ps[2].split(`x`);
      const width = parseInt(size[0]);
      const height = parseInt(size[1]);
      imageID = parseInt(ps[3]);
    }

    let imagePath = getSplitDirImagePath(imageID, ext, noBg);

    if (fs.existsSync(imagePath)) {
      // debug(`Returning ${imagePath}`);
      return imagePath;
    }

    imagePath = `${config.folders.images}\\${imageID}${noBgStr}.${ext}`;
    // debug(`Returning ${imagePath}`);
    return imagePath;
  };

  // Creates a no background image if it doesn't exist
  const getExistingImagePath = async (ps: string[]) => {
    return new Promise<string>(async (resolve, reject) => {
      const noBg = ps.includes("nobg");
      if (!noBg) {
        // debug("No background image requested");
        return resolve(getImagePath(ps));
      }
      const noBgImagePath = await getImagePath(ps);
      if (fs.existsSync(noBgImagePath)) {
        // debug("No background image already exists");
        return resolve(noBgImagePath);
      }

      // debug("No background image does not exist. Creating one.");
      // Create no background image
      const originalImagePath = await getImagePath(ps.except("nobg"));
      const loading = Loading.startNew(
        `${`Removing background from`.gray} ${originalImagePath.yellow}`
      );
      // rembg i [originalImagePath] [noBgImagePath]
      const rembg = spawn("rembg", ["i", originalImagePath, noBgImagePath]);
      rembg.stdout.on("data", (data: any) => {
        // debug(`rembg stdout: ${data.shorten(50)}`);
      });
      rembg.stderr.on("data", (data: any) => {
        // debug(`rembg stderr: ${data.shorten(50)}`);
      });
      rembg.on("close", (code: any) => {
        loading.stop();
        if (!fs.existsSync(noBgImagePath)) {
          console.log(
            `Error removing background from ${originalImagePath.yellow}.`.bgRed
          );
          return reject("Error removing background.");
        }
        // debug("No background image created successfully.");
        console.log(
          `${loading.elapsed.unitifyTime()}\t${`Removed background`.gray}\t${
            noBgImagePath.yellow
          }`
        );
        resolve(noBgImagePath);
      });
    });
  };

  const processServeImage = async (
    writeStatus: (status: number) => void,
    req: any,
    res: any,
    ps: string[],
    mimeType: string
  ) => {
    // debug("Processing serve image request");
    const started = Date.now();

    const imagePath = await getExistingImagePath(ps);
    // debug(`Image path: ${imagePath}`);
    const fileContent = await getFileContent(imagePath);

    writeStatus(200);
    res.write(fileContent, "utf-8");
    res.end();

    let elapsed = Date.now() - started;

    const fileSize = fs.statSync(imagePath).size;

    console.log(
      `${`${elapsed.unitifyTime()}`}\t${fileSize.unitifySize()}\t${mimeType}\t${
        req.url.yellow
      }\t`
    );
  };

  const processServeFromOldServer = async (
    writeStatus: (status: number) => void,
    req: any,
    res: any,
    ps: string[],
    mimeType: string
  ) => {
    const url = `${config.old.images.server}${req.url}`;
    try {
      // debug("Processing serve from old server");
      const started = Date.now();
      const response = await axios.get(url, { responseType: "arraybuffer" });
      const size = parseInt(response.headers["content-length"]);
      writeStatus(200);
      res.write(response.data, "utf-8");
      res.end();
      const elapsed = Date.now() - started;
      console.log(
        `${elapsed.unitifyTime()}\t${size.unitifySize()}\t${mimeType}\t${
          `(from old server)`.gray
        }\t${req.url.yellow}`
      );
    } catch (ex: any) {
      console.log(url.bgRed);
      console.log(ex.message.bgRed);
      writeStatus(500);
      res.end();
    }
  };

  http
    .createServer(async function (req: any, res: any) {
      // debug(`Received request: ${req.url}`);

      const mimeType = !req.url.includes(".")
        ? "application/json"
        : mime.lookup(req.url).toString();

      const writeStatus = (status: number) => {
        res.writeHead(status, {
          "Content-Type": `${mimeType}; charset=utf-8`,
        });
      };

      try {
        res.setHeader("Access-Control-Allow-Origin", "*");
        const ps = req.url.split(`/`).flatMap((a: string) => a.split(`.`));

        if (req.url == "/upload") {
          await processUpload(writeStatus, req, res);
        } else if (req.url.startsWith("/images/")) {
          await processServeImage(writeStatus, req, res, ps, mimeType);
        } else if (req.url.startsWith("/instances/")) {
          await processServeFromOldServer(writeStatus, req, res, ps, mimeType);
        } else {
          writeStatus(500);
          res.end(JSON.stringify({ error: "Invalid request" }));
        }
      } catch (ex: any) {
        // debug(`Error occurred: ${ex.message.bgRed}`);
        writeStatus(500);
        res.write(JSON.stringify({ error: ex.message, stack: ex.stack }));
        res.end();
      } finally {
        // debug("Request processing completed");
      }
    })
    .listen(config.server.port, config.server.host);
})();
