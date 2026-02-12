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
    const uniqueId = `itd-app-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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
    }
}

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
                    .on('error', (err) => {
                        logDebug(`[FFMPEG-AUDIO] Ошибка: ${err.message}`);
                        reject(err);
                    })
                    .on('end', () => {
                        logDebug(`[FFMPEG-AUDIO] Сжатие завершено для ${name}`);
                        resolve(finalPath);
                    })
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
        logDebug(`[IPC] Запрос на сжатие видео: ${name} (useGpu: ${useGpu})`);
        const extension = path.extname(name) || '.tmp';
        const result = await withTempFiles(data, extension, (inputPath, outputPath) => {
             const finalPath = outputPath + '.mp4';
            return new Promise((resolve, reject) => {
                const command = ffmpeg(inputPath)
                    .videoCodec('libx264')
                    .audioCodec('aac')
                    .outputOptions([
                        '-pix_fmt yuv420p',
                        '-crf 28',
                        '-preset medium',
                        '-movflags +faststart'
                    ])
                    .videoFilters('scale=w=-2:h=720:force_original_aspect_ratio=decrease')
                    .toFormat('mp4')
                    .on('error', (err) => {
                        logDebug(`[FFMPEG-VIDEO] Ошибка: ${err.message}`);
                        reject(err);
                    })
                    .on('end', () => {
                        logDebug(`[FFMPEG-VIDEO] Сжатие завершено для ${name}`);
                        resolve(finalPath);
                    });

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
        logDebug(`[IPC-UPLOAD] Загрузка файла: ${fileName}`);
        
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

            if (!response.ok) {
                 return { error: data.error || { message: data.message || `Ошибка загрузки (${response.status})` } };
            }
            return { data: data };
        } catch (err) {
            logDebug(`[IPC-UPLOAD] Ошибка сети: ${err.message}`);
            return { error: { message: err.message || 'Ошибка сети при загрузке' } };
        }
    });


    ipcMain.handle('themes:fetch-remote', () => themes.fetchRemoteList());
    ipcMain.handle('themes:get-local', () => themes.getLocalList());
    ipcMain.handle('themes:download', (e, theme) => themes.downloadTheme(theme));
    ipcMain.handle('themes:delete', (e, filename) => themes.deleteTheme(filename));
    ipcMain.handle('themes:read-content', (e, filename) => themes.readThemeContent(filename));

}

module.exports = { registerHandlers };