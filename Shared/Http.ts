import mime from "mime-types";

class Http {
  static async getPostData(req: any): Promise<any> {
    if (req.method !== "POST") return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      try {
        let body = "";
        req.on("data", (chunk: any) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            body = JSON.parse(body);
          } catch (ex) {}
          resolve(body);
        });
      } catch (ex: any) {
        reject(ex);
      }
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
}

export { Http };
