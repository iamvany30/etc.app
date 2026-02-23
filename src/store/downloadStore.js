/* @source src/store/downloadStore.js */
import { create } from 'zustand';

export const useDownloadStore = create((set, get) => ({
    downloads: {}, 
    history: [],   

    startDownload: (url) => {
        if (window.api && window.api.downloadFile) {
            window.api.downloadFile(url);
        }
    },

    confirmDownload: (id) => {
        if (window.api?.invoke) {
            window.api.invoke('downloads:control', { id, action: 'resume' });
        }
        
        
        set((state) => {
            const next = { ...state.downloads };
            if (next[id]) {
                next[id] = { ...next[id], status: 'starting' };
            }
            return { downloads: next };
        });
    },

    cancelDownload: (id) => {
        if (window.api?.invoke) {
            window.api.invoke('downloads:control', { id, action: 'cancel' });
        }
        
        set((state) => {
            const next = { ...state.downloads };
            delete next[id];
            return { downloads: next };
        });
    },

    updateDownloadProgress: (data) => {
        set((state) => {
            let { id, url, status, fileName, path, percent, startTime, receivedBytes, totalBytes, speed } = data;
            
            if (status === 'paused') {
                const shouldAsk = localStorage.getItem('itd_ask_download') !== 'false'; 
                
                if (!shouldAsk) {
                    setTimeout(() => {
                        window.api?.invoke('downloads:control', { id, action: 'resume' });
                    }, 0);
                    status = 'starting'; 
                }
            }

            const newDownloads = { ...state.downloads };
            
            if (status === 'completed' || status === 'cancelled' || status === 'failed') {
                delete newDownloads[id];
                
                const historyItem = { 
                    id, url, fileName, path, status, startTime, totalBytes,
                    percent: status === 'completed' ? 100 : percent 
                };
                
                const newHistory = [historyItem, ...state.history.filter(h => h.id !== id)];
                
                return { downloads: newDownloads, history: newHistory };
            } else {
                newDownloads[id] = { id, url, fileName, path, status, percent, startTime, receivedBytes, totalBytes, speed };
                return { downloads: newDownloads };
            }
        });
    },

    clearHistory: () => set({ history: [] }),
    
    removeItem: (idOrStartTime) => set((state) => ({
        history: state.history.filter(item => item.id !== idOrStartTime && item.startTime !== idOrStartTime)
    }))
}));