const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const { createMainWindow, getMainWindow } = require('./window');
const { registerHandlers } = require('./ipc');
const themes = require('./themes');
const { PATHS } = require('./config');

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors,SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure,IsolateOrigins,site-per-process');
app.commandLine.appendSwitch('ignore-certificate-errors');

let splashWindow = null;

function updateSplash(status, details, progress) {
    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.send('updater-state', { status, details, progress });
    }
}

function createSplash() {
    splashWindow = new BrowserWindow({
        width: 320,
        height: 380,
        backgroundColor: '#101214',
        frame: false,
        alwaysOnTop: false,
        resizable: false,
        center: true,
        show: false,
        icon: PATHS.ICON,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    splashWindow.loadFile(path.join(__dirname, 'splash.html'));
    
    splashWindow.once('ready-to-show', () => {
        splashWindow.show();
        runUpdateSequence();
    });
}

async function runUpdateSequence() {
    if (!app.isPackaged) {
        updateSplash('Режим разработки', 'Пропуск обновлений...', 100);
        await themes.checkAndSyncThemes((s, d, p) => updateSplash(s, d, p));
        launchApp();
        return;
    }

    autoUpdater.autoDownload = false;
    autoUpdater.allowPrerelease = true;

    autoUpdater.on('checking-for-update', () => updateSplash('Проверка обновлений', 'Связь с сервером...', 10));
    autoUpdater.on('update-available', () => {
        updateSplash('Найдено обновление', 'Начинаю загрузку...', 20);
        autoUpdater.downloadUpdate();
    });
    autoUpdater.on('update-not-available', () => {
        updateSplash('Обновлений нет', 'Проверка контента...', 50);
        checkContentAndLaunch();
    });
    autoUpdater.on('error', () => {
        updateSplash('Ошибка обновления', 'Пропуск...', 100);
        checkContentAndLaunch();
    });
    autoUpdater.on('download-progress', (p) => {
        updateSplash('Загрузка обновления', `${Math.round(p.percent)}%`, p.percent);
    });
    autoUpdater.on('update-downloaded', () => {
        updateSplash('Установка...', 'Перезапуск приложения', 100);
        setTimeout(() => autoUpdater.quitAndInstall(), 1500);
    });

    try {
        await autoUpdater.checkForUpdates();
    } catch {
        checkContentAndLaunch();
    }
}

async function checkContentAndLaunch() {
    await themes.checkAndSyncThemes((s, d, p) => updateSplash(s, d, p));
    launchApp();
}

function launchApp() {
    updateSplash('Запуск', 'Загрузка интерфейса...', 100);
    
    registerHandlers();
    createMainWindow();
    const mainWin = getMainWindow();

    mainWin.once('ready-to-show', () => {
        setTimeout(() => {
            mainWin.show();
            if (splashWindow) splashWindow.destroy();
        }, 800);
    });
}

if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('itd-app', process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient('itd-app');
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        const mw = getMainWindow();
        if (mw) {
            if (mw.isMinimized()) mw.restore();
            mw.focus();
        }
    });
}

app.whenReady().then(async () => {
    await session.defaultSession.clearCache();
    createSplash();
});

app.on('window-all-closed', () => { 
    if (process.platform !== 'darwin') app.quit(); 
});