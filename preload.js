const { ipcRenderer, contextBridge } = require('electron');

// Kontext-Bridge bereitstellen, um externe URLs zu öffnen und JSON-Daten zu speichern
contextBridge.exposeInMainWorld('electronAPI', {
    // Öffnen einer externen URL an Main senden
    openExternal: (url) => ipcRenderer.send('open-external', url),

    // Senden der JSON-Daten von View1 an Main, um sie zu speichern
    saveJsonFile: (data) => ipcRenderer.send('save-json', data),

    // Senden der JSON-Daten von View2 an Main, um sie zu speichern
    saveJsonFile2: (data) => ipcRenderer.send('save-json2', data)  
});
