import { app, BrowserWindow, ipcMain, clipboard, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const url = details.url
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
        callback({ cancel: true })
        return
      }
    }
    callback({ cancel: false })
  })

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      devTools: is.dev
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.text2slide.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('clipboard:write-powerpoint', async (_, { html, text }) => {
    try {
      clipboard.write({
        html,
        text
      })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error?.message || String(error) }
    }
  })

  if (!is.dev) {
    try {
      autoUpdater.autoDownload = true

      autoUpdater.on('checking-for-update', () => {
        mainWindow?.webContents.send('update-status', { status: 'checking' })
      })

      autoUpdater.on('update-available', (info) => {
        mainWindow?.webContents.send('update-status', { status: 'update-available', info })
      })

      autoUpdater.on('update-not-available', () => {
        mainWindow?.webContents.send('update-status', { status: 'update-not-available' })
      })

      autoUpdater.on('download-progress', (progressObj) => {
        mainWindow?.webContents.send('update-status', { status: 'download-progress', progress: progressObj })
      })

      autoUpdater.on('update-downloaded', (info) => {
        mainWindow?.webContents.send('update-status', { status: 'update-downloaded', info })
      })

      autoUpdater.on('error', (err) => {
        mainWindow?.webContents.send('update-status', { status: 'error', error: err?.message || String(err) })
      })

      autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        console.warn('autoUpdater.checkForUpdatesAndNotify error:', err)
      })
    } catch (err) {
      console.warn('autoUpdater init failed', err)
    }
  }

  ipcMain.handle('update:install', async () => {
    try {
      autoUpdater.quitAndInstall()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) }
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
