import fs from "fs";
import "colors";
import axios from "axios";
import { Configuration } from "@shared/Configuration";
import { Console } from "@shared/Console";

const config = Configuration.new({
  quitIfChanged: [__filename],
}).data;

const url = config.url;

const interval = config.interval;

const colorByStatus = (s: any, status: number) => {
  s = s.toString();
  if (status >= 200 && status < 300) return s.green;
  else if (status >= 300 && status < 400) return s.yellow;
  else if (status >= 400 && status < 500) return s.bgRed;
  else return s;
};

const makeRequest = async () => {
  const dt = new Date();
  axios.get(url).then((res) => {
    let sizeBytes = parseInt(res.headers["content-length"] || 0) as any;
    sizeBytes = `${sizeBytes.toLocaleString().padStart(8)}${`b`.gray}`;
    let status = colorByStatus(res.status, res.status);
    let logMsg = colorByStatus(url, res.status);

    console.log(`${dt.toLocaleString().gray} ${status} ${sizeBytes} ${logMsg}`);
  });
  setTimeout(makeRequest, interval);
};

makeRequest();
