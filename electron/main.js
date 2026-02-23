const { app, BrowserWindow, Menu, nativeTheme, protocol, net, globalShortcut, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const { pathToFileURL } = require('url');

const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Local');
const sharedProfilePath = path.join(localAppData, 'etc.app', 'electron_profile_v1');

if (!fs.existsSync(sharedProfilePath)) {
    try { fs.mkdirSync(sharedProfilePath, { recursive: true }); } catch (e) {}
}

try {
    app.setPath('userData', sharedProfilePath);
    app.commandLine.appendSwitch('user-data-dir', sharedProfilePath);
} catch (e) {}

let startupUrl = null;
const { logDebug } = require('./logger');
const discord = require('./discord');
const { createMainWindow, getMainWindow } = require('./window');
const { registerHandlers } = require('./ipc');
const themes = require('./themes');
const { PATHS, USER_AGENT } = require('./config');

let isAppLaunched = false;
let isCheckingContent = false;

function handleUrl(win, urlStr) {
    if (!win || !urlStr) return;

    const protocolSeparator = "://";
    const startIndex = urlStr.indexOf(protocolSeparator);
    
    if (startIndex === -1) return;
    let rawPath = urlStr.substring(startIndex + protocolSeparator.length);
    let navigateTo;
    if (rawPath.startsWith('http')) {
        navigateTo = rawPath; 
    } else {
        navigateTo = '/' + rawPath.replace(/^\/+/, '');
    }

    if (win.webContents) {
        if (win.webContents.isLoading()) {
            win.webContents.once('did-finish-load', () => {
                win.webContents.send('navigate-to', navigateTo);
            });
        } else {
            win.webContents.send('navigate-to', navigateTo);
        }
    }
}

protocol.registerSchemesAsPrivileged([{
    scheme: 'font',
    privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true, bypassCSP: true }
}]);

app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors,SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure,IsolateOrigins,site-per-process');
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

Menu.setApplicationMenu(null);

process.on('uncaughtException', (error) => logDebug('[CRITICAL EXCEPTION]', error));
process.on('unhandledRejection', (reason) => logDebug('[UNHANDLED REJECTION]', reason));

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

if (process.platform === 'win32') app.setAppUserModelId('com.etc.app');

const ICONS = {
    DEFAULT: PATHS.ICON,
    DARK: path.join(__dirname, '../public/icon-dark.ico'),
    LIGHT: path.join(__dirname, '../public/icon-light.ico')
};

function updateAppIcon() {
    const win = getMainWindow();
    if (!win || win.isDestroyed()) return;
    let iconToUse = ICONS.DEFAULT;
    if (fs.existsSync(ICONS.DARK) && fs.existsSync(ICONS.LIGHT)) iconToUse = nativeTheme.shouldUseDarkColors ? ICONS.DARK : ICONS.LIGHT;
    win.setIcon(iconToUse);
}

nativeTheme.on('updated', updateAppIcon);
let splashWindow = null;

function updateSplash(status, details, progress) {
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.webContents.send('updater-state', { status, details, progress });
}

function createSplash(isDebug = false) {
    if (splashWindow && !splashWindow.isDestroyed()) {
        if (isDebug) splashWindow.webContents.send('debug-hang');
        splashWindow.focus();
        return;
    }
    splashWindow = new BrowserWindow({
        width: 320, height: 380, backgroundColor: '#050505', frame: false,
        alwaysOnTop: isDebug, resizable: false, center: true, show: false, icon: PATHS.ICON,
        webPreferences: { nodeIntegration: true, contextIsolation: false, webSecurity: false }
    });
    splashWindow.loadFile(path.join(__dirname, 'splash.html'));
    splashWindow.once('ready-to-show', () => {
        splashWindow.show();
        if (isDebug) splashWindow.webContents.send('debug-hang');
        else runUpdateSequence();
    });
}

async function runUpdateSequence() {
    if (isAppLaunched) return;

    if (!app.isPackaged) {
        updateSplash('Режим разработки', 'Пропуск обновлений...', 100);
        setTimeout(checkContentAndLaunch, 800);
        return;
    }

    autoUpdater.logger = {
        info: (m) => logDebug('[Updater Info]', m),
        warn: (m) => logDebug('[Updater Warn]', m),
        error: (m) => {
            if (m.includes('404') && m.includes('latest.yml')) return;
            logDebug('[Updater Error]', m.split('\n')[0]);
        },
        debug: (m) => logDebug('[Updater Debug]', m)
    };

    autoUpdater.autoDownload = true;
    autoUpdater.allowPrerelease = false;

    const updaterCacheDir = path.join(process.env.LOCALAPPDATA || '', 'etc.app-updater');
    if (fs.existsSync(updaterCacheDir)) {
        try { fs.rmSync(updaterCacheDir, { recursive: true, force: true }); } catch (e) {}
    }

    autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'iamvany30',
        repo: 'etc.app'
    });

    autoUpdater.removeAllListeners();

    autoUpdater.on('checking-for-update', () => updateSplash('Проверка обновлений', 'Связь с сервером...', 10));

    autoUpdater.on('update-available', (info) => {
        updateSplash('Найдено обновление', `Версия ${info.version}`, 20);
    });

    autoUpdater.on('update-not-available', () => {
        updateSplash('Обновлений нет', 'Готово', 50);
        checkContentAndLaunch();
    });

    autoUpdater.on('error', (err) => {
        const msg = err.message || '';
        if (msg.includes('404') && msg.includes('latest.yml')) {
            updateSplash('Обновлений нет', 'Запуск...', 50);
        } else if (msg.includes('net::ERR_INTERNET_DISCONNECTED') || msg.includes('ERR_CONNECTION_')) {
            updateSplash('Нет сети', 'Автономный режим...', 50);
        } else {
            updateSplash('Ошибка проверки', 'Запуск...', 100);
        }
        setTimeout(checkContentAndLaunch, 1500);
    });

    autoUpdater.on('download-progress', (p) => {
        const speed = (p.bytesPerSecond / 1024 / 1024).toFixed(1);
        updateSplash('Загрузка обновления', `${Math.round(p.percent)}% (${speed} MB/s)`, p.percent);
    });

    autoUpdater.on('update-downloaded', () => {
        updateSplash('Установка...', 'Перезапуск приложения', 100);
        setTimeout(() => {
            autoUpdater.quitAndInstall(true, true);
        }, 1500);
    });

    try {
        const updatePromise = autoUpdater.checkForUpdates();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), 15000)
        );
        await Promise.race([updatePromise, timeoutPromise]);
    } catch (e) {
        const msg = e.message || '';
        if (msg === 'TIMEOUT') {
            updateSplash('Долгое ожидание', 'Запуск приложения...', 100);
            setTimeout(checkContentAndLaunch, 800);
        } else if (msg.includes('404') && msg.includes('latest.yml')) {
            updateSplash('Обновлений нет', 'Запуск...', 100);
            setTimeout(checkContentAndLaunch, 800);
        } else {
            updateSplash('Пропуск обновления', 'Запуск...', 100);
            setTimeout(checkContentAndLaunch, 800);
        }
    }
}

