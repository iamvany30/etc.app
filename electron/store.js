const fs = require('fs');
const { safeStorage, session } = require('electron');
const { PATHS } = require('./config');
const { logDebug } = require('./logger');

 
let state = {
    accessToken: null,
    refreshToken: null,
    refreshTokenFailureCount: 0
};

function saveRefreshToken(token) {
    if (!token) return;
    try {
        logDebug(`Сохранение токена на диск... (Длина: ${token.length})`);
        const encrypted = safeStorage.isEncryptionAvailable() 
            ? safeStorage.encryptString(token) 
            : Buffer.from(token).toString('base64');
        fs.writeFileSync(PATHS.STORE, encrypted);
        
        state.refreshToken = token;
        state.refreshTokenFailureCount = 0;
        logDebug("Токен успешно записан в файл session.secure");
    } catch (e) { console.error("Save error:", e); }
}

function loadRefreshToken() {
    try {
        if (fs.existsSync(PATHS.STORE)) {
            const fileData = fs.readFileSync(PATHS.STORE);
            state.refreshToken = safeStorage.isEncryptionAvailable()
                ? safeStorage.decryptString(fileData)
                : Buffer.from(fileData.toString(), 'base64').toString('utf-8');
            logDebug(`Загружен токен с диска (Длина: ${state.refreshToken.length})`);
            return state.refreshToken;
        }
    } catch (e) { console.error("Load error:", e); }
    logDebug("Токен на диске не найден");
    return null;
}

function clearRefreshToken() {
    try { if (fs.existsSync(PATHS.STORE)) fs.unlinkSync(PATHS.STORE); } catch (e) {}
    state.refreshToken = null; 
    state.accessToken = null;
    session.defaultSession.clearStorageData();
    logDebug("Сессия очищена (Logout)");
}

 
module.exports = {
    saveRefreshToken,
    loadRefreshToken,
    clearRefreshToken,
    getAccessToken: () => state.accessToken,
    setAccessToken: (token) => { state.accessToken = token; },
    getRefreshToken: () => state.refreshToken,
    getFailureCount: () => state.refreshTokenFailureCount,
    incrementFailureCount: () => { state.refreshTokenFailureCount++; },
    resetFailureCount: () => { state.refreshTokenFailureCount = 0; }
};