const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDataDirectory: () => ipcRenderer.invoke('dialog:selectDataDir'),
  getDataDirectory: () => ipcRenderer.invoke('config:getDataDir'),
  getServerPort: () => ipcRenderer.invoke('config:getServerPort'),
  restartServer: (dataDir) => ipcRenderer.invoke('server:restart', dataDir),
});
