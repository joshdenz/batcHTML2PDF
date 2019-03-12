const electron = require('electron');
const { dialog } = require('electron').remote;
const { getFileNames } = require('../util/getFileNames');
const { BrowserWindow } = require('electron').remote;

(function() {
  let path;

  document.getElementById('min-btn').addEventListener('click', function(e) {
    var window = BrowserWindow.getFocusedWindow();
    window.minimize();
  });

  document.getElementById('max-btn').addEventListener('click', function(e) {
    var window = BrowserWindow.getFocusedWindow();
    window.maximize();
  });

  document.getElementById('close-btn').addEventListener('click', function(e) {
    var window = BrowserWindow.getFocusedWindow();
    window.close();
  });
  document.getElementById('select').addEventListener('click', () => {
    dialog.showOpenDialog({ properties: ['openDirectory'] }, dir => {
      if (dir === undefined) {
        return;
      }
      path = dir;
      getFileNames(dir[0], '.html').then(listOfFiles => {
        let list = listOfFiles
          .map(file => {
            return `<tr><td>${file}</td></tr>`;
          })
          .join('');
        document.getElementById('result').innerHTML = `${list}`;
      });
    });
  });

  document.getElementById('convert').addEventListener('click', () => {
    if (path == undefined) {
      return;
    }
    let input = document.getElementById('new-file-name');
    let data = {
      name: input.value,
      path: path
    };
    electron.ipcRenderer.send('convert', data);
    path = null;
    document.getElementById('result').innerHTML = '';
    input.value = '';
  });

  electron.ipcRenderer.on('done', (event, args) => {
    dialog.showMessageBox({ message: 'Files converted.', buttons: ['Ok'] });
  });

  electron.ipcRenderer.on('problem', (event, args) => {
    dialog.showMessageBox({ message: args[0], buttons: ['Ok'] });
  });
})();
