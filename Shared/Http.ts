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
}

export { Http };
