const { ipcMain, shell, app } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const ffmpeg = require('fluent-ffmpeg');

const auth = require('./auth');
const network = require('./network');
const store = require('./store');
const { logDebug } = require('./logger');
const { getMainWindow } = require('./window');
const themes = require('./themes');
const { API_BASE, SITE_DOMAIN, USER_AGENT } = require('./config');

async function withTempFiles(inputData, extension, callback) {
    
    const tempDir = app.getPath('temp');
    const uniqueId = `etc-app-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const tempInputPath = path.join(tempDir, `${uniqueId}.${extension}`);
    const tempOutputPath = path.join(tempDir, `${uniqueId}_out`);

    try {
        await fs.writeFile(tempInputPath, inputData);
        const resultPath = await callback(tempInputPath, tempOutputPath);
        const outputData = await fs.readFile(resultPath);
        return { success: true, data: outputData };
    } catch (error) {
        logDebug(`[FFMPEG-HELPER] Error: ${error.message}`);
        console.error(error);
        return { success: false, error: error.message };
    } finally {
        await fs.unlink(tempInputPath).catch(() => {});
        await fs.unlink(tempOutputPath).catch(() => {}); 
        await fs.unlink(tempOutputPath + '.mp3').catch(() => {});
        await fs.unlink(tempOutputPath + '.mp4').catch(() => {});
    }
}

function registerHandlers() {
    ipcMain.handle('app:get-version', () => app.getVersion());

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
            
            network.startStreamConnection(); 
            return profileResponse.user; 
        } else {
            return null;
        }
    });

    ipcMain.handle('login-with-token', async (e, t) => {
        logDebug("Ручной вход по токену...");
        store.saveRefreshToken(t);
        const r = await network.refreshSession();
        if (r.success) {
            const profileResponse = await network.apiCall('/profile');
            if (profileResponse && profileResponse.user && profileResponse.user.id) {
                
                network.startStreamConnection();
                return { success: true, user: profileResponse.user };
            }
            return { success: false, error: "Failed to fetch profile" };
        }
        return { success: false };
    });

    ipcMain.handle('api-call', (e, a) => network.apiCall(a.endpoint, a.method, a.body));
    ipcMain.handle('open-external-link', (e, u) => shell.openExternal(u));
    
    ipcMain.handle('download-file', (e, { url }) => {
        const win = getMainWindow();
        if(win) win.webContents.downloadURL(url);
    });
    
    ipcMain.handle('app:quick-check', async () => network.quickInternetCheck());
    ipcMain.handle('app:diagnostics', async () => network.runDetailedDiagnostics());
    ipcMain.handle('app:check-connectivity', async () => {
        const res = await network.runDetailedDiagnostics();
        return res.filter(r => r.name !== 'API Сервер' && r.status === 'ok').length;
    });

    
    ipcMain.handle('presence:start', () => {
        network.startStreamConnection();
        return true;
    });

    ipcMain.handle('presence:stop', () => {
        network.stopStreamConnection();
        return true;
    });
    

    ipcMain.handle('compress-audio', async (event, { data, name }) => {
        
        logDebug(`[IPC] Запрос на сжатие аудио: ${name}`);
        const extension = path.extname(name) || '.tmp';
        const result = await withTempFiles(data, extension, (inputPath, outputPath) => {
            const finalPath = outputPath + '.mp3';
            return new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .audioCodec('libmp3lame')
                    .audioBitrate('128k')
                    .toFormat('mp3')
                    .on('error', (err) => reject(err))
                    .on('end', () => resolve(finalPath))
                    .save(finalPath);
            });
        });

        if (result.success) {
            const newName = path.basename(name, path.extname(name)) + '.mp3';
            return { data: result.data, name: newName };
        }
        return { error: result.error, data: null, name };
    });
    
    ipcMain.handle('compress-video', async (event, { data, name, useGpu }) => {
        
        logDebug(`[IPC] Запрос на сжатие видео: ${name}`);
        const extension = path.extname(name) || '.tmp';
        const result = await withTempFiles(data, extension, (inputPath, outputPath) => {
             const finalPath = outputPath + '.mp4';
            return new Promise((resolve, reject) => {
                const command = ffmpeg(inputPath)
                    .videoCodec('libx264')
                    .audioCodec('aac')
                    .outputOptions(['-pix_fmt yuv420p', '-crf 28', '-preset medium', '-movflags +faststart'])
                    .videoFilters('scale=w=-2:h=720:force_original_aspect_ratio=decrease')
                    .toFormat('mp4')
                    .on('error', (err) => reject(err))
                    .on('end', () => resolve(finalPath));
                command.save(finalPath);
            });
        });

        if (result.success) {
            const newName = path.basename(name, path.extname(name)) + '.mp4';
            return { data: result.data, name: newName };
        }
        return { error: result.error, data: null, name };
    });

    ipcMain.handle('upload-file', async (e, { fileBuffer, fileName, fileType }) => {
        
        const blob = new Blob([Buffer.from(fileBuffer)], { type: fileType });
        const formData = new FormData();
        formData.append('file', blob, fileName);

        const accessToken = store.getAccessToken();
        const headers = {
             'Origin': SITE_DOMAIN,
             'Referer': SITE_DOMAIN + '/',
             'User-Agent': USER_AGENT,
        };
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }
        
        try {
            const response = await fetch(`${API_BASE}/files/upload`, {
                method: 'POST',
                headers: headers,
                body: formData
            });
            const data = await response.json();
            if (!response.ok) return { error: data.error || { message: data.message } };
            return { data: data };
        } catch (err) {
            return { error: { message: err.message } };
        }
    });

    ipcMain.handle('app:check-api-status', async () => network.checkApiStatus());
    
    
    ipcMain.handle('themes:fetch-remote', () => themes.fetchRemoteList());
    ipcMain.handle('themes:get-local', () => themes.getLocalList());
    ipcMain.handle('themes:download', (e, theme) => themes.downloadTheme(theme));
    ipcMain.handle('themes:delete', (e, filename) => themes.deleteTheme(filename));
    ipcMain.handle('themes:read-content', (e, filename) => themes.readThemeContent(filename));
    ipcMain.handle('themes:get-details', (e, folderName) => themes.readThemeContent(folderName));
}

module.exports = { registerHandlers };