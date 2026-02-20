/* @source electron/ipc.js */
const { ipcMain, shell, app, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const ffmpeg = require('fluent-ffmpeg');
const jsmediatags = require('jsmediatags');
const crypto = require('crypto');
const discord = require('./discord');


const network = require('./network');
const { switchUserSession } = require('./network');
const store = require('./store');
const { logDebug, getLogDump } = require('./logger');
const { LOG_DIR_PATH, LOG_FILE_PATH } = require('./logger');
const { getMainWindow } = require('./window');
const themes = require('./themes');
const { API_BASE, USER_AGENT, PATHS} = require('./config');
const fonts = require('./fonts');


/**
 * Расшифровывает данные, экспортированные из Cookie-Editor с паролем.
 * @param {string} encryptedBase64 - Строка Base64 из файла cookies.json.
 * @param {string} password - Пароль (ожидается "123").
 * @returns {string|null} Расшифрованная JSON-строка или null в случае ошибки.
 */
function decryptCookieEditorData(encryptedBase64, password) {
    try {
        const rawData = Buffer.from(encryptedBase64, 'base64');
        const iv = rawData.subarray(0, 12);
        const authTag = rawData.subarray(rawData.length - 16);
        const encrypted = rawData.subarray(12, rawData.length - 16);
        const salt = password + password; 
        const key = crypto.pbkdf2Sync(password, salt, 1024, 32, 'sha256');
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, null, 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        console.error("[Decrypt GCM] Ошибка:", e.message);
        return null;
    }
}



async function loginWithRefreshToken(refreshTokenStr) {
    if (!refreshTokenStr || refreshTokenStr.length < 10) {
        return { success: false, error: "Некорректный токен" };
    }

    
    const cookies = [{
        name: 'refresh_token',
        value: refreshTokenStr.trim(),
        domain: '.xn--d1ah4a.com', 
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
        expirationDate: (Date.now() / 1000) + 31536000 
    }];

    
    const sessionData = { 
        cookies, 
        localStorage: {}, 
        userAgent: USER_AGENT, 
        url: `${API_BASE}/feed` 
    };

    return await finalizeLoginFlow(sessionData);
}

/**
 * Ключевая функция для завершения процесса входа.
 * Применяет сессию, получает профиль пользователя для его ID и сохраняет аккаунт.
 * @param {object} sessionData - Объект сессии { cookies, userAgent, ... }.
 * @returns {Promise<object>} Результат: { success: boolean, user?: object, error?: string }.
 */
async function finalizeLoginFlow(sessionData) {
    try {
        
        await network.applyCookiesToSession(sessionData.cookies);
        
        if (sessionData.userAgent) {
            require('electron').session.defaultSession.setUserAgent(sessionData.userAgent);
        }

        await new Promise(r => setTimeout(r, 500));  
        
        
        const refreshRes = await network.rawFetch('/v1/auth/refresh', { method: 'POST' });
        
        if (refreshRes.ok && refreshRes.data.accessToken) {
            network.setGlobalAccessToken(refreshRes.data.accessToken);
            
            const profileRes = await network.apiCall('/profile');
            
            if (profileRes?.user?.id) {
                
                
                const freshCookies = await require('electron').session.defaultSession.cookies.get({ domain: 'xn--d1ah4a.com' });
                
                
                store.addAccount(profileRes.user, {
                    ...sessionData,
                    cookies: freshCookies
                });
                
                return { success: true, user: profileRes.user };
            }
        }
        return { success: false, error: "Не удалось верифицировать сессию" };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/**
 * Обертка для работы с временными файлами для FFMPEG.
 */
async function withTempFiles(inputData, extension, callback) {
    const tempDir = app.getPath('temp');
    const uniqueId = `itd-${Date.now()}`;
    const tempInputPath = path.join(tempDir, `${uniqueId}.${extension}`);
    const tempOutputPath = path.join(tempDir, `${uniqueId}_out`);
    try {
        await fs.writeFile(tempInputPath, inputData);
        const resultPath = await callback(tempInputPath, tempOutputPath);
        const outputData = await fs.readFile(resultPath);
        return { success: true, data: outputData };
    } catch (error) {
        console.error(`[FFMPEG-ERROR] ${error.message}`);
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

    
    
    ipcMain.handle('get-init-user', async () => {
        logDebug("[IPC] get-init-user: Проверка активной сессии...");
        const refreshResult = await network.refreshSession();
        
        if (!refreshResult.success) {
            logDebug(`[IPC] Сессия невалидна: ${refreshResult.reason}`);
            if (refreshResult.reason === 'network_error') return { error: { code: 'NETWORK_ERROR' } };
            return null;
        }

        logDebug("[IPC] Сессия активна, запрос профиля...");
        const res = await network.apiCall('/profile');
        
        if (res?.user?.id) {
            logDebug(`[IPC] Профиль получен: ${res.user.username}`);
            
            store.addAccount(res.user, store.loadSessionData());
            network.startStreamConnection();
            return res.user;
        }
        
        return null;
    });
    
    ipcMain.handle('auth:get-accounts', () => store.getAccountsList());

    ipcMain.handle('auth:switch-account', async (e, userId) => {
        logDebug(`[IPC] Переключение на аккаунт ${userId}`);
        const targetAccount = store.getAccountById(userId);
        if (!targetAccount) return { success: false, error: "Account not found" };
        store.setActiveId(userId);
        const sessionResult = await switchUserSession(targetAccount);
        return { success: true, warning: sessionResult.warning };
    });

    ipcMain.handle('auth:remove-account', async (e, userId) => {
        logDebug(`[IPC] Удаление аккаунта ${userId}`);
        const currentActive = store.getActiveAccount();
        const removingCurrent = currentActive && currentActive.user.id === userId;
        
        store.removeAccount(userId);
        
        if (removingCurrent) {
            
            const newActive = store.getActiveAccount();
            const win = getMainWindow();
            
            if (newActive) {
                await switchUserSession(newActive);
                if (win) win.reload();
            } else {
                
                await require('electron').session.defaultSession.clearStorageData();
                if (win) win.reload();
            }
        }
        return { success: true };
    });

    ipcMain.handle('auth:token-login', async (e, token) => {
        try {
            const result = await loginWithRefreshToken(token);
            if (result.success) {
                const win = getMainWindow();
                if (win) win.reload();
            }
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('auth:manual-import', async (event, jsonString) => {
        try {
            let cookies;
            const importData = JSON.parse(jsonString);

            if (importData?.data && typeof importData.data === 'string') {
                const decryptedStr = decryptCookieEditorData(importData.data, "123");
                if (!decryptedStr) return { success: false, error: "Не удалось расшифровать. Убедитесь, что пароль '123'" };
                cookies = JSON.parse(decryptedStr);
            } else if (Array.isArray(importData)) {
                cookies = importData;
            } else {
                return { success: false, error: "Неизвестный формат JSON" };
            }

            if (!Array.isArray(cookies)) return { success: false, error: "Не получен массив куки" };
            
            const sessionData = { cookies, localStorage: {}, userAgent: USER_AGENT, url: `${API_BASE}/feed` };
            const result = await finalizeLoginFlow(sessionData);

            if (result.success) {
                const win = getMainWindow();
                if (win) {
                    win.reload();
                }
            }
            return result;
        } catch (error) {
            logDebug(`Manual import error: ${error.message}`);
            return { success: false, error: error.message };
        }
    });


    
    ipcMain.handle('api-call', (e, a) => network.apiCall(a.endpoint, a.method, a.body));
    ipcMain.handle('presence:start', () => network.startStreamConnection());
    ipcMain.handle('presence:stop', () => network.stopStreamConnection());
    ipcMain.handle('app:quick-check', () => network.quickInternetCheck());
    ipcMain.handle('app:check-api-status', () => network.checkApiStatus());

    
    ipcMain.handle('open-external-link', (e, u) => shell.openExternal(u));
    ipcMain.handle('download-file', (e, { url }) => getMainWindow()?.webContents.downloadURL(url));
    
    ipcMain.handle('compress-audio', async (e, { data, name }) => {
        return await withTempFiles(data, path.extname(name) || '.tmp', (ip, op) => {
            const fp = op + '.mp3';
            return new Promise((res, rej) => ffmpeg(ip).audioCodec('libmp3lame').audioBitrate('128k').toFormat('mp3').on('error', rej).on('end', () => res(fp)).save(fp));
        }).then(r => r.success ? { data: r.data, name: path.basename(name, path.extname(name)) + '.mp3' } : { error: r.error });
    });

    ipcMain.handle('compress-video', async (e, { data, name, useGpu }) => {
        return await withTempFiles(data, path.extname(name) || '.tmp', (ip, op) => {
            const fp = op + '.mp4';
            return new Promise((res, rej) => {
                let c = ffmpeg(ip);
                if (useGpu) { c.videoCodec('h264_nvenc').outputOptions(['-preset p1', '-tune hq']).on('error', () => { c = ffmpeg(ip).videoCodec('libx264').outputOptions(['-preset ultrafast', '-crf 28']); });
                } else { c.videoCodec('libx264').outputOptions(['-preset ultrafast', '-crf 28']); }
                c.audioCodec('aac').videoFilters('scale=w=-2:h=720:force_original_aspect_ratio=decrease').addOptions(['-threads 0', '-movflags +faststart', '-pix_fmt yuv420p']).on('error', rej).on('end', () => res(fp)).save(fp);
            });
        }).then(r => r.success ? { data: r.data, name: path.basename(name, path.extname(name)) + '.mp4' } : { error: r.error });
    });

    ipcMain.handle('upload-file', async (e, { fileBuffer, fileName, fileType }) => {
        try { return await network.uploadFileInternal(fileBuffer, fileName, fileType); } 
        catch (error) { return { error: { message: error.message } }; }
    });

    ipcMain.handle('upload-music-post', async (event, { uploadId, filePath, fileName, fileType }) => {
        console.log(`[MUSIC-UPLOAD] Начало процесса для ID: ${uploadId}`);
        const sendStatus = (status, error = null) => event.sender?.send('upload-progress', { id: uploadId, status, error });
        try {
            sendStatus('reading_tags');
            const tags = await new Promise((res, rej) => jsmediatags.read(filePath, { onSuccess: res, onError: (err) => rej(new Error(err.info)) }));
            const title = tags.tags.title || fileName.replace(/\.[^/.]+$/, "");
            const artist = tags.tags.artist || 'Неизвестный исполнитель';
            const album = tags.tags.album || 'Синглы';
            const b64 = (str) => Buffer.from(str).toString('base64');
            const postContent = `#nowkie_music_track [title:${b64(title)}] [artist:${b64(artist)}] [album:${b64(album)}]`;
            
            sendStatus('uploading_audio');
            const audioRes = await network.uploadFileInternal(await fs.readFile(filePath), fileName, fileType);
            if (audioRes.error) throw new Error(audioRes.error.message);
            
            const attachmentIds = [audioRes.data.id];
            if (tags.tags.picture) {
                try {
                    sendStatus('uploading_cover');
                    const coverRes = await network.uploadFileInternal(Buffer.from(tags.tags.picture.data), 'cover.jpg', tags.tags.picture.format);
                    if (!coverRes.error) attachmentIds.push(coverRes.data.id);
                } catch (coverErr) { console.warn("Не удалось загрузить обложку:", coverErr.message); }
            }
            
            sendStatus('creating_post');
            const postRes = await network.apiCall('/posts', 'POST', { content: postContent, attachmentIds });
            if (postRes.error) throw new Error(postRes.error.message);
            
            sendStatus('complete');
            return { success: true };
        } catch (err) {
            console.error(`[MUSIC-UPLOAD] ОШИБКА для ${uploadId}:`, err.message);
            sendStatus('error', err.message);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('app:inspect-element', (e, { x, y }) => {
        const win = getMainWindow();
        if (win && !win.isDestroyed()) {
            win.webContents.inspectElement(Math.round(x), Math.round(y));
            if (!win.webContents.isDevToolsOpened()) {
                win.webContents.openDevTools();
            }
        }
    });

    ipcMain.handle('utils:fetch-base64', async (e, url) => {
        try {
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Fetch failed');
            
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString('base64');
            const mime = response.headers.get('content-type') || 'image/jpeg';
            
            return `data:${mime};base64,${base64}`;
        } catch (err) {
            console.error('[IPC] Fetch Base64 error:', err.message);
            return null;
        }
    });

    ipcMain.handle('app:dump-logs', async () => {
        try {
            const logs = getLogDump();
            const fullPath = path.join(app.getPath('desktop'), '!etc.app.log');
            await fs.writeFile(fullPath, logs, 'utf-8');
            shell.showItemInFolder(fullPath);
            return { success: true, path: fullPath };
        } catch (error) { return { success: false, error: error.message }; }
    });

    
    ipcMain.handle('fonts:get-remote', () => fonts.fetchRemoteFonts());
    ipcMain.handle('fonts:get-local', () => fonts.getLocalFonts());
    ipcMain.handle('fonts:download', async (e, font) => {
        try {
            return await fonts.downloadFont(font);
        } catch (err) {
            console.error("[IPC] fonts:download error:", err);
            return { success: false, error: err.message };
        }
    });
    ipcMain.handle('app:upload-wallpaper', async () => {
        try {
            
            const result = await dialog.showOpenDialog(getMainWindow(), {
                properties: ['openFile'],
                filters: [
                    { name: 'Медиа', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm'] }
                ]
            });

            if (result.canceled || !result.filePaths[0]) {
                return { success: false, reason: 'cancelled' };
            }

            const sourcePath = result.filePaths[0];
            const fileName = path.basename(sourcePath);
            const wallpapersDir = PATHS.WALLPAPERS;

            
            if (!require('fs').existsSync(wallpapersDir)) {
                await fs.mkdir(wallpapersDir, { recursive: true });
            }

            
            const uniqueFileName = `${Date.now()}-${fileName}`;
            const destPath = path.join(wallpapersDir, uniqueFileName);

            
            await fs.copyFile(sourcePath, destPath);

            
            const fileUrl = require('url').pathToFileURL(destPath).href;

            return { success: true, url: fileUrl, type: fileName.endsWith('.mp4') || fileName.endsWith('.webm') ? 'video' : 'image' };

        } catch (error) {
            console.error('[IPC] Wallpaper upload error:', error);
            return { success: false, error: error.message };
        }
    });
    ipcMain.handle('fonts:delete', (e, { id, format }) => fonts.deleteFont(id, format));
    
    
    ipcMain.handle('fonts:get-path', () => fonts.FONTS_DIR);

    ipcMain.handle('app:dump-logs-zip', async () => {
        try {
            const fsSync = require('fs');
            const { spawn } = require('child_process');
            const desktopPath = app.getPath('desktop');
            const tempDir = app.getPath('temp');
            const stagingName = `itd_logs_${Date.now()}`;
            const stagingPath = path.join(tempDir, stagingName);
            fsSync.mkdirSync(stagingPath);

            if (fsSync.existsSync(LOG_FILE_PATH)) fsSync.copyFileSync(LOG_FILE_PATH, path.join(stagingPath, 'electron_debug.log'));
            if (fsSync.existsSync(path.join(LOG_DIR_PATH, 'itd_auth_debug.log'))) fsSync.copyFileSync(path.join(LOG_DIR_PATH, 'itd_auth_debug.log'), path.join(stagingPath, 'python_auth.log'));
            
            const zipDestPath = path.join(desktopPath, `itd_logs_${Date.now()}.zip`);
            const psCommand = `Compress-Archive -Path "${stagingPath}\\*" -DestinationPath "${zipDestPath}" -Force`;

            return new Promise((resolve) => {
                const child = spawn('powershell.exe', ['-NoProfile', '-Command', psCommand]);
                child.on('close', (code) => {
                    try { fsSync.rmSync(stagingPath, { recursive: true, force: true }); } catch(e){}
                    if (code === 0) {
                        shell.showItemInFolder(zipDestPath);
                        resolve({ success: true, path: zipDestPath });
                    } else {
                        resolve({ success: false, error: "Archiving failed" });
                    }
                });
            });
        } catch (error) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('fs:open-path', async (e, fullPath) => {
        const { shell } = require('electron');
        return await shell.openPath(fullPath);
    });

    ipcMain.handle('fs:show-in-folder', async (e, fullPath) => {
        const { shell } = require('electron');
        shell.showItemInFolder(fullPath);
    });
    
    ipcMain.handle('discord:set-activity', (e, activity) => discord.setActivity(activity));
    ipcMain.handle('discord:clear', () => discord.clearActivity());
    
    ipcMain.handle('themes:fetch-remote', () => themes.fetchRemoteList());
    ipcMain.handle('themes:get-local', () => themes.getLocalList());
    ipcMain.handle('themes:download', (e, t) => themes.downloadTheme(t));
    ipcMain.handle('themes:delete', (e, f) => themes.deleteTheme(f));
    ipcMain.handle('themes:read-content', (e, f) => themes.readThemeContent(f));
}

module.exports = { registerHandlers, finalizeLoginFlow };