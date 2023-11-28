import mime from "mime-types";
import axios, { Axios, AxiosResponse, AxiosResponseHeaders } from "axios";
import "../Shared/Extensions";
import { Objects } from "./Extensions.Objects";

class Http {
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
            if (typeof body == "string") body = Objects.json.parse(body);
          } catch (ex) {}
          resolve(body);
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
