const path = require('path');
const { app } = require('electron');

const isPackaged = app.isPackaged;
const RESOURCES_PATH = isPackaged ? process.resourcesPath : path.join(__dirname, '../resources');

module.exports = {
    SITE_DOMAIN: 'https://xn--d1ah4a.com',
    get API_BASE() { return `${this.SITE_DOMAIN}/api`; },
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    
    PATHS: {
        STORE: path.join(app.getPath('userData'), 'session.secure'),
        RESOURCES: RESOURCES_PATH,
        BROWSER_HELPER: path.join(RESOURCES_PATH, 'browser_helper.exe'),
        ICON: path.join(__dirname, '../public/favicon.ico'),
        PRELOAD: path.join(__dirname, 'preload.js'),
        BUILD_INDEX: path.join(__dirname, '../build/index.html')
    }
};