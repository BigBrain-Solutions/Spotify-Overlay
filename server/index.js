const { default: axios } = require('axios');
const express = require('express')
const path = require('path');
const os = require('os');
const fs = require('fs');
const app = express()

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

app.get('/callback', function (req, res) {

    if (req.query.access_token) {
        const username = os.userInfo().username;

        const spotifyOverlayPath = path.join(os.homedir(), 'AppData', 'Roaming', 'spotify-overlay');
        createFolderIfNull(spotifyOverlayPath)

        const filePath = path.join(spotifyOverlayPath, 'config.json');
        createConfigFileIfNull(filePath, JSON.stringify({"token": req.query.access_token}))

        fs.writeFileSync(filePath, JSON.stringify({"token": req.query.access_token}), 'utf-8');

        let config = openConfigFile(filePath)

        console.log(config.token)

        res.send("OK you can close this window")
        return
    }

    const options = {
      root: path.join(__dirname)
     };

    res.sendFile("index.html", options);
})

app.listen(3000)