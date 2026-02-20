import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DownloadContext = createContext();

export const DownloadProvider = ({ children }) => {
    
    const [history, setHistory] = useState(() => {
        try {
            const saved = localStorage.getItem('itd_download_history');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    
    useEffect(() => {
        localStorage.setItem('itd_download_history', JSON.stringify(history.slice(0, 50))); 
    }, [history]);

    useEffect(() => {
        if (!window.api?.on) return;

        const handleProgress = (data) => {
            setHistory(prev => {
                const index = prev.findIndex(item => item.url === data.url && item.startTime === data.startTime);
                
                
                if (index === -1) {
                    return [{ ...data, timestamp: Date.now() }, ...prev];
                }

                
                const newHistory = [...prev];
                newHistory[index] = { ...newHistory[index], ...data };
                return newHistory;
            });
        };

        const unsubscribe = window.api.on('download-progress', handleProgress);
        return () => unsubscribe();
    }, []);

    const startDownload = useCallback((url) => {
        if (window.api?.downloadFile) {
            window.api.downloadFile(url);
        }
    }, []);

    const clearHistory = useCallback(() => setHistory([]), []);
    
    const removeItem = useCallback((startTime) => {
        setHistory(prev => prev.filter(item => item.startTime !== startTime));
    }, []);

    
    const activeDownloads = history.reduce((acc, item) => {
        if (item.status === 'progressing' || item.status === 'starting') {
            acc[item.url] = item;
        }
        return acc;
    }, {});

    return (
        <DownloadContext.Provider value={{ 
            downloads: activeDownloads, 
            history,                    
            startDownload,
            clearHistory,
            removeItem
        }}>
            {children}
        </DownloadContext.Provider>
    );
};

export const useDownload = () => useContext(DownloadContext);