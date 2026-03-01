const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Config
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),

  // History
  loadHistory: () => ipcRenderer.invoke('history:load'),
  saveHistory: (history) => ipcRenderer.invoke('history:save', history),

  // File ops
  saveCSV: (opts) => ipcRenderer.invoke('file:save-csv', opts),
  autoSaveCSV: (opts) => ipcRenderer.invoke('file:auto-save-csv', opts),
  openPath: (filePath) => ipcRenderer.invoke('shell:open-path', filePath),
  pickFolder: () => ipcRenderer.invoke('dialog:pick-folder'),

  // Environment
  isElectron: true,
});
