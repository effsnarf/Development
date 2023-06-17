import indent from "indent";
import colors from "colors";
import fetch from "node-fetch";
import mime from "mime-types";
import os from "os";
import fs from "fs";
import yaml from "js-yaml";
import HAML from "hamljs";
import http from "http";
import https from "https";
import request from "request";

var textEncoding = "utf8";

var getTempPath = (ext) => {
  return `${os.tmpdir()}\\${Date.now()}.${ext}`;
}

var configFilePath = './config.yaml';
var config;
var sslDomains;

var loadConfig = () => {
  try
  {
    config = yaml.load(fs.readFileSync(configFilePath, 'utf8'));
    sslDomains = config.server.ssl?.domains?.map(d => {
      return {
        name: d.name,
        credentials: {
          key: fs.readFileSync(`${d.folder}\\${d.key}`),
          cert: fs.readFileSync(`${d.folder}\\${d.cert}`)
        }
      };
    });
    console.log((`Configuration loaded`.green));
  }
  catch (ex)
  {
    console.log(ex.toString().red);
  }
}
loadConfig();
fs.watch(configFilePath, loadConfig);


let logItems = [];
let maxLogItems = 20;


let log = (...args) => {
  logItems.push(args);
  while (logItems.length > maxLogItems) logItems.shift();

  console.clear();

  let isSSL = `${sslDomains ? "s" : ""}`;
  console.log(`MG2.Images`.cyan);
  console.log(`${`http${isSSL}://${config.server.ip}:${config.server.port}/`.yellow}`.green);

  console.log();
  for (let logItem of logItems) console.log(...logItem);
}




var getMimeType = (path) => {
  if (path.toLowerCase().endsWith(".haml")) return mime.lookup("html");
  return mime.lookup(path);
}


var getContent = (path) => {
  var encoding = textEncoding;
  if (["ico", "png", "webp", "jpeg", "jpg"].some(ext => path.endsWith(`.${ext}`))) encoding = null;
  var fileContent = fs.readFileSync(path, encoding);
  return (fileContent);
}



const requestListener = async function (req, res)
{
  try
  {
    let started = Date.now();

    var path = req.url;
    var ps = path.split(`/`).flatMap(a => a.split(`.`));
    var mimeType = mime.lookup(path);
    res.writeHead(200, { "Content-Type": `${mimeType}; charset=utf-8` });

    log(path);

    let serveFromOldMgImages = (path.endsWith(`.jpg`));

    if (serveFromOldMgImages)
    {
      let altUrl = `http://jsonvisualizer.net${path}`;
      //log(`${mimeType}\t${path.yellow}\t`);
      //log(altUrl);
      request(altUrl).pipe(res);
      return;
    }
    else if (path.startsWith(`/images/`))
    {
      let ext = ps[ps.length - 1];
      if (ps.length == 4)
      {
        var imageID = parseInt(ps[2]);
      }
      else if (ps.length > 4)
      {
        var size = ps[2].split(`x`);
        var width = parseInt(size[0]);
        var height = parseInt(size[1]);
        var imageID = parseInt(ps[3]);
      }
      let f1 = Math.floor(imageID / 1024 / 1024);
      let f2 = Math.floor(imageID / 1024);
      let imagePath = `${config.folders.images}\\${f1}\\${f2}\\${imageID}.${ext}`;
      res.write(getContent(imagePath), "utf-8");
      res.end();

      let elapsed = (Date.now() - started);

      const fileSize = fs.statSync(imagePath).size;
      const fileSizeStr = `${(fileSize / 1024).toFixed(0)}${`k`.gray}`;

      log(`${`${elapsed} ms`.gray}\t${fileSizeStr}\t${mimeType}\t${path.yellow}\t`);
    }
  }
  catch (ex)
  {
    console.log(`${ex.toString().red}`);
    res.write(ex.toString());
    res.end();
  }
}



if (sslDomains)
{
  console.log(sslDomains.map(d => `${d.name}`.green).join(`\n`));

  var server = https.createServer(sslDomains[0].credentials, requestListener);
  for (var i = 1; i < sslDomains.length; i++)
    httpsServer.addContext(sslDomains[i].name, sslDomains[i].credentials);
}
else
{
  var server = http.createServer(requestListener);
}

server.listen(config.server.port, config.server.ip);
