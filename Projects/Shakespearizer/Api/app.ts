import fs from "fs";
import "colors";
import { Configuration } from "@shared/Configuration";
import { Loading } from "@shared/Loading";
import { Database } from "@shared/Database/Database";
import { HttpServer } from "@shared/HttpServer";
import { ChatOpenAI, Roles } from "../../../Apis/OpenAI/classes/ChatOpenAI";
import { Shakespearizer } from "../Shakespearizer";

(async () => {
  const config = (await Configuration.new()).data;

  const shakespearizer = await Shakespearizer.new(config);

  const httpHandler = async (req: any, res: any, data: any) => {
    if (req.url === "/") {
      return res.end(`
      Usage: /shakespearize
      (POST { text: "..." })
      `);
    }

    if (req.url.startsWith("/shakespearize")) {
      const text = data.text;

      const shakespearized = await shakespearizer.shakespearize(text);

      const result = {
        text: text,
        shakespearized: shakespearized,
      };

      return res.end(JSON.stringify(result));
    }
  };

  const httpServer = await HttpServer.new(
    `Shakespearizer`,
    config.server.port,
    config.server.host,
    [],
    httpHandler,
    async (req) => {},
    null,
    [],
    {}
  );
})();