async function checkContentAndLaunch() {
    if (isAppLaunched || isCheckingContent) return;
    isCheckingContent = true;

    try {
        await themes.checkAndSyncThemes((s, d, p) => updateSplash(s, d, p));
    } catch (e) {}
    launchApp();
}

function launchApp() {
    if (isAppLaunched) return;
    isAppLaunched = true;

    updateSplash('Запуск', 'Загрузка интерфейса...', 100);

    discord.init();

    createMainWindow();
    const mainWin = getMainWindow();

    if (mainWin) {
        updateAppIcon();
        mainWin.on('focus', () => mainWin && !mainWin.isDestroyed() && mainWin.webContents.send('window-focus-state', { isFocused: true }));
        mainWin.on('blur', () => mainWin && !mainWin.isDestroyed() && mainWin.webContents.send('window-focus-state', { isFocused: false }));
        mainWin.once('ready-to-show', () => {
            if (startupUrl) {
                handleUrl(mainWin, startupUrl);
                startupUrl = null;
            }
            setTimeout(() => {
                if (mainWin && !mainWin.isDestroyed()) mainWin.show();
                if (splashWindow && !splashWindow.isDestroyed()) splashWindow.destroy();
            }, 800);
        });
    }
}

if (process.defaultApp) {
    if (process.argv.length >= 2) app.setAsDefaultProtocolClient('etc-app', process.execPath, [path.resolve(process.argv[1])]);
} else {
    app.setAsDefaultProtocolClient('etc-app');
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine) => {
        const mw = getMainWindow();
        if (mw) {
            if (mw.isMinimized()) mw.restore();
            mw.focus();
            const urlStr = commandLine.find(arg => arg.startsWith('etc-app://'));
            if (urlStr) {
                handleUrl(mw, urlStr);
            }
        }
    });
}

app.whenReady().then(async () => {
    registerHandlers();
    if (process.platform === 'win32' || process.platform === 'linux') {
        const urlStr = process.argv.find(arg => arg.startsWith('etc-app://'));
        if (urlStr) {
            startupUrl = urlStr;
        }
    }

    protocol.handle('font', (request) => {
        try {
            let fontName = request.url.slice('font://'.length);
            if (fontName.endsWith('/')) fontName = fontName.slice(0, -1);
            fontName = decodeURIComponent(fontName);
            const fontsDir = path.join(app.getPath('userData'), 'fonts');
            const fileUrl = pathToFileURL(path.join(fontsDir, fontName)).toString();
            return net.fetch(fileUrl);
        } catch (error) { return new Response('Error', { status: 500 }); }
    });

    const sendMediaControl = (command) => {
        const win = getMainWindow();
        if (win && !win.isDestroyed()) win.webContents.send('media-control', command);
    };

    globalShortcut.register('MediaPlayPause', () => sendMediaControl('play-pause'));
    globalShortcut.register('MediaNextTrack', () => sendMediaControl('next'));
    globalShortcut.register('MediaPreviousTrack', () => sendMediaControl('prev'));

    const filter = { urls: ['https://xn--d1ah4a.com/*', 'https://*.xn--d1ah4a.com/*'] };
    session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
        const headers = details.requestHeaders;
        headers['Origin'] = 'https://xn--d1ah4a.com';
        headers['Referer'] = 'https://xn--d1ah4a.com/';
        headers['Authority'] = 'xn--d1ah4a.com';
        headers['User-Agent'] = USER_AGENT;
        delete headers['Electron'];
        callback({ requestHeaders: headers });
    });

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        const policy = "default-src * 'unsafe-inline' 'unsafe-eval' data: blob: font: file:; script-src * 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src * 'unsafe-inline' data: blob: font: font://* file:; style-src * 'unsafe-inline' font:; font-src * 'unsafe-inline' data: blob: font: font://*; frame-src * 'unsafe-inline' data: blob:; img-src * 'unsafe-inline' data: blob: file:; media-src * 'unsafe-inline' data: blob: file:;";
        callback({ responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': [policy] } });
    });

    createSplash();
});

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());

module.exports = { createMainWindow, getMainWindow, createSplash };