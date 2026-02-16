import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const UploadContext = createContext();

export const UploadProvider = ({ children }) => {
    const [uploads, setUploads] = useState({});

    useEffect(() => {
        if (!window.api?.on) return;

        const handleProgress = (data) => {
            console.log('[UploadContext] Received progress update:', data);
            const { id, status, error } = data;
            
            setUploads(prev => {
                if (!prev[id]) return prev;
                const updatedUpload = { ...prev[id], status, error };
                
                if (status === 'complete' || status === 'error') {
                    setTimeout(() => {
                        setUploads(p => {
                            const next = { ...p };
                            delete next[id];
                            return next;
                        });
                    }, 5000);
                }
                
                return { ...prev, [id]: updatedUpload };
            });
        };

        const unsubscribe = window.api.on('upload-progress', handleProgress);
        return () => unsubscribe();
    }, []);

    const startMusicUpload = useCallback(async (file) => {
        
        const filePath = window.api.getPathForFile(file);

        if (!filePath) {
            console.error("[UploadContext] Failed to get file path using Electron webUtils.");
            alert("Ошибка доступа к файлу. Попробуйте перезапустить приложение.");
            return;
        }
        
        const uploadId = `upload_${Date.now()}_${Math.random()}`;
        
        console.log('[UploadContext] Starting background upload process:', {
            id: uploadId,
            name: file.name,
            path: filePath
        });

        setUploads(prev => ({
            ...prev,
            [uploadId]: { 
                id: uploadId, 
                fileName: file.name, 
                status: 'starting', 
                progress: 0 
            }
        }));

        
        window.api.invoke('upload-music-post', {
            uploadId,
            filePath: filePath,
            fileName: file.name,
            fileType: file.type
        });
    }, []);

    return (
        <UploadContext.Provider value={{ uploads, startMusicUpload }}>
            {children}
        </UploadContext.Provider>
    );
};

export const useUpload = () => useContext(UploadContext);