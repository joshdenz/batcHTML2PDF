const { app, BrowserWindow, ipcMain } = require('electron');
const { getFileNames } = require('./util/getFileNames');
const fs = require('fs');
const path = require('path');
const util = require('util');
const readdir = util.promisify(fs.readdir);
const PDFMerge = require('pdf-merge');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: 'customButtonsOnHover',
    frame: false
  });
  win.loadFile('./ui/index.html');
  // Emitted when the window is closed.
  win.on('closed', () => {
    win = null;
  });
}

app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});

/**
 * On Convert, receives a name and path argument from renderer process.
 * Converts and merges PDF files.
 */
ipcMain.on('convert', async (event, args) => {
  try {
    await convert(args.path[0], await getFileNames(args.path[0], '.html'));
    await mergeFiles(await getFileNames(args.path[0], '.pdf'), args.path[0], args.name);
    event.sender.send('done');
  } catch (err) {
    event.sender.send('problem', err);
  }
});

async function convert(dir, listOfFileNames) {
  await Promise.all(
    listOfFileNames.map(fileName => {
      return new Promise((resolve, reject) => {
        let win = new BrowserWindow({ show: false });
        win.loadURL(`file://${path.join(dir, fileName)}`);
        let pdfName = fileName.split('.')[0] + '.pdf';
        win.webContents.on('dom-ready', () => {
          win.webContents.printToPDF({ printBackground: true, landscape: true }, (err, data) => {
            if (err) {
              return console.log(err);
            }
            fs.writeFile(path.join(dir, pdfName), data, err => {
              if (err) reject(err);
              win.close();
              resolve();
            });
          });
        });
      });
    })
  );
}

// re-write the convert function to load the html into a single instance of headless chrome and execute several load/write steps.

function mergeFiles(listOfFiles, dir, newFileName) {
  let fullPaths = listOfFiles.map(file => {
    return path.join(dir, file);
  });
  PDFMerge(fullPaths)
    .then(buf => {
      fs.writeFile(path.join(dir, newFileName), buf, err => {
        if (err) console.log(err);
      });
    })
    .catch(err => {
      console.log(err);
    });
}
