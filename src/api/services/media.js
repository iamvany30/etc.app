import { request } from '../core';
import { mediaProcessor } from '../mediaProcessor';  

export const mediaService = {
    uploadFile: async (file) => {
         
        const compressEnabled = localStorage.getItem('itd_compress_files') !== 'false';
        const useGpu = localStorage.getItem('itd_use_gpu') === 'true';

        try {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            const isAudio = file.type.startsWith('audio/') || file.name.endsWith('.mp3');

            let fileData = new Uint8Array(await file.arrayBuffer());
            let fileName = file.name;
            let fileType = file.type;

            if (compressEnabled) {
                 
                if (isImage && file.type !== 'image/gif') {
                    const optimizedFile = await mediaProcessor.process(file);
                    fileData = new Uint8Array(await optimizedFile.arrayBuffer());
                    fileName = optimizedFile.name;
                    fileType = optimizedFile.type;
                }

                 
                if (isAudio) {
                    const compressed = await window.api.compressAudio({ data: fileData, name: fileName });
                    if (compressed && !compressed.error) {
                        fileData = compressed.data;
                        fileName = compressed.name;
                    }
                }

                 
                if (isVideo) {
                    const compressed = await window.api.compressVideo({ 
                        data: fileData, 
                        name: fileName, 
                        useGpu: useGpu 
                    });
                    if (compressed && !compressed.error) {
                        fileData = compressed.data;
                        fileName = compressed.name;
                    }
                }
            }

             
            if (fileData.length > 19 * 1024 * 1024) {
                return { error: { message: "Файл превышает лимит сервера 19МБ." } };
            }

            return request('/files/upload', 'POST', {
                file: { name: fileName, type: fileType, data: fileData }
            });

        } catch (e) {
            return { error: { message: e.message } };
        }
    }
};