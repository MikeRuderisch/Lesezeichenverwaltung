console.log("Lesezeichenverwaltung");

const electron = require("electron");
const { ipcMain, shell } = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require("path");
const url = require("url");
const fs = require("fs");

let window;
//Erzeugen des Electron Fensters
function createWindow() { 
    window = new BrowserWindow({
        backgroundColor: '#fff',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            webviewTag: true
        }
    });



    // Haupt-HTML-Datei laden
    window.loadURL(url.format({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file",
        slashes: true
    }));

    // Entwickler-Tools anzeigen (optional)
    //window.webContents.openDevTools();

    window.on("closed", () => {
        window = null;
    });
}

// Hört auf Anfragen vom Renderer-Prozess zum Öffnen externer Links
ipcMain.on('open-external', (event, url) => {
    shell.openExternal(url); // Öffnet externen Link
});


// Fenster erstellen, wenn Electron bereit ist
app.on("ready", createWindow);

//Hört auf Anfragen  der JSON-Daten von View1 an Main, um sie zu speichern
ipcMain.on('save-json', (event, data) => {
    const filePath = path.join(__dirname,'View1', 'bookmarks.json'); 
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8'); 
    console.log('JSON file saved successfully at:', filePath);
    event.reply('save-json-reply', `Datei erfolgreich gespeichert: ${filePath}`);
});

// Hört auf Anfragen  der JSON-Daten von View2 an Main, um sie zu speichern
ipcMain.on('save-json2', (event, data) => {
    const filePath = path.join(__dirname,'View2', 'longForm_Articles.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log('JSON file saved successfully at:', filePath);
    event.reply('save-json-reply', `Datei erfolgreich gespeichert: ${filePath}`);
});
