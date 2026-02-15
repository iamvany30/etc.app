const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
     
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
    invoke: (channel, data) => ipcRenderer.invoke(channel, data),
    navigation: {
        goBack: () => ipcRenderer.send('nav-back'),
        goForward: () => ipcRenderer.send('nav-forward'),
        reload: () => ipcRenderer.send('nav-reload'),
        onNavStateChange: (callback) => {
            const subscription = (_event, value) => callback(value);
            ipcRenderer.on('nav-state-change', subscription);
            return () => ipcRenderer.removeListener('nav-state-change', subscription);
        },
    },
    on: (channel, callback) => {
        const subscription = (_event, ...args) => callback(...args);
        ipcRenderer.on(channel, subscription);
        return () => ipcRenderer.removeListener(channel, subscription);
    },
    window: {
        minimize: () => ipcRenderer.send('window-minimize'),
        maximize: () => ipcRenderer.send('window-maximize'),
        close: () => ipcRenderer.send('window-close')
    }
});