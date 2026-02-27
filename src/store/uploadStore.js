/* @source src/store/uploadStore.js */
import { create } from 'zustand';
import { useIslandStore } from './islandStore'; 

export const useUploadStore = create((set, get) => ({
    uploads: {},

    startMusicUpload: async (file) => {
        const filePath = window.api.getPathForFile(file);
        if (!filePath) {
            
            useIslandStore.getState().showIslandAlert('error', 'Ошибка: не удалось прочитать путь к файлу', '❌');
            return;
        }
        
        const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        set((state) => ({
            uploads: {
                ...state.uploads,
                [uploadId]: { id: uploadId, fileName: file.name, status: 'starting', progress: 0 }
            }
        }));

        window.api.invoke('upload-music-post', {
            uploadId,
            filePath: filePath,
            fileName: file.name,
            fileType: file.type
        });
    },

    updateUploadProgress: (id, status, error) => {
        set((state) => {
            const updatedUpload = { ...state.uploads[id], status, error };
            return { uploads: { ...state.uploads, [id]: updatedUpload } };
        });

        if (status === 'complete' || status === 'error') {
            setTimeout(() => {
                set((state) => {
                    const next = { ...state.uploads };
                    delete next[id];
                    return { uploads: next };
                });
            }, 3000);
        }
    }
}));