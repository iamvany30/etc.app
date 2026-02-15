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
        logDebug(`[FFMPEG-ERROR] ${error.message}`);
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
    ipcMain.handle('open-stealth-login', (event) => auth.handleStealthLogin(event));
    ipcMain.handle('get-init-user', async () => {
        const token = store.loadRefreshToken();
        if (!token) return null;
        const ref = await network.refreshSession();
        if (!ref.success) return ref.reason === 'network_error' ? { error: { code: 'NETWORK_ERROR' } } : null;
        const res = await network.apiCall('/profile');
        if (res?.user?.id) { network.startStreamConnection(); return res.user; }
        return null;
    });

    ipcMain.handle('api-call', (e, a) => network.apiCall(a.endpoint, a.method, a.body));
    ipcMain.handle('open-external-link', (e, u) => shell.openExternal(u));
    ipcMain.handle('download-file', (e, { url }) => { const win = getMainWindow(); if(win) win.webContents.downloadURL(url); });

    
    ipcMain.handle('presence:start', () => network.startStreamConnection());
    ipcMain.handle('presence:stop', () => network.stopStreamConnection());

    ipcMain.handle('compress-audio', async (e, { data, name }) => {
        return await withTempFiles(data, path.extname(name) || '.tmp', (ip, op) => {
            const fp = op + '.mp3';
            return new Promise((res, rej) => {
                ffmpeg(ip).audioCodec('libmp3lame').audioBitrate('128k').toFormat('mp3').addOptions(['-threads 0'])
                    .on('error', rej).on('end', () => res(fp)).save(fp);
            });
        }).then(r => r.success ? { data: r.data, name: path.basename(name, path.extname(name)) + '.mp3' } : { error: r.error });
    });

    ipcMain.handle('compress-video', async (e, { data, name, useGpu }) => {
        return await withTempFiles(data, path.extname(name) || '.tmp', (ip, op) => {
            const fp = op + '.mp4';
            return new Promise((res, rej) => {
                let c = ffmpeg(ip);
                if (useGpu) c.videoCodec('h264_nvenc').outputOptions(['-preset p1', '-tune hq']).on('error', () => { 
                    c = ffmpeg(ip).videoCodec('libx264').outputOptions(['-preset ultrafast', '-crf 28']); 
                });
                else c.videoCodec('libx264').outputOptions(['-preset ultrafast', '-crf 28']);
                c.audioCodec('aac').videoFilters('scale=w=-2:h=720:force_original_aspect_ratio=decrease')
                    .addOptions(['-threads 0', '-movflags +faststart', '-pix_fmt yuv420p'])
                    .on('error', rej).on('end', () => res(fp)).save(fp);
            });
        }).then(r => r.success ? { data: r.data, name: path.basename(name, path.extname(name)) + '.mp4' } : { error: r.error });
    });

    ipcMain.handle('upload-file', async (e, { file, fileBuffer, fileName, fileType }) => {
        try {
            const startTime = Date.now();
            const accessToken = store.getAccessToken();

            let buffer;
            let finalFileName;
            let finalFileType;

            if (file && file.path) {
                logDebug(`[UPLOAD] Чтение файла с диска: ${file.path}`);
                buffer = await fs.readFile(file.path);
                finalFileName = file.name;
                finalFileType = file.type || 'application/octet-stream';
            } 
            else if (fileBuffer) {
                logDebug(`[UPLOAD] Работа с готовым буфером для файла: ${fileName}`);
                buffer = fileBuffer;
                finalFileName = fileName;
                finalFileType = fileType;
            } else {
                throw new Error("Нет данных файла для загрузки");
            }

            const formData = new FormData();
            const blob = new Blob([buffer], { type: finalFileType });
            formData.append('file', blob, finalFileName);

            const options = {
                method: 'POST',
                headers: { 'User-Agent': USER_AGENT },
                body: formData
            };

            if (accessToken) {
                options.headers['Authorization'] = `Bearer ${accessToken}`;
            }

            const response = await fetch(`${API_BASE}/files/upload`, options);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ошибка сервера: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            logDebug(`[UPLOAD] ${finalFileName} успешно загружен за ${Date.now() - startTime}ms`);
            
            return { data };

        } catch (error) {
            logDebug(`[UPLOAD-ERROR] ${error.message}`);
            return { error: { message: error.message || 'Сетевая ошибка' } };
        }
    });

    ipcMain.handle('app:quick-check', () => network.quickInternetCheck());
    ipcMain.handle('app:check-api-status', () => network.checkApiStatus());
    ipcMain.handle('themes:fetch-remote', () => themes.fetchRemoteList());
    ipcMain.handle('themes:get-local', () => themes.getLocalList());
    ipcMain.handle('themes:download', (e, t) => themes.downloadTheme(t));
    ipcMain.handle('themes:delete', (e, f) => themes.deleteTheme(f));
    ipcMain.handle('themes:read-content', (e, f) => themes.readThemeContent(f));
}

module.exports = { registerHandlers };