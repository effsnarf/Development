import fs from "fs";
import md5 from "md5";
import os from "os";
import path from "path";

abstract class CacheBase {
  abstract get<T>(key: string, getDefaultValue: () => T): Promise<T>;
  abstract set<T>(key: string, value: T): void;
}

class OsTempFolderCache extends CacheBase {
  static new() {
    return new OsTempFolderCache();
  }

  async get<T>(key: string, getDefaultValue: () => T) {
    const path = this.getTempFilePath(key);
    // If the file doesn't exist, create it with the default value
    if (!fs.existsSync(path)) {
      const value = await getDefaultValue();
      fs.writeFileSync(path, JSON.stringify(value));
      return value;
    }
    // If the file exists, read it
    const json = fs.readFileSync(path, "utf8");
    return JSON.parse(json);
  }

  set<T>(key: string, value: T) {
    const path = this.getTempFilePath(key);
    const json = JSON.stringify(value);
    fs.writeFileSync(path, json);
  }

  private getTempFilePath(key: string) {
    const md5key = md5(key);
    const base64key = Buffer.from(md5key).toString("base64");
    const filename = `${base64key}.json`;
    const tempFolder = os.tmpdir();
    const cacheFolder = path.join(tempFolder, "Cache");
    if (!fs.existsSync(cacheFolder)) fs.mkdirSync(cacheFolder);
    const filePath = path.join(cacheFolder, filename);
    return filePath;
  }
}

export { OsTempFolderCache };
