import fs from "fs";
import "../../../../../../Shared/Extensions";
import { Files } from "../../../../../../Shared/Files";
import { TypeScript } from "../../../../../../Shared/TypeScript";

const classes = ["Extensions"];

const sharedPath = Files.findParentFolder(__dirname, "Shared");

export default async function (req: any, res: any, next: any) {
  // Get the class name from /Extensions.js
  const className = req.url
    .substring(1)
    .replace(/\\/g, "/")
    .replace(/\.js$/, "")
    .replace(/\/index$/, "")
    .replace(/\/$/, "")
    .split("/")
    .last();

  if (!classes.includes(className)) return next();

  try {
    res.setHeader("Content-Type", "application/javascript");
  } catch (ex: any) {
    console.log(`Error setting header for ${className}`);
    console.log(ex.stack);
  }

  const tsCode = fs.readFileSync(`${sharedPath}/${className}.ts`, "utf8");
  const jsCode = TypeScript.transpileToJavaScript(tsCode);

  res.end(jsCode);

  next();
}
