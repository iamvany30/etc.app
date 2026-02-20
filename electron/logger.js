const fs = require('fs');
const path = require('path');
const os = require('os');
const { app } = require('electron');
const { getMainWindow } = require('./window');

const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
const APP_ROOT = path.join(localAppData, 'etc.app');
const LOG_DIR = path.join(APP_ROOT, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'electron_debug.log');

try {
    if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }
} catch (e) {
    console.error("Critical: Could not create log dir", e);
}


const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

function writeToFile(level, ...args) {
    try {
        const timestamp = new Date().toLocaleTimeString();
        const msg = args.map(arg => {
            if (arg instanceof Error) return arg.stack;
            if (typeof arg === 'object') return JSON.stringify(arg);
            return String(arg);
        }).join(' ');

        const line = `[${timestamp}] [${level}] ${msg}\n`;
        
        
        logStream.write(line);
    } catch (e) {
        
    }
}


writeToFile('SYSTEM', `=== SESSION START: ${new Date().toLocaleString()} ===`);
writeToFile('SYSTEM', `App Version: ${app.getVersion()}`);

const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args) => {
    originalLog(...args);
    
    
    
    try {
        const win = getMainWindow();
        if (win && !win.isDestroyed() && args[0] && typeof args[0] === 'string' && args[0].includes('[Auth]')) {
            win.webContents.send('auth-log', args.join(' '));
        }
    } catch(e){}
};


console.error = (...args) => {
    originalError(...args);
    writeToFile('ERROR', ...args);
};

console.warn = (...args) => {
    originalWarn(...args);
    writeToFile('WARN', ...args);
};

function logDebug(message, data = null) {
    if (data) console.log(message, data);
    else console.log(message);
    
    writeToFile('DEBUG', message, data || '');
}

function getLogDump() {
    try {
        let electronLog = "";
        if (fs.existsSync(LOG_FILE)) {
            electronLog = fs.readFileSync(LOG_FILE, 'utf-8');
        }
        const pythonLogPath = path.join(LOG_DIR, 'itd_auth_debug.log');
        let pyLog = "Python log not found.";
        if (fs.existsSync(pythonLogPath)) {
            pyLog = fs.readFileSync(pythonLogPath, 'utf-8');
        }
        return `=== ELECTRON LOG ===\n${electronLog}\n\n=== PYTHON LOG ===\n${pyLog}`;
    } catch (e) {
        return `Error reading logs: ${e.message}`;
    }
}

module.exports = { 
    logDebug, 
    getLogDump,
    LOG_FILE_PATH: LOG_FILE,  
    LOG_DIR_PATH: LOG_DIR 
};