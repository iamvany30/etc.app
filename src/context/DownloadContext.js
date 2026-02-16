import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DownloadContext = createContext();

export const DownloadProvider = ({ children }) => {
    const [downloads, setDownloads] = useState({});

    useEffect(() => {
        if (!window.api?.on) return;

        const handleProgress = (data) => {
            if (!data.url) return;

            const { url, percent, status } = data;
            
            setDownloads(prev => ({
                ...prev,
                [url]: { percent, status: status || 'progressing' }
            }));

            
            if (['completed', 'cancelled', 'failed'].includes(status)) {
                setTimeout(() => {
                    setDownloads(prev => {
                        const next = { ...prev };
                        delete next[url];
                        return next;
                    });
                }, 5000); 
            }
        };

        const unsubscribe = window.api.on('download-progress', handleProgress);
        return () => unsubscribe();
    }, []);

    const startDownload = useCallback((url) => {
        if (window.api?.downloadFile) {
            
            setDownloads(prev => ({
                ...prev,
                [url]: { percent: 0, status: 'starting' }
            }));
            window.api.downloadFile(url);
        }
    }, []);

    return (
        <DownloadContext.Provider value={{ downloads, startDownload }}>
            {children}
        </DownloadContext.Provider>
    );
};

export const useDownload = () => useContext(DownloadContext);