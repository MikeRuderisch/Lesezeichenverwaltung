console.log("Lesezeichenverwaltung");

const electron = require("electron");
const { ipcMain, shell } = require('electron'); // Import shell here only once
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require("path");
const url = require("url");
const fs = require("fs");

let window;

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

    // Handle external URLs to open in the default system browser
    window.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Load the main HTML file
    window.loadURL(url.format({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file",
        slashes: true
    }));

    // Show developer tools (optional)
    //window.webContents.openDevTools();

    window.on("closed", () => {
        window = null;
    });
}

// Listen for external link open requests from the Renderer process
ipcMain.on('open-external', (event, url) => {
    shell.openExternal(url);
});

// Example IPC listener for other messages
ipcMain.on("messageChannel", (event, message) => {
    console.log(message); // "Hello from Renderer"
    event.reply("replyChannel", "Received your message!");
});

// Create the window when Electron is ready
app.on("ready", createWindow);

/*const dataPath = path.join(__dirname, 'view1/bookmarks.json');
fs.readFile(dataPath, (err, data) => {
    if (err) throw err;
    // Send data to the renderer process

    console.log("Daten senden");
    window.on('ready-to-show', () => {
    window.webContents.send('data', JSON.parse(data));
    });
}); */
// Listen for the save request from the renderer process
ipcMain.on('save-json', (event, data) => {
    const filePath = path.join(__dirname,'View1', 'bookmarks.json'); // Speichern im gleichen Ordner wie die index.html
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8'); // Formatierte JSON speichern
    console.log('JSON file saved successfully at:', filePath);
    event.reply('save-json-reply', `Datei erfolgreich gespeichert: ${filePath}`);
});
ipcMain.on('save-json2', (event, data) => {
    const filePath = path.join(__dirname,'View2', 'longForm_Articles.json'); // Speichern im gleichen Ordner wie die index.html
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8'); // Formatierte JSON speichern
    console.log('JSON file saved successfully at:', filePath);
    event.reply('save-json-reply', `Datei erfolgreich gespeichert: ${filePath}`);
});