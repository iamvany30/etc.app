const { BrowserWindow, shell, ipcMain, app } = require('electron');
const path = require('path');
const { PATHS } = require('./config');
const downloadManager = require('./downloadManager');

let mainWindow = null;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1250, 
        height: 900,
        minWidth: 400,
        minHeight: 400,
        backgroundColor: '#101214', 
        frame: false, 
        show: false,
        icon: PATHS.ICON,
        webPreferences: { 
            preload: PATHS.PRELOAD, 
            nodeIntegration: false,
            webviewTag: true
        }
    });

    mainWindow.webContents.on('context-menu', (event) => {
        event.preventDefault();
    });
    
    mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
        downloadManager.handleWillDownload(event, item, webContents);
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        try {
            const parsedUrl = new URL(url);
            if (parsedUrl.hostname === 'xn--d1ah4a.com' || parsedUrl.hostname === 'итд.com') {
                const navigateTo = parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
                mainWindow.webContents.send('navigate-to', navigateTo);
                return { action: 'deny' };
            }
        } catch (e) {}
        
        if (url.startsWith('http')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    ipcMain.on('window-minimize', () => mainWindow?.minimize());
    ipcMain.on('window-maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
    ipcMain.on('window-close', () => mainWindow?.close());
    ipcMain.on('nav-back', () => mainWindow?.webContents.goBack());
    ipcMain.on('nav-forward', () => mainWindow?.webContents.goForward());
    ipcMain.on('nav-reload', () => mainWindow?.webContents.reload());

    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.type === 'keyDown') {
            const { key, control, shift, meta, alt } = input;
            const isDevToolsKey = key === 'F12' || (key.toLowerCase() === 'i' && ((control && shift) || (meta && alt)));
            
            if (isDevToolsKey) {
                event.preventDefault();
                if (app.isPackaged) {
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.webContents.send('show-devtools-warning');
                    }
                } else {
                    mainWindow.webContents.toggleDevTools();
                }
            }
        }
    });

    if (app.isPackaged) {
        mainWindow.loadFile(PATHS.BUILD_INDEX, { query: { v: app.getVersion() } });
    } else {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools(); 
    }

    mainWindow.once('ready-to-show', () => mainWindow.show());
}

function getMainWindow() {
    return mainWindow;
}

module.exports = { createMainWindow, getMainWindow };