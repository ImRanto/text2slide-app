import { contextBridge, ipcRenderer } from 'electron'

const api = {
  copySlideImage: (rect: { x: number; y: number; width: number; height: number }) =>
    ipcRenderer.invoke('clipboard:write-slide-image', rect),
  onUpdateStatus: (callback: (status: any) => void) => {
    const listener = (_: unknown, status: any) => callback(status)
    ipcRenderer.on('update-status', listener)
    return () => ipcRenderer.removeListener('update-status', listener)
  },
  savePptx: (data: { base64: string; defaultName: string }) => ipcRenderer.invoke('pptx:save', data),
  getVersion: () => ipcRenderer.invoke('app:version'),
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
