const { BrowserWindow, shell, ipcMain, app } = require('electron');
const path = require('path');
const fs = require('fs'); 
const { PATHS } = require('./config');

let mainWindow = null;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1250, 
        height: 900, 
        backgroundColor: '#101214', 
        frame: false, 
        show: false,
        icon: PATHS.ICON,
        webPreferences: { 
            preload: PATHS.PRELOAD, 
            contextIsolation: true, 
            nodeIntegration: false 
        }
    });

    
    mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
        
        const downloadsPath = app.getPath('downloads');
        
        
        const saveDir = path.join(downloadsPath, 'etc.app');

        
        if (!fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir, { recursive: true });
        }

        
        const fileName = item.getFilename();
        const fullPath = path.join(saveDir, fileName);

        
        item.setSavePath(fullPath);

        
        webContents.send('download-progress', { percent: 0 });

        
        item.on('updated', (event, state) => {
            if (state === 'progressing') {
                if (item.getTotalBytes() > 0) {
                    const percent = Math.floor((item.getReceivedBytes() / item.getTotalBytes()) * 100);
                    webContents.send('download-progress', { percent });
                }
            }
        });

        
        item.on('done', (event, state) => {
            let finalStatus;
            if (state === 'completed') {
                finalStatus = { percent: 100, status: 'completed' };
                
                
                
                
            } else if (state === 'cancelled') {
                finalStatus = { percent: null, status: 'cancelled' };
            } else {
                finalStatus = { percent: null, status: 'failed' };
            }
            
            webContents.send('download-progress', finalStatus);
        });
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

    if (app.isPackaged) {
        mainWindow.loadFile(PATHS.BUILD_INDEX, {
            query: { v: app.getVersion() }
        });
    } else {
        mainWindow.loadURL('http://localhost:3000');
    }

    mainWindow.once('ready-to-show', () => mainWindow.show());
}

function getMainWindow() {
    return mainWindow;
}

module.exports = { createMainWindow, getMainWindow };