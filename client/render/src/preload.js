const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  resizeWindow: (width, height, direction) => ipcRenderer.send('resize-window', { width, height, direction }),
  onWindowResized: (callback) => ipcRenderer.once('window-resized', (event, args) => callback(args)),
}); 