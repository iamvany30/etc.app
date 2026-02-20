const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const { app } = require('electron');



const getFontsDir = () => path.join(app.getPath('userData'), 'fonts');

const REMOTE_FONTS_URL = 'https://raw.githubusercontent.com/iamvany30/etc.app_theme/main/fonts/index.json';

const ensureDir = async () => {
    const dir = getFontsDir();
    try { 
        await fs.mkdir(dir, { recursive: true }); 
    } catch (e) {
        console.error(`[FontService] Ошибка создания папки: ${e.message}`);
    }
};

const getLocalFonts = async () => {
    await ensureDir();
    try {
        return await fs.readdir(getFontsDir());
    } catch (e) {
        return [];
    }
};

const fetchRemoteFonts = async () => {
    try {
        console.log('[FontService] Запрос списка удаленных шрифтов...');
        const response = await fetch(`${REMOTE_FONTS_URL}?t=${Date.now()}`, { 
            headers: { 'Cache-Control': 'no-cache' } 
        });
        if (!response.ok) throw new Error(`Network error: ${response.status}`);
        const data = await response.json();
        return data.fonts || []; 
    } catch (error) {
        console.error('[FontService] Ошибка загрузки списка:', error.message);
        return { error: error.message };
    }
};

const downloadFont = async (fontObj) => {
    await ensureDir();
    const format = fontObj.format || 'ttf'; 
    const fileName = `${fontObj.id}.${format}`;  
    const filePath = path.join(getFontsDir(), fileName);
    
    console.log(`[FontService] --- НАЧАЛО ЗАГРУЗКИ ---`);
    console.log(`[FontService] Шрифт: ${fontObj.name}`);
    console.log(`[FontService] URL: ${fontObj.url}`);
    
    try {
        const response = await fetch(fontObj.url);
        
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}`);
        }

        const contentLength = response.headers.get('content-length');
        if (contentLength) {
            console.log(`[FontService] Ожидаемый размер: ${(contentLength / 1024 / 1024).toFixed(2)} MB`);
        }

        
        if (fsSync.existsSync(filePath)) {
            await fs.unlink(filePath);
        }

        
        
        console.log(`[FontService] Скачивание данных в память...`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        console.log(`[FontService] Запись файла на диск: ${filePath}`);
        await fs.writeFile(filePath, buffer);
        
        
        const stats = await fs.stat(filePath);
        console.log(`[FontService] Загрузка завершена. Итоговый размер: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

        return { success: true, path: filePath };

    } catch (error) {
        console.error(`[FontService] ОШИБКА ПРИ СКАЧИВАНИИ (${fontObj.id}):`, error.message);
        
        if (fsSync.existsSync(filePath)) {
            await fs.unlink(filePath).catch(() => {});
        }
        return { success: false, error: error.message };
    }
};

const deleteFont = async (fontId) => {
    try {
        const dir = getFontsDir();
        const files = await fs.readdir(dir);
        const target = files.find(f => f.startsWith(`${fontId}.`));
        if (target) {
            await fs.unlink(path.join(dir, target));
            console.log(`[FontService] Удален файл: ${target}`);
        }
        return { success: true };
    } catch (error) {
        return { error: error.message };
    }
};

module.exports = {
    getLocalFonts,
    fetchRemoteFonts, 
    downloadFont,
    deleteFont,
    getFontsDir
};