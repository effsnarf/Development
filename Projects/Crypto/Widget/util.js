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
              await util.wait(1000);
              return await util.fetch.data(url, attempts - 1);
            }
            reject(error);
          });
        });
    }
  },
  speak: async (text) => {
    const voice = "female";
    const speech = new SpeechSynthesisUtterance();
    speech.text = text;
    const voices = window.speechSynthesis.getVoices();
    console.log(voices);
    speech.voice = voices.find(v => v.name.toLowerCase().includes(voice.toLowerCase())) || voices[0];
    window.speechSynthesis.speak(speech);
  },
  roundTo: (number, step) => {
    return Math.round(number / step) * step;
  },
  wait: (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = util;
