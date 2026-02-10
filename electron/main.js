const { app, BrowserWindow, ipcMain, shell, session, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');

app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors,SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure');
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');
app.commandLine.appendSwitch('ignore-certificate-errors');

const SITE_DOMAIN = 'https://xn--d1ah4a.com';
const API_BASE = `${SITE_DOMAIN}/api`;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';
const STORE_PATH = path.join(app.getPath('userData'), 'session.secure');

let mainWindow = null;
let authWindow = null;
let accessToken = null;
let refreshToken = null;

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

function saveRefreshToken(token) {
    if (!token) return;
    try {
        const encrypted = safeStorage.isEncryptionAvailable() 
            ? safeStorage.encryptString(token) 
            : Buffer.from(token).toString('base64');
        fs.writeFileSync(STORE_PATH, encrypted);
        refreshToken = token;
    } catch (e) {}
}

function loadRefreshToken() {
    try {
        if (fs.existsSync(STORE_PATH)) {
            const fileData = fs.readFileSync(STORE_PATH);
            refreshToken = safeStorage.isEncryptionAvailable()
                ? safeStorage.decryptString(fileData)
                : Buffer.from(fileData.toString(), 'base64').toString('utf-8');
            return refreshToken;
        }
    } catch (e) {}
    return null;
}

function clearRefreshToken() {
    try {
        if (fs.existsSync(STORE_PATH)) fs.unlinkSync(STORE_PATH);
    } catch (e) {}
    refreshToken = null; 
    accessToken = null;
    session.defaultSession.clearStorageData();
}

async function rawFetch(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    
    const headers = { 
        'Origin': SITE_DOMAIN, 
        'Referer': SITE_DOMAIN + '/',
        'Accept': 'application/json',
        'User-Agent': USER_AGENT,
        'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        ...options.headers 
    };

    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }
    
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    try {
        const response = await fetch(url, { ...options, headers });
        if (response.status === 204) return { ok: true, data: { success: true } };
        const data = await response.json().catch(() => ({}));
        return { ok: response.ok, status: response.status, data, headers: response.headers };
    } catch (e) {
        return { ok: false, status: 0, error: e.message };
    }
}

async function refreshSession() {
    const token = loadRefreshToken();
    if (!token) return { success: false };

    const res = await rawFetch('/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `refresh_token=${token}` },
        body: JSON.stringify({ refreshToken: token })
    });

    if (res.ok && res.data?.accessToken) {
        accessToken = res.data.accessToken;
        const setCookie = res.headers.get('set-cookie');
        const newToken = setCookie?.match(/refresh_token=([^;]+)/)?.[1] || res.data.refreshToken;
        if (newToken) saveRefreshToken(newToken);
        return { success: true };
    }
    return { success: false };
}

async function apiCall(endpoint, method = 'GET', body = null) {
    if (endpoint.includes('/logout')) {
        await rawFetch(endpoint, { method: 'POST' });
        clearRefreshToken();
        return { success: true };
    }

    let options = { method };

    if (endpoint === '/files/upload' && body && body.file) {
        const formData = new FormData();
        const blob = new Blob([body.file.data], { type: body.file.type });
        formData.append('file', blob, body.file.name);
        options.body = formData;
    } else if (body) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
    }

    let res = await rawFetch(endpoint, options);
    
    if (res.status === 401 && endpoint !== '/v1/auth/refresh') {
        const refreshed = await refreshSession();
        if (refreshed.success) {
            res = await rawFetch(endpoint, options);
        } else {
            clearRefreshToken();
            return { error: { message: 'Session expired', code: 'UNAUTHORIZED' } };
        }
    }
    
    return res.data || { error: { message: res.error || 'Server error', status: res.status } };
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1250, height: 900, 
        backgroundColor: '#101214', 
        frame: false,
        show: false,
        icon: path.join(__dirname, '../public/favicon.ico'), 
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http')) shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (!url.startsWith('http://localhost') && !url.startsWith('file://')) {
            event.preventDefault();
        }
    });

    session.defaultSession.on('will-download', (event, item, webContents) => {
        item.setSavePath(''); 
    });

    ipcMain.on('window-minimize', () => mainWindow.minimize());
    ipcMain.on('window-maximize', () => mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
    ipcMain.on('window-close', () => mainWindow.close());
    
    if (app.isPackaged) {
        mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
    } else {
        mainWindow.loadURL('http://localhost:3000');
    }

    mainWindow.once('ready-to-show', () => mainWindow.show());
}

async function openAuthWindow() {
    if (authWindow) { authWindow.focus(); return; }

    await session.defaultSession.clearStorageData({ storages: ['cookies', 'localstorage', 'cache'] });

    authWindow = new BrowserWindow({
        width: 550, height: 750,
        parent: mainWindow, modal: true, title: 'Auth',
        autoHideMenuBar: true,
        backgroundColor: '#101214',
        resizable: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            disableBlinkFeatures: 'AutomationControlled', 
            preload: path.join(__dirname, 'stealth.js') 
        }
    });

    authWindow.webContents.setUserAgent(USER_AGENT);

    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        const isTarget = details.url.includes('xn--d1ah4a.com') || details.url.includes('cloudflare');
        if (isTarget) {
            details.requestHeaders['User-Agent'] = USER_AGENT;
            details.requestHeaders['sec-ch-ua'] = '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"';
            details.requestHeaders['sec-ch-ua-mobile'] = '?0';
            details.requestHeaders['sec-ch-ua-platform'] = '"Windows"';
            delete details.requestHeaders['Sec-CH-UA']; 
        }
        callback({ cancel: false, requestHeaders: details.requestHeaders });
    });

    authWindow.loadURL(`${SITE_DOMAIN}/login`);

    const checkTimer = setInterval(async () => {
        if (!authWindow || authWindow.isDestroyed()) {
            clearInterval(checkTimer);
            return;
        }
        try {
            const cookies = await session.defaultSession.cookies.get({ domain: 'xn--d1ah4a.com' });
            const refreshCookie = cookies.find(c => c.name === 'refresh_token');
            const accessCookie = cookies.find(c => c.name === 'access_token');

            if (refreshCookie) {
                saveRefreshToken(refreshCookie.value);
                if (accessCookie) accessToken = accessCookie.value;

                clearInterval(checkTimer);
                authWindow.close();
                authWindow = null;
                if (mainWindow) mainWindow.reload();
            }
        } catch (e) {}
    }, 1000);

    authWindow.on('closed', () => {
        authWindow = null;
        clearInterval(checkTimer);
    });
}

ipcMain.handle('open-auth', () => { openAuthWindow(); return null; });

ipcMain.handle('get-init-user', async () => {
    const token = loadRefreshToken();
    if (!token) return null;
    const refresh = await refreshSession();
    if (!refresh.success) {
        clearRefreshToken();
        return null;
    }
    const res = await apiCall('/profile');
    return res.user || res.data?.user || null;
});

ipcMain.handle('api-call', (e, args) => apiCall(args.endpoint, args.method, args.body));

ipcMain.handle('open-external-link', (event, url) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        shell.openExternal(url);
    }
});

ipcMain.handle('download-file', async (event, { url }) => {
    if (!url || !mainWindow) return;
    mainWindow.webContents.downloadURL(url);
});

app.whenReady().then(createMainWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });