console.log("Lesezeichenverwaltung");

const electron = require("electron");
const { ipcMain } = require('electron');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require("path");
const url = require("url");
const fs = require("fs");

let window; 

function createWindow() { 
    window = new BrowserWindow({
        backgroundColor: '#fff',
        webPreferences:{
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            webviewTag: true
        },    


    });
    window.loadURL(url.format({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file",
        slashes: true
    }))

    //Show Firebug
    //window.webContents.openDevTools();

    window.on("closed", () => {
        window = null;
    })
}



ipcMain.on("messageChannel", (event, message) => {
    console.log(message); // "Hello from Renderer"
    event.reply("replyChannel", "Received your message!");
  });


/*const dataPath = path.join(__dirname, 'view1/bookmarks.json');
  fs.readFile(dataPath, (err, data) => {
    if (err) throw err;
    // Senden der Daten an den Renderer-Prozess

    console.log("Daten senden");
    window.on('ready-to-show', () => {
    window.webContents.send('data', JSON.parse(data));
    });
  });
*/
app.on("ready", createWindow);