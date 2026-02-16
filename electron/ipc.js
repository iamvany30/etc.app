const { ipcMain, shell, app } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const ffmpeg = require('fluent-ffmpeg');
const jsmediatags = require('jsmediatags');

const auth = require('./auth');
const network = require('./network');
const store = require('./store');
const { logDebug } = require('./logger');
const { getMainWindow } = require('./window');
const themes = require('./themes');
const { API_BASE, USER_AGENT } = require('./config');

/**
 * Вспомогательная функция для работы с временными файлами (для FFMPEG)
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

/**
 * ГЛАВНАЯ ФУНКЦИЯ РЕГИСТРАЦИИ ОБРАБОТЧИКОВ
 */
function registerHandlers() {
    
    ipcMain.handle('app:get-version', () => app.getVersion());

    ipcMain.handle('open-stealth-login', (event) => auth.handleStealthLogin(event));

    ipcMain.handle('get-init-user', async () => {
        const token = store.loadRefreshToken();
        if (!token) return null;

        const ref = await network.refreshSession();
        if (!ref.success) {
            return ref.reason === 'network_error' ? { error: { code: 'NETWORK_ERROR' } } : null;
        }

        const res = await network.apiCall('/profile');
        if (res?.user?.id) {
            network.startStreamConnection();
            return res.user;
        }
        return null;
    });

    ipcMain.handle('api-call', (e, a) => network.apiCall(a.endpoint, a.method, a.body));

    ipcMain.handle('open-external-link', (e, u) => shell.openExternal(u));
    
    ipcMain.handle('download-file', (e, { url }) => {
        const win = getMainWindow();
        if (win) win.webContents.downloadURL(url);
    });

    ipcMain.handle('presence:start', () => network.startStreamConnection());
    ipcMain.handle('presence:stop', () => network.stopStreamConnection());

    
    ipcMain.handle('compress-audio', async (e, { data, name }) => {
        return await withTempFiles(data, path.extname(name) || '.tmp', (ip, op) => {
            const fp = op + '.mp3';
            return new Promise((res, rej) => {
                ffmpeg(ip).audioCodec('libmp3lame').audioBitrate('128k').toFormat('mp3')
                    .on('error', rej).on('end', () => res(fp)).save(fp);
            });
        }).then(r => r.success ? { data: r.data, name: path.basename(name, path.extname(name)) + '.mp3' } : { error: r.error });
    });

    
    ipcMain.handle('compress-video', async (e, { data, name, useGpu }) => {
        return await withTempFiles(data, path.extname(name) || '.tmp', (ip, op) => {
            const fp = op + '.mp4';
            return new Promise((res, rej) => {
                let c = ffmpeg(ip);
                if (useGpu) {
                    c.videoCodec('h264_nvenc').outputOptions(['-preset p1', '-tune hq']).on('error', () => {
                        c = ffmpeg(ip).videoCodec('libx264').outputOptions(['-preset ultrafast', '-crf 28']);
                    });
                } else {
                    c.videoCodec('libx264').outputOptions(['-preset ultrafast', '-crf 28']);
                }
                c.audioCodec('aac').videoFilters('scale=w=-2:h=720:force_original_aspect_ratio=decrease')
                    .addOptions(['-threads 0', '-movflags +faststart', '-pix_fmt yuv420p'])
                    .on('error', rej).on('end', () => res(fp)).save(fp);
            });
        }).then(r => r.success ? { data: r.data, name: path.basename(name, path.extname(name)) + '.mp4' } : { error: r.error });
    });

    
    ipcMain.handle('upload-file', async (e, { file, fileBuffer, fileName, fileType }) => {
        try {
            const buffer = fileBuffer || (file?.path ? await fs.readFile(file.path) : null);
            return await network.uploadFileInternal(buffer, fileName, fileType);
        } catch (error) {
            return { error: { message: error.message } };
        }
    });

    
    ipcMain.handle('upload-music-post', async (event, { uploadId, filePath, fileName, fileType }) => {
        console.log(`[MUSIC-UPLOAD] Начало процесса для ID: ${uploadId}`);
        
        const sendStatus = (status, error = null) => {
            if (event.sender && !event.sender.isDestroyed()) {
                console.log(`[MUSIC-UPLOAD] ${uploadId} -> Статус: ${status}`);
                event.sender.send('upload-progress', { id: uploadId, status, error });
            }
        };

        try {
            
            sendStatus('reading_tags');
            const tags = await new Promise((resolve, reject) => {
                jsmediatags.read(filePath, {
                    onSuccess: resolve,
                    onError: (err) => reject(new Error(err.info || "Не удалось прочитать теги файла"))
                });
            });

            const title = tags.tags.title || fileName.replace(/\.[^/.]+$/, "");
            const artist = tags.tags.artist || 'Неизвестный исполнитель';
            const album = tags.tags.album || 'Синглы';
            
            
            const b64 = (str) => Buffer.from(str).toString('base64');
            const postContent = `#nowkie_music_track [title:${b64(title)}] [artist:${b64(artist)}] [album:${b64(album)}]`;

            
            sendStatus('uploading_audio');
            const audioBuffer = await fs.readFile(filePath);
            const audioRes = await network.uploadFileInternal(audioBuffer, fileName, fileType);
            
            if (audioRes.error) throw new Error(audioRes.error.message);
            const attachmentIds = [audioRes.data.id];

            
            if (tags.tags.picture) {
                try {
                    sendStatus('uploading_cover');
                    const { data, format } = tags.tags.picture;
                    const coverBuffer = Buffer.from(data);
                    const coverRes = await network.uploadFileInternal(coverBuffer, 'cover.jpg', format);
                    if (!coverRes.error && coverRes.data?.id) {
                        attachmentIds.push(coverRes.data.id);
                    }
                } catch (coverErr) {
                    console.warn("[MUSIC-UPLOAD] Не удалось загрузить обложку, продолжаем без неё:", coverErr.message);
                }
            }

            
            sendStatus('creating_post');
            const postRes = await network.apiCall('/posts', 'POST', {
                content: postContent,
                attachmentIds: attachmentIds
            });

            if (postRes.error) throw new Error(postRes.error.message);

            
            console.log(`[MUSIC-UPLOAD] Успешно завершено для: ${title}`);
            sendStatus('complete');
            return { success: true };

        } catch (err) {
            console.error(`[MUSIC-UPLOAD] ОШИБКА для ${uploadId}:`, err.message);
            sendStatus('error', err.message);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('cancel-stealth-login', () => auth.cancelStealthLogin());
    ipcMain.handle('app:quick-check', () => network.quickInternetCheck());
    ipcMain.handle('app:check-api-status', () => network.checkApiStatus());

    
    ipcMain.handle('themes:fetch-remote', () => themes.fetchRemoteList());
    ipcMain.handle('themes:get-local', () => themes.getLocalList());
    ipcMain.handle('themes:download', (e, t) => themes.downloadTheme(t));
    ipcMain.handle('themes:delete', (e, f) => themes.deleteTheme(f));
    ipcMain.handle('themes:read-content', (e, f) => themes.readThemeContent(f));
}

module.exports = { registerHandlers };