const os = require('os');
const indent = require("indent");
const colors = require("colors");
const mime = require("mime-types");
const fs = require("fs");
const YAML = require("yaml");
const HAML = require("hamljs");
const Handlebars = require("Handlebars");
const http = require("http");
const https = require("https");

var textEncoding = "utf8";



var getMimeType = (path) => {
  if (path.toLowerCase().endsWith(".haml")) return mime.lookup("html");
  return mime.lookup(path);
}


var getContent = (path) => {
  try {
    if (path.startsWith(`./v0.6/`)) path = `../${path.substring(2)}`;
    var encoding = textEncoding;
    if (["ico", "png", "webp", "jpeg", "jpg"].some(ext => path.endsWith(`.${ext}`))) encoding = null;
    var fileContent = fs.readFileSync(path, encoding);
    if (path.endsWith(".haml")) return HAML.render(fileContent);
    return (fileContent);
  }
  catch (ex) {
    console.log(`File not found: ${path}`.red);
    return "";
  }
}


const requestListener = async function (req, res) {
  try {
    var path = req.url;
    var mimeType = mime.lookup(path);
    //console.log(`${mimeType}\t${path.yellow}\t`);
    if (path == "/") path = "./index.haml"; else path = `.${path}`;
    res.writeHead(200, { "Content-Type": `${mimeType}; charset=utf-8` });

    if (path == `./ide.classes.yaml.json`) {
      let srcs = [];
      fs.readdirSync(`../v0.6/classes`).forEach(file => {
        if (!file.endsWith(`.js.yaml`)) return;
        srcs.push(getContent(`../v0.6/classes/${file}`));
      });
      res.write(JSON.stringify(srcs), "utf-8");
      res.end();
      return;
    }

    if ((typeof (mimeType) == `string`) && (mimeType.startsWith(`video`))) {
      let readStream = fs.createReadStream(path);
      readStream.pipe(res);
    }
    else {
      res.write(getContent(path), "utf-8");
      res.end();
    }
    return;
  }
  catch (ex) {
    console.log(`${ex.toString().red}`);
    res.write(ex.toString());
    res.end();
  }
}

const isDevEnv = (os.hostname() == 'eff-pc');

const { ip, port } = isDevEnv ?
  { ip: `127.0.0.1`, port: 80 } :
  { ip: `10.35.16.38`, port: 80 };

console.log(`Vue Studio`.cyan);
console.log(`${`http(s)://${ip}:${port}/`.yellow}`.green);

const server = http.createServer(requestListener);
server.listen(port, ip);
