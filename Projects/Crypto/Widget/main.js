const { app, BrowserWindow } = require('electron');
const util = require('./util');

let mainWindow;

function timestamp() {
    return (new Date()).toLocaleString();
}

function log(...args) {
    console.log(`${timestamp()} \t `, ...args);
}

function onError(error) {
    if (error?.message) error = error.message;
    mainWindow.webContents.send('error', error);
}

async function fetchBitcoinPrice() {
    const bitcoinData = await util.fetch.data('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const bitcoinPrice = parseFloat(bitcoinData?.bitcoin?.usd);
    if (!bitcoinPrice) {
        log(`Trying to fetch the Bitcoin price again.`);
        console.log(bitcoinData);
        await util.sleep(1000);
        return await fetchBitcoinPrice();
    }
    log(`Bitcoin price: $${bitcoinPrice.toLocaleString()}`);
    return bitcoinPrice;
}


async function updateBitcoinPrice(resetView = false, repeat = true) {
    try {
      if (resetView) {
        mainWindow.webContents.send('bitcoin-price', null);
        await util.sleep(1000);
      }
      const bitcoinPrice = await fetchBitcoinPrice();
        mainWindow.webContents.send('bitcoin-price', bitcoinPrice);
        await util.sleep(1000 * 60 * 5); // Wait 5 minutes before updating the price
    } catch (error) {
        onError(error);
    }
    finally {
      if (repeat) updateBitcoinPrice();
    }
}


function startup() {
  updateBitcoinPrice();
}


async function createWindow() {
    mainWindow = new BrowserWindow({
    width: 300,
    height: 120,
    resizable: true, // Prevent resizing the window
    frame: false, // Remove window frame if you want a custom design
    alwaysOnTop: true, // Set the window to always be on top
    transparent: true, // Make the window transparent if you want a custom design
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Catch "refresh" events from the page
  mainWindow.webContents.on('refresh', () => {
    updateBitcoinPrice(true, false);
  });

  mainWindow.loadFile('index.html');
  // Open the DevTools if needed
    //mainWindow.webContents.openDevTools();

  // When the document is ready, start updating the Bitcoin price
  mainWindow.webContents.on('dom-ready', startup);
}

app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});