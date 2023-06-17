import { Request, Response, NextFunction } from "express";

export default async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const processRequest = async (data: any) => {
    // Proxy the request to the image server
    const url = `https://img.memegenerator.net${req.url}`;

    // Return HTTP Moved Permanently (301) to the client
    res.writeHead(301, {
      Location: url,
    });
    res.end();
  };

  const process = async (data: any) => {
    try {
      await processRequest(data);
    } catch (ex: any) {
      res.end(ex.toString());
    }
  };

  if (req.method === "GET") {
    process(null);
  } else if (req.method === "POST") {
    let body = "";
    req.on("data", (data) => {
      body += data;
    });
    req.on("end", async () => {
      process(body);
    });
  } else {
    res.end("Unsupported method");
  }
}
