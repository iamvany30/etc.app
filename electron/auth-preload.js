const { ipcRenderer } = require('electron');

const log = (message) => {
    try {
        ipcRenderer.send('log-from-preload', `[PRELOAD-SCRIPT] ${message}`);
    } catch (e) {
        console.error("IPC Log failed", e);
    }
};

 
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/verify-otp'];

function checkStateAndReport() {
    const currentPath = window.location.pathname;
    const onAuthPage = AUTH_PATHS.some(path => currentPath.startsWith(path));
    
    log(`Переход на: ${currentPath} (onAuthPage=${onAuthPage})`);

     
     
    ipcRenderer.send('auth-window-state-update', { 
        path: currentPath, 
        onAuthPage: onAuthPage,
        url: window.location.href 
    });
}

window.addEventListener('DOMContentLoaded', () => {
    log('DOM загружен. Инициализация...');
    ipcRenderer.send('auth-preload-ready');

    checkStateAndReport();

     
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
        originalPushState.apply(this, args);
        checkStateAndReport();
    };

    window.addEventListener('popstate', checkStateAndReport);
});