const { ipcRenderer, contextBridge } = require('electron');

//Provide the context Bridge to open the url external
contextBridge.exposeInMainWorld('electronAPI', {
    openExternal: (url) => ipcRenderer.send('open-external', url)
});
