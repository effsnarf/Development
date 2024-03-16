import fs from "fs";
import "colors";
import path from "path";
import { Configuration } from "@shared/Configuration";
import { HttpServer } from "@shared/HttpServer";
import { TypeScript } from "@shared/TypeScript";

(async () => {
  const config = (await Configuration.new()).data;

  const httpHandler = async (req: any, res: any, data: any) => {};

  const httpServer = HttpServer.new(
    config.title,
    config.server.port,
    config.server.host,
    [],
    httpHandler,
    null,
    `../src/index.html`,
    [path.resolve(`../src`)],
    {}
  );
})();
