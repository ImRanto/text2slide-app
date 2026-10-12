import { contextBridge, ipcRenderer } from 'electron'

const api = {
  writeToClipboard: (data: { html: string; text: string }) =>
    ipcRenderer.invoke('clipboard:write-powerpoint', data),
  onUpdateStatus: (callback: (status: any) => void) => {
    const listener = (_: unknown, status: any) => callback(status)
    ipcRenderer.on('update-status', listener)
    return () => ipcRenderer.removeListener('update-status', listener)
  },
  installUpdate: () => ipcRenderer.invoke('update:install')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.api = api
}
