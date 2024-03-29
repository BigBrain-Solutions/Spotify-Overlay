const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const axios = require('axios')
require('dotenv').config()

const URL = "https://api.spotify.com/v1/me/player/"

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}
//#region FS
function createFolderIfNull(folderPath) {
  if (!folderPath) {
    console.error('Path is null or undefined');
    return;
  }
  
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`Folder created at: ${folderPath}`);
  } else {
    console.log(`Folder already exists at: ${folderPath}`);
  }
}

function createConfigFileIfNull(filePath, content) {
  if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`File created at: ${filePath}`);
  } else {
      console.log(`File already exists at: ${filePath}`);
  }
}

function openConfigFile(filePath) {
  if (fs.existsSync(filePath)) {
    const configFileContents = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(configFileContents);
  } else {
    console.error(`File does not exist at: ${filePath}`);
    return null;
  }
}
//#endregion

const spotifyOverlayPath = path.join(os.homedir(), 'AppData', 'Roaming', 'spotify-overlay');
createFolderIfNull(spotifyOverlayPath)

const filePath = path.join(spotifyOverlayPath, 'config.json');
createConfigFileIfNull(filePath, JSON.stringify({"token": ""}))

const config = fs.readFileSync(filePath, 'utf-8');
const data = JSON.parse(config);
const TOKEN = data.token;

let paused = false;
let currPlayingId = ""
let isSaved = false;

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

  let secondWindow = new BrowserWindow({
      width: 800, 
      height: 600,
      webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }  
    });
  secondWindow.loadFile(path.join(__dirname, 'login.html')); // Load your HTML file here
  secondWindow.webContents.openDevTools();

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

function login() {
  console.log("login")
}

function getCurrentlyPlayingTrack() {

  if (!TOKEN || TOKEN === "") return;

  return axios({
    method: 'GET',
    url: URL + 'currently-playing',
    headers: { Authorization: 'Bearer ' + TOKEN }
  })
    .then(function (response) {
      paused = !response.data.is_playing
      currPlayingId = response.data.item.id

      return {
        artists: response.data.item.album.artists,
        title: response.data.item.name,
        image: response.data.item.album.images[2],
        timestamp: response.data.timestamp,
        progress_ms: response.data.progress_ms,
        is_playing: response.data.is_playing,
      }
    });

}

function checkSavedTrack() {
  return axios({
    method: 'GET',
    url: 'https://api.spotify.com/v1/me/tracks/contains?ids=' + currPlayingId,
    headers: { Authorization: 'Bearer ' + TOKEN }
  }).then(response => {
    isSaved = response.data[0]
    return {
      saved: response.data[0]
    }
  }).catch(err => {console.log(err)})
}

function saveTrack() {
  if (isSaved) return;

  axios({
    method: 'PUT',
    url: 'https://api.spotify.com/v1/me/tracks?ids=' + currPlayingId,
    headers: { Authorization: 'Bearer ' + TOKEN }
  })
}

function deleteTrack() {
  axios({
    method: 'DELETE',
    url: 'https://api.spotify.com/v1/me/tracks?ids=' + currPlayingId,
    headers: { Authorization: 'Bearer ' + TOKEN }
  })
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

function pauseTrack() {
  if (!paused) {
    axios({
      method: 'PUT',
      url: 'https://api.spotify.com/v1/me/player/pause',
      headers: { Authorization: 'Bearer ' + TOKEN }
    }).then(response => {
      paused = true;
    }).catch(err => {
      console.log(err)
    })
  }
  else {
    axios({
      method: 'PUT',
      url: 'https://api.spotify.com/v1/me/player/play',
      headers: { Authorization: 'Bearer ' + TOKEN }
    }).then(response => {
      paused = false;
    })
  }
}

ipcMain.handle("checkSavedTrack", async (event) => {

  let data = checkSavedTrack()

  return data
})

ipcMain.handle("saveTrack", async (event) => {
  saveTrack();
})

ipcMain.handle("deleteTrack", async (event) => {
  deleteTrack();
})


ipcMain.handle("getCurrentlyPlayingTrack", async (event) => {

  let data = getCurrentlyPlayingTrack()

  return data
})

ipcMain.handle("login", async (event) => {
  login()
})

ipcMain.handle("skipTrack", async (event) => {
  skipTrack()
})

ipcMain.handle("previousTrack", async (event) => {
  previousTrack()
})

ipcMain.handle("pauseTrack", async (event) => {
  pauseTrack()
  console.log(paused)
  return paused;
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
