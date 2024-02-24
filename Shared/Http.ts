import fs from "fs";
import path from "path";
import mime from "mime-types";
import axios, { Axios, AxiosResponse, AxiosResponseHeaders } from "axios";
import "../Shared/Extensions";
import { Objects } from "./Extensions.Objects";

class Http {
  static async fetchHtml(url: string) {
    const response = await axios.get(url);
    return response.data as string;
  }

  // Download a file from a URL and return the binary data
  static async download(url: string): Promise<Buffer> {
    let response = await axios.get(url, { responseType: "arraybuffer" });
    return response.data;
  }

  static async downloadTo(url: string, filePath: string) {
    try {
      const folder = path.dirname(filePath);

      if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

      const response = await axios.get(url, {
        responseType: "stream",
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise<void>((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });
    } catch (error) {
      console.error("Error downloading the file:", error);
      throw error;
    }
  }

  static async getPostData(req: any): Promise<any> {
    if (req.method.toLowerCase() != "post") return null;

    if (typeof req.body != "string") return req.body;

    try {
      return Objects.json.parse(req.body);
    } catch (ex: any) {
      return req.body;
    }
  }

  static async getPostDataFromStream(req: any): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        let body = "";
        req.on("data", (chunk: any) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            if (body) {
              body = JSON.parse(body);
            }
          } catch (ex) {
            return reject(ex);
          }
          resolve(body);
        });
        req.on("error", (error: any) => {
          reject(error);
        });
      } catch (ex: any) {
        reject(ex);
      }
    });
  }

  static async getResponseStream(response: AxiosResponse<any>) {
    return new Promise<string>((resolve, reject) => {
      let data = "";
      response.data.on("data", (chunk: any) => {
        data += chunk;
      });
      response.data.on("end", () => {
        resolve(data);
      });
      response.data.on("error", (error: any) => {
        reject(error);
      });
    });
  }

  static getMimeType(filePath: string): string {
    return mime.lookup(filePath) || "application/octet-stream";
  }

  static isImageFile(filePath: string): boolean {
    return (
      Http.getMimeType(filePath).startsWith("image/") ||
      filePath.endsWith(".svg")
    );
  }

  static isVideoFile(filePath: string): boolean {
    return Http.getMimeType(filePath).startsWith("video/");
  }
}

export { Http };
