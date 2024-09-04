const { ipcRenderer, contextBridge } = require('electron');

// Provide the context Bridge to open external URLs and save JSON data
contextBridge.exposeInMainWorld('electronAPI', {
    openExternal: (url) => ipcRenderer.send('open-external', url),
    saveJsonFile: (data) => ipcRenderer.send('save-json', data) ,
    saveJsonFile2: (data) => ipcRenderer.send('save-json2', data)  
});
