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
import { Timer } from "@shared/Timer";

(async () => {
  const config = (await Configuration.new()).data;
  const severity = {
    time: config.severity.time as [number, number, "<" | ">"],
  };
  const db = (await Database.new(config.database)) as MongoDatabase;
  db.options.lowercaseFields = true;

  const log = (...args: any[]) => {
    args = args.map((a) => (typeof a == "string" ? a.gray : a));
    args.unshift(config.title.gray);
    console.log(...args);
  };

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
          image = await db.upsert(
            "MgImages",
            {
              Created: Date.now(),
              Md5: imageMd5,
            },
            true
          );
          const newFilePath = getSplitDirImagePath(image._id, "jpg", false);
          // Move the file to the new location
          // Don't use rename because it doesn't work across drives
          fs.copyFileSync(tempFilePath, newFilePath);
          fs.unlinkSync(tempFilePath);
        }
        // debug(`${`Saved`.gray} ${newFilePath.yellow}`);
        res.send(JSON.stringify(image));
        writeStatus(200);
        res.end();

        loading.stop();

        log(
          `${loading.elapsed
            .unitifyTime()
            .severify(
              ...severity.time
            )}\t${size.unitifySize()}\tUploaded\t_id: ${image._id}`
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
    // Make sure the directory exists
    const dir = path.dirname(imagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
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
          log(
            `Error removing background from ${originalImagePath.yellow}.`.bgRed
          );
          return reject("Error removing background.");
        }
        // debug("No background image created successfully.");
        log(
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

    res.write(fileContent, "utf-8");
    writeStatus(200);
    res.end();

    let elapsed = Date.now() - started;

    const fileSize = fs.statSync(imagePath).size;

    log(
      `${`${elapsed
        .unitifyTime()
        .severify(
          ...severity.time
        )}`}\t${fileSize.unitifySize()}\t${mimeType}\t${req.url.yellow}\t`
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
    const timer = Timer.start();
    try {
      // debug("Processing serve from old server");
      const response = await axios.get(url, { responseType: "arraybuffer" });
      const size = parseInt(response.headers["content-length"]);
      res.write(response.data, "utf-8");
      writeStatus(200);
      res.end();
      log(
        `${timer.elapsed
          ?.unitifyTime()
          .severify(...severity.time)}\t${size.unitifySize()}\t${mimeType}\t${
          `(from old server)`.gray
        }\t${req.url.yellow}`
      );
    } catch (ex: any) {
      if (ex.response?.data.includes("Content not found")) {
        log(
          `${timer.elapsed
            ?.unitifyTime()
            .severify(...severity.time)}\t\t${mimeType}\t${
            `(old server - 404)`.gray
          }\t${req.url.gray}`
        );
        writeStatus(404);
        res.end();
        return;
      }
      log(url.bgRed.white);
      log(ex.message.bgRed.white);
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
        log(`Error occurred: ${ex.message.bgRed.white}`);
        log(ex.stack.bgRed.white);
        writeStatus(500);
        res.write(JSON.stringify({ error: ex.message, stack: ex.stack }));
        res.end();
      } finally {
        // debug("Request processing completed");
      }
    })
    .listen(config.server.port, config.server.host);
})();
