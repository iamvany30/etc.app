const { BrowserWindow, shell, ipcMain, app } = require('electron');
const path = require('path');
const { PATHS } = require('./config');

let mainWindow = null;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1250, height: 900, backgroundColor: '#101214', frame: false, show: false,
        icon: PATHS.ICON,
        webPreferences: { 
            preload: PATHS.PRELOAD, 
            contextIsolation: true, 
            nodeIntegration: false 
        }
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http')) shell.openExternal(url);
        return { action: 'deny' };
    });

     
    ipcMain.on('window-minimize', () => mainWindow?.minimize());
    ipcMain.on('window-maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
    ipcMain.on('window-close', () => mainWindow?.close());
    ipcMain.on('nav-back', () => mainWindow?.webContents.goBack());
    ipcMain.on('nav-forward', () => mainWindow?.webContents.goForward());
    ipcMain.on('nav-reload', () => mainWindow?.webContents.reload());

    if (app.isPackaged) mainWindow.loadFile(PATHS.BUILD_INDEX);
    else mainWindow.loadURL('http://localhost:3000');

    mainWindow.once('ready-to-show', () => mainWindow.show());
}

function getMainWindow() {
    return mainWindow;
}

module.exports = { createMainWindow, getMainWindow };