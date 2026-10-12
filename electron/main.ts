import { app, BrowserWindow, ipcMain, clipboard, session, dialog, shell } from 'electron'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const url = details.url
    if (url.startsWith('http://') || url.startsWith('https://')) {
      let host = ''
      try { host = new URL(url).hostname } catch {}
      // Autorise uniquement GitHub (mises à jour). Tout le reste reste bloqué.
      const isGithub = host === 'github.com' || host.endsWith('.github.com') || host.endsWith('.githubusercontent.com')
      if (!isGithub && !url.includes('localhost') && !url.includes('127.0.0.1')) {
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
      if (html) {
        clipboard.write({ html, text })
      } else {
        clipboard.writeText(text)
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error?.message || String(error) }
    }
  })

  ipcMain.handle('pptx:save', async (_, { base64, defaultName }) => {
    try {
      const target = mainWindow
        ? await dialog.showSaveDialog(mainWindow, {
            title: 'Enregistrer la présentation',
            defaultPath: join(app.getPath('documents'), defaultName || 'Text2Slide.pptx'),
            filters: [{ name: 'Présentation PowerPoint', extensions: ['pptx'] }]
          })
        : await dialog.showSaveDialog({ defaultPath: defaultName || 'Text2Slide.pptx' })
      if (target.canceled || !target.filePath) return { success: false, canceled: true }
      await writeFile(target.filePath, Buffer.from(base64, 'base64'))
      shell.showItemInFolder(target.filePath)
      shell.openPath(target.filePath)
      return { success: true, path: target.filePath }
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

  ipcMain.handle('app:version', () => app.getVersion())

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
