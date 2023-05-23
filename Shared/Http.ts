class Http {
  static async getPostData(req: any): Promise<string | null> {
    if (req.method !== "POST") return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      try {
        let body = "";
        req.on("data", (chunk: any) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          resolve(body);
        });
      } catch (ex: any) {
        reject(ex);
      }
    });
  }
}

export { Http };
