const { contextBridge, ipcRenderer } = require('electron')

// 暴露一些 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => process.versions.electron,
  getPlatform: () => process.platform,

  // 控制窗口
  minimize: () => ipcRenderer.invoke('minimize-window'),
  maximize: () => ipcRenderer.invoke('maximize-window'),
  close: () => ipcRenderer.invoke('close-window'),

  // 刷新页面
  reload: () => location.reload()
})
