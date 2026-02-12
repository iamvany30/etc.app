const { ipcMain, shell } = require('electron');
const auth = require('./auth');
const network = require('./network');
const store = require('./store');
const { logDebug } = require('./logger');
const { getMainWindow } = require('./window');

 
const ffmpeg = require('fluent-ffmpeg');  
const themes = require('./themes');

function registerHandlers() {
     
    ipcMain.handle('open-stealth-login', async (event) => {
        return auth.handleStealthLogin(event);
    });

     
    ipcMain.handle('auto-grab-token', async () => {
        return { success: false };
    });

    ipcMain.handle('get-init-user', async () => {
        logDebug(">>> ЗАПРОС: get-init-user (Кто я?)");
        
        const token = store.loadRefreshToken();
        if (!token) {
            logDebug("Нет токена при старте.");
            return null;
        }

        const ref = await network.refreshSession();
        if (!ref.success) {
            logDebug("Не удалось обновить сессию при старте.");
            if (ref.reason === 'network_error') return { error: { code: 'NETWORK_ERROR' } };
            return null;
        }

        logDebug("Сессия жива. Запрашиваю /profile...");
        const profileResponse = await network.apiCall('/profile');
        
        if (profileResponse && profileResponse.user && profileResponse.user.id) {
            logDebug(`Профиль получен: ${profileResponse.user.username}`);
            return profileResponse.user; 
        } else {
            logDebug("!!! ОШИБКА: /profile вернул неожиданную структуру:", profileResponse);
            return null;
        }
    });

    ipcMain.handle('login-with-token', async (e, t) => {
        logDebug("Ручной вход по токену...");
        store.saveRefreshToken(t);
        const r = await network.refreshSession();
        logDebug(`Результат ручного входа: ${r.success}`);
        return { success: r.success };
    });

     
    ipcMain.handle('api-call', (e, a) => network.apiCall(a.endpoint, a.method, a.body));
    
     
    ipcMain.handle('open-external-link', (e, u) => shell.openExternal(u));
    
    ipcMain.handle('download-file', (e, { url }) => {
        const win = getMainWindow();
        if(win) win.webContents.downloadURL(url);
    });

     
     
     
     
    
    ipcMain.handle('compress-audio', async (event, fileData) => {
         
         
        return fileData; 
    });
    
    ipcMain.handle('compress-video', async (event, fileData) => {
        return fileData;
    });
    ipcMain.handle('themes:fetch-remote', () => themes.fetchRemoteList());
    ipcMain.handle('themes:get-local', () => themes.getLocalList());
    ipcMain.handle('themes:download', (e, theme) => themes.downloadTheme(theme));
    ipcMain.handle('themes:delete', (e, filename) => themes.deleteTheme(filename));
    ipcMain.handle('themes:read-content', (e, filename) => themes.readThemeContent(filename));

}

module.exports = { registerHandlers };