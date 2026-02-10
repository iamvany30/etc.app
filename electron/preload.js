const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    
    call: (endpoint, method, body) => ipcRenderer.invoke('api-call', { endpoint, method, body }),
    openAuth: (type) => ipcRenderer.invoke('open-auth', type),
    getInitUser: () => ipcRenderer.invoke('get-init-user'),
    
    
    
    openExternalLink: (url) => ipcRenderer.invoke('open-external-link', url),
    downloadFile: (url, filename) => ipcRenderer.invoke('download-file', { url, filename }),
    onNotification: (callback) => {
        const subscription = (_event, data) => callback(data);
        ipcRenderer.on('notification', subscription);
        
        return {
            removeListener: () => ipcRenderer.removeListener('notification', subscription)
        };
    },

    window: {
        minimize: () => ipcRenderer.send('window-minimize'),
        maximize: () => ipcRenderer.send('window-maximize'),
        close: () => ipcRenderer.send('window-close')
    }
});