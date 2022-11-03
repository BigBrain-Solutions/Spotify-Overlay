const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const axios = require('axios')
require('dotenv').config()

const TOKEN = process.env.SPOTIFY_TOKEN
const URL = "https://api.spotify.com/v1/me/player/"

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 300,
    height: 100,
    frame: false,
    autoHideMenuBar: false,
    x: 25,
    y: 25,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },

  });

  mainWindow.setAlwaysOnTop(true);

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

function getCurrentlyPlayingTrack() {

  return axios({
    method: 'GET',
    url: URL + 'currently-playing',
    headers: { Authorization: 'Bearer ' + TOKEN }
  })
    .then(function (response) {
      return {
        artists: response.data.item.album.artists,
        title: response.data.item.name,
        image: response.data.item.album.images[2]
      }
    });

}

function skipTrack() {
  axios({
    method: 'POST',
    url: URL + 'next',
    headers: { Authorization: 'Bearer ' + TOKEN }
  })
}

function previousTrack() {
  axios({
    method: 'POST',
    url: URL + 'next',
    headers: { Authorization: 'Bearer ' + TOKEN }
  })
}

ipcMain.handle("getCurrentlyPlayingTrack", async (event) => {

  let data = getCurrentlyPlayingTrack()

  return data
})

ipcMain.handle("skipTrack", async (event) => {
  skipTrack()
})

ipcMain.handle("previousTrack", async (event) => {
  previousTrack()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
