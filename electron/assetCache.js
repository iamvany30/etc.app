/* @source electron/assetCache.js */
const { app, protocol, net, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const CACHE_DIR = path.join(app.getPath('userData'), 'smart_cache');
const SETTINGS_PATH = path.join(app.getPath('userData'), 'app-settings.json');
const MAX_FILE_SIZE = 50 * 1024 * 1024; 


let cacheIndex = new Map(); 
let activeDownloads = new Map(); 

/**
 * Читает настройки лимитов кэша
 */
function loadCacheSettings() {
    try {
        if (fs.existsSync(SETTINGS_PATH)) {
            const data = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
            return {
                maxSizeMB: data.cacheMaxSizeMB !== undefined ? data.cacheMaxSizeMB : 2048,
                maxAgeDays: data.cacheMaxAgeDays !== undefined ? data.cacheMaxAgeDays : 30
            };
        }
    } catch(e) {}
    return { maxSizeMB: 2048, maxAgeDays: 30 };
}

/**
 * Определяет правильное расширение файла
 */
function getExt(mime, url) {
    if (mime.includes('image/gif')) return '.gif';
    if (mime.includes('image/png')) return '.png';
    if (mime.includes('image/webp')) return '.webp';
    if (mime.includes('image/')) return '.jpg';
    if (mime.includes('video/mp4')) return '.mp4';
    if (mime.includes('video/webm')) return '.webm';
    if (mime.includes('video/')) return '.mp4';
    if (mime.includes('audio/mpeg')) return '.mp3';
    if (mime.includes('audio/ogg')) return '.ogg';
    if (mime.includes('audio/')) return '.mp3';
    const match = url.match(/\.([a-z0-9]+)(?:[\?#]|$)/i);
    return match ? '.' + match[1].toLowerCase() : '.bin';
}

/**
 * Оптимизирует (если нужно) и сохраняет файл на диск атомарно
 */
async function processAndCache(buffer, mimeType, hash, ext) {
    const filename = hash + ext;
    const cachePath = path.join(CACHE_DIR, filename);
    const tmpPath = cachePath + '.tmp'; 

    try {
        let finalBuffer = buffer;

        
        if (mimeType.startsWith('image/') && ext !== '.gif') {
            try {
                const img = nativeImage.createFromBuffer(buffer);
                if (!img.isEmpty()) {
                    let processedImg = img;
                    const size = img.getSize();
                    if (size.width > 1600 || size.height > 1600) {
                        processedImg = img.resize({ 
                            width: size.width > size.height ? 1600 : 0, 
                            height: size.height >= size.width ? 1600 : 0,
                            quality: 'good'
                        });
                    }
                    finalBuffer = ext === '.png' ? processedImg.toPNG() : processedImg.toJPEG(90);
                }
            } catch(imgErr) {
                console.warn(`[Cache] Image processing failed for ${hash}, saving original.`);
            }
        }

        
        await fs.promises.writeFile(tmpPath, finalBuffer);
        await fs.promises.rename(tmpPath, cachePath);
        
        cacheIndex.set(hash, filename);
        return { buffer: finalBuffer, path: cachePath, mimeType };

    } catch (e) {
        await fs.promises.unlink(tmpPath).catch(()=>{});
        throw e;
    }
}

/**
 * Единая функция загрузки с таймаутом и защитой от дублирования
 */
function fetchAndCache(remoteUrl, hash) {
    if (activeDownloads.has(hash)) {
        return activeDownloads.get(hash);
    }

    const downloadPromise = (async () => {
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
            const response = await net.fetch(remoteUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

            const mimeType = response.headers.get('content-type') || '';
            const contentLength = parseInt(response.headers.get('content-length') || '0', 10);

            if (contentLength > MAX_FILE_SIZE) {
                return { rawResponse: response, isOversized: true };
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const ext = getExt(mimeType, remoteUrl);

            return await processAndCache(buffer, mimeType, hash, ext);
        } catch (e) {
            clearTimeout(timeoutId);
            throw e;
        }
    })().finally(() => {
        activeDownloads.delete(hash);
    });

    activeDownloads.set(hash, downloadPromise);
    return downloadPromise;
}

/**
 * Установка кастомного протокола asset://
 */
function setupAssetProtocol() {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

    const emptyPixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

    protocol.handle('asset', async (request) => {
        try {
            let remoteUrl = null;

            if (request.url.includes('?url=')) {
                const urlPart = request.url.substring(request.url.indexOf('?url=') + 5);
                remoteUrl = decodeURIComponent(urlPart);
            }

            if (!remoteUrl || !remoteUrl.startsWith('http')) {
                return new Response(emptyPixel, { headers: { 'Content-Type': 'image/gif' }, status: 200 });
            }

            const hash = crypto.createHash('sha256').update(remoteUrl).digest('hex');
            
            if (cacheIndex.has(hash)) {
                const cachedFile = path.join(CACHE_DIR, cacheIndex.get(hash));
                if (fs.existsSync(cachedFile)) {
                    fs.promises.utimes(cachedFile, new Date(), new Date()).catch(()=>{});
                    return net.fetch(require('url').pathToFileURL(cachedFile).toString());
                } else {
                    cacheIndex.delete(hash);
                }
            }

            const result = await fetchAndCache(remoteUrl, hash);

            if (result.isOversized) {
                return new Response(result.rawResponse.body, { headers: result.rawResponse.headers, status: 200 });
            }

            return new Response(result.buffer, { headers: { 'Content-Type': result.mimeType }, status: 200 });

        } catch (e) {
            return new Response(emptyPixel, { headers: { 'Content-Type': 'image/gif' }, status: 200 });
        }
    });
}

/**
 * ФОНОВОЕ ПРЕДКЭШИРОВАНИЕ (Плавная очередь - Sliding Window)
 * Улучшенная стабильность для больших профилей.
 */
async function prefetchUrls(urls) {
    if (!Array.isArray(urls) || urls.length === 0) return;
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

    
    const validUrls = urls.map(url => {
        let remoteUrl = url;
        if (remoteUrl.startsWith('asset://') && remoteUrl.includes('?url=')) {
            remoteUrl = decodeURIComponent(remoteUrl.substring(remoteUrl.indexOf('?url=') + 5));
        }
        return remoteUrl.startsWith('http') ? remoteUrl : null;
    }).filter(Boolean);

    
    const concurrencyLimit = 4;
    let activeCount = 0;
    let index = 0;

    return new Promise((resolve) => {
        const processNext = async () => {
            
            if (index >= validUrls.length && activeCount === 0) {
                resolve();
                return;
            }
            
            
            while (activeCount < concurrencyLimit && index < validUrls.length) {
                const remoteUrl = validUrls[index++];
                const hash = crypto.createHash('sha256').update(remoteUrl).digest('hex');

                
                if (cacheIndex.has(hash) || activeDownloads.has(hash)) {
                    processNext(); 
                    continue;
                }

                activeCount++;
                
                
                fetchAndCache(remoteUrl, hash)
                    .catch(() => {}) 
                    .finally(() => {
                        activeCount--;
                        processNext(); 
                    });
            }
        };

        processNext();
    });
}

/**
 * Получение статистики кэша
 */
async function getCacheStats() {
    const stats = { images: 0, videos: 0, audio: 0, other: 0, total: 0 };
    try {
        if (!fs.existsSync(CACHE_DIR)) return stats;
        const files = await fs.promises.readdir(CACHE_DIR);
        for (const file of files) {
            if (file.endsWith('.tmp')) continue;

            const size = (await fs.promises.stat(path.join(CACHE_DIR, file))).size;
            stats.total += size;
            
            if (file.match(/\.(jpg|jpeg|png|webp|gif)$/i)) stats.images += size;
            else if (file.match(/\.(mp4|webm|mov|avi)$/i)) stats.videos += size;
            else if (file.match(/\.(mp3|wav|ogg|m4a|flac)$/i)) stats.audio += size;
            else stats.other += size;
        }
    } catch(e) {}
    return stats;
}

/**
 * Очистка
 */
async function clearAllCache(categories) {
    if (!fs.existsSync(CACHE_DIR)) return getCacheStats();
    try {
        const files = await fs.promises.readdir(CACHE_DIR);
        for (const file of files) {
            let type = 'other';
            if (file.match(/\.(jpg|jpeg|png|webp|gif)$/i)) type = 'images';
            else if (file.match(/\.(mp4|webm|mov|avi)$/i)) type = 'videos';
            else if (file.match(/\.(mp3|wav|ogg|m4a|flac)$/i)) type = 'audio';

            if (categories[type] || categories.all || file.endsWith('.tmp')) {
                await fs.promises.unlink(path.join(CACHE_DIR, file)).catch(()=>{});
                cacheIndex.delete(file.split('.')[0]);
            }
        }
    } catch (e) { console.error('[Cache] Clear error:', e); }
    return getCacheStats();
}

/**
 * LRU Очистка старых файлов
 */
async function cleanupCache() {
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
        return;
    }
    
    try {
        const files = await fs.promises.readdir(CACHE_DIR);
        cacheIndex.clear();
        files.forEach(f => {
            if (!f.endsWith('.tmp')) cacheIndex.set(f.split('.')[0], f);
        });

        const limits = loadCacheSettings();
        if (limits.maxSizeMB === 0 && limits.maxAgeDays === 0) return;

        const fileInfos = [];
        let currentTotalSize = 0;

        for (const file of files) {
            const filePath = path.join(CACHE_DIR, file);
            if (file.endsWith('.tmp')) {
                await fs.promises.unlink(filePath).catch(()=>{});
                continue;
            }

            const stat = await fs.promises.stat(filePath);
            fileInfos.push({ file, path: filePath, size: stat.size, atime: stat.atimeMs });
            currentTotalSize += stat.size;
        }

        if (limits.maxAgeDays > 0) {
            const cutoff = Date.now() - (limits.maxAgeDays * 24 * 60 * 60 * 1000);
            for (let i = fileInfos.length - 1; i >= 0; i--) {
                if (fileInfos[i].atime < cutoff) {
                    await fs.promises.unlink(fileInfos[i].path).catch(()=>{});
                    cacheIndex.delete(fileInfos[i].file.split('.')[0]);
                    currentTotalSize -= fileInfos[i].size;
                    fileInfos.splice(i, 1);
                }
            }
        }

        if (limits.maxSizeMB > 0) {
            const maxBytes = limits.maxSizeMB * 1024 * 1024;
            if (currentTotalSize > maxBytes) {
                fileInfos.sort((a, b) => a.atime - b.atime); 
                for (const info of fileInfos) {
                    if (currentTotalSize <= maxBytes) break;
                    await fs.promises.unlink(info.path).catch(()=>{});
                    cacheIndex.delete(info.file.split('.')[0]);
                    currentTotalSize -= info.size;
                }
            }
        }
    } catch(e) {}
}

async function updateLimits(limits) {
    try {
        let currentSettings = {};
        if (fs.existsSync(SETTINGS_PATH)) {
            currentSettings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
        }
        currentSettings.cacheMaxSizeMB = limits.maxSizeMB;
        currentSettings.cacheMaxAgeDays = limits.maxAgeDays;
        fs.writeFileSync(SETTINGS_PATH, JSON.stringify(currentSettings, null, 2));
        cleanupCache(); 
        return { success: true };
    } catch(e) { return { success: false, error: e.message }; }
}

module.exports = { setupAssetProtocol, cleanupCache, getCacheStats, clearAllCache, updateLimits, prefetchUrls };