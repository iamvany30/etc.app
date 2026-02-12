const fs = require('fs/promises');
const path = require('path');
const { app } = require('electron');
const extract = require('extract-zip');

const THEMES_DIR = path.join(app.getPath('userData'), 'themes');
const TEMP_DIR = path.join(app.getPath('temp'), 'theme_downloads');
const REMOTE_INDEX_URL = 'https://raw.githubusercontent.com/iamvany30/etc.app_theme/main/index.json';

const ensureDirs = async () => {
    await fs.mkdir(THEMES_DIR, { recursive: true });
    await fs.mkdir(TEMP_DIR, { recursive: true });
};

const fetchRemoteList = async () => {
    try {
        const response = await fetch(REMOTE_INDEX_URL, { headers: { 'Cache-Control': 'no-cache' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data.themes || [];
    } catch (error) {
        return { error: error.message };
    }
};

const getLocalList = async () => {
    await ensureDirs();
    const installedThemes = [];
    try {
        const themeFolders = await fs.readdir(THEMES_DIR, { withFileTypes: true });
        for (const dirent of themeFolders) {
            if (dirent.isDirectory()) {
                const manifestPath = path.join(THEMES_DIR, dirent.name, 'theme.json');
                try {
                    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
                    installedThemes.push({ ...JSON.parse(manifestContent), folderName: dirent.name });
                } catch {}
            }
        }
    } catch {}
    return installedThemes;
};

const downloadTheme = async (theme) => {
    await ensureDirs();
    const tempZipPath = path.join(TEMP_DIR, `${theme.folderName}.zip`);
    const finalThemePath = path.join(THEMES_DIR, theme.folderName);
    try {
        const response = await fetch(theme.url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        await fs.writeFile(tempZipPath, Buffer.from(arrayBuffer));
        await fs.rm(finalThemePath, { recursive: true, force: true });
        await extract(tempZipPath, { dir: finalThemePath });
        await fs.unlink(tempZipPath);
        return { success: true };
    } catch (error) {
        return { error: error.message };
    }
};

const deleteTheme = async (folderName) => {
    try {
        await fs.rm(path.join(THEMES_DIR, folderName), { recursive: true, force: true });
        return { success: true };
    } catch (error) {
        return { error: error.message };
    }
};

const readThemeContent = async (folderName) => {
    try {
        const themePath = path.join(THEMES_DIR, folderName);
        const manifest = JSON.parse(await fs.readFile(path.join(themePath, 'theme.json'), 'utf-8'));
        let combinedCss = '';
        if (manifest.files) {
            for (const file of manifest.files) {
                try { combinedCss += await fs.readFile(path.join(themePath, file), 'utf-8') + '\n'; } catch {}
            }
        }
        return { content: combinedCss };
    } catch (error) {
        return { error: error.message };
    }
};

const checkAndSyncThemes = async (onProgress) => {
    try {
        onProgress('Синхронизация тем', 'Проверка версий...', 10);
        const remote = await fetchRemoteList();
        const local = await getLocalList();
        
        if (remote.error || !Array.isArray(remote)) return;

        let processed = 0;
        const total = remote.length;

        for (const rTheme of remote) {
            const lTheme = local.find(l => l.name === rTheme.name);
            if (!lTheme || String(lTheme.version) !== String(rTheme.version)) {
                onProgress('Обновление тем', `Загрузка: ${rTheme.name}`, 10 + (processed / total) * 80);
                await downloadTheme(rTheme);
            }
            processed++;
        }
        onProgress('Темы обновлены', 'Готово', 100);
    } catch (e) {
        console.error(e);
    }
};

module.exports = {
    fetchRemoteList,
    getLocalList,
    downloadTheme,
    deleteTheme,
    readThemeContent,
    checkAndSyncThemes
};