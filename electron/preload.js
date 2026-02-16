const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('api', {
    
    getPathForFile: (file) => {
        return webUtils.getPathForFile(file);
    },

    call: (endpoint, method, body) => ipcRenderer.invoke('api-call', { endpoint, method, body }),
    getInitUser: () => ipcRenderer.invoke('get-init-user'),
    
    runDiagnostics: () => ipcRenderer.invoke('app:diagnostics'),
    checkInternetQuick: () => ipcRenderer.invoke('app:quick-check'),

    autoGrabToken: () => ipcRenderer.invoke('auto-grab-token'),
    openStealthLogin: () => ipcRenderer.invoke('open-stealth-login'),
    
    onAuthLog: (callback) => {
        const subscription = (_event, message) => callback(message);
        ipcRenderer.on('auth-log', subscription);
        return () => ipcRenderer.removeListener('auth-log', subscription);
    },

    compressAudio: (fileData) => ipcRenderer.invoke('compress-audio', fileData),
    compressVideo: (fileData) => ipcRenderer.invoke('compress-video', fileData),
    openExternalLink: (url) => ipcRenderer.invoke('open-external-link', url),
    downloadFile: (url, filename) => ipcRenderer.invoke('download-file', { url, filename }),
    
    onNotification: (callback) => {
        const subscription = (_event, data) => callback(data);
        ipcRenderer.on('notification', subscription);
        return {
            removeListener: () => ipcRenderer.removeListener('notification', subscription)
        };
    },

    
    on: (channel, callback) => {
        const subscription = (_event, ...args) => callback(...args);
        ipcRenderer.on(channel, subscription);
        return () => ipcRenderer.removeListener(channel, subscription);
    },

    invoke: (channel, data) => ipcRenderer.invoke(channel, data),
    
    navigation: {
        goBack: () => ipcRenderer.send('nav-back'),
        goForward: () => ipcRenderer.send('nav-forward'),
        reload: () => ipcRenderer.send('nav-reload'),
    },
    
    window: {
        minimize: () => ipcRenderer.send('window-minimize'),
        maximize: () => ipcRenderer.send('window-maximize'),
        close: () => ipcRenderer.send('window-close')
    }
});