import fetch from 'node-fetch';

export default async function (req, res, next) {
    const processRequest = async (data) => {
        // Proxy the request to the image server,
        const url = `https://img.memegenerator.net${req.url}`;

        // Return HTTP Moved Permanently (301) to the client
        res.writeHead(301, {
            'Location': url
        });
        res.end();  
    };
  
    const process = async(data) => {
      try
      {
        await processRequest(data);
      }
      catch (ex)
      {
        res.end(ex.toString());
      }
    }
  
    if (req.method === 'GET') {
      process();
    }
    else if (req.method === 'POST') {
      let body = '';
      req.on('data', (data) => {
        body += data;
      });
      req.on('end', async () => {
        process(body);
      });
    }
    else {
      res.end("Unsupported method");
    }
  }
  
  