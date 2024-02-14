const https = require('https');

const util = {
  fetch: {
    data: async (url, attempts = 10) => {
      return new Promise((resolve, reject) => {
          https.get(url, (response) => {
            let data = '';
            response.on('data', (chunk) => {
              data += chunk;
            });
            response.on('end', () => {
              resolve(JSON.parse(data));
            });
          }).on('error', async (error) => {
            if (attempts) {
              await util.sleep(1000);
              return await util.fetch.data(url, attempts - 1);
            }
            reject(error);
          });
        });
    }
  },
  sleep: (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = util;
