// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { ipcRenderer, contextBridge } = require('electron')

ipcRenderer.on('spotify-auth-data', (event, accessToken) => {
    console.log(accessToken)
});

contextBridge.exposeInMainWorld("app", {
    getCurrentlyPlayingTrack: () => ipcRenderer.invoke("getCurrentlyPlayingTrack"),
    skipTrack: () => ipcRenderer.invoke("skipTrack"),
    previousTrack: () => ipcRenderer.invoke("previousTrack"),
    pauseTrack: () => ipcRenderer.invoke("pauseTrack"),
    checkSavedTrack: () => ipcRenderer.invoke("checkSavedTrack"),
    saveTrack: () => ipcRenderer.invoke("saveTrack"),
    deleteTrack: () => ipcRenderer.invoke("deleteTrack"),
    login: () => ipcRenderer.invoke('login')
})