

const { BrowserWindow, shell, ipcMain, app } = require('electron');
const path = require('path');
const fs = require('fs'); 
const { PATHS } = require('./config');

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
            contextIsolation: true, 
            nodeIntegration: false 
        }
    });

    
    
    mainWindow.webContents.on('context-menu', (event) => {
        event.preventDefault();
    });
    
    
    mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
        const downloadsPath = app.getPath('downloads');
        const saveDir = path.join(downloadsPath, 'etc.app');

        if (!fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir, { recursive: true });
        }
        
        const fileName = item.getFilename();
        const fullPath = path.join(saveDir, fileName);
        const url = item.getURL();
        const startTime = Date.now();

        item.setSavePath(fullPath);

        
        webContents.send('download-progress', { 
            url, 
            fileName, 
            path: fullPath, 
            percent: 0, 
            status: 'starting',
            startTime
        });

        item.on('updated', (event, state) => {
            if (state === 'progressing') {
                const percent = item.getTotalBytes() > 0 
                    ? (item.getReceivedBytes() / item.getTotalBytes()) * 100 
                    : 0;
                
                webContents.send('download-progress', { 
                    url, 
                    fileName,
                    path: fullPath,
                    percent, 
                    status: 'progressing',
                    startTime
                });
            }
        });

        item.on('done', (event, state) => {
            const status = state === 'completed' ? 'completed' : state === 'cancelled' ? 'cancelled' : 'failed';
            webContents.send('download-progress', { 
                url, 
                fileName,
                path: fullPath,
                percent: 100, 
                status,
                startTime
            });
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

    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.type === 'keyDown') {
            const { key, control, shift, meta } = input;
            
            
            if (key === 'F12') {
                mainWindow.webContents.toggleDevTools();
                event.preventDefault();
            }
            
            if (key.toLowerCase() === 'i' && ((control && shift) || (meta && input.alt))) {
                mainWindow.webContents.toggleDevTools();
                event.preventDefault();
            }
        }
    });

    if (app.isPackaged) {
        mainWindow.loadFile(PATHS.BUILD_INDEX, {
            query: { v: app.getVersion() }
        });
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