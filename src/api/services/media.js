import { mediaProcessor } from '../mediaProcessor';

export const mediaService = {
  uploadFile: async (file, onStatusChange) => {
    const isCompress = localStorage.getItem('itd_compress_files') !== 'false';
    const useGpu = localStorage.getItem('itd_use_gpu') !== 'false';
    const start = Date.now();

    try {
      let fileName = file.name;
      const isGif = fileName.toLowerCase().endsWith('.gif');
      let fileType = isGif ? 'image/gif' : (file.type || 'application/octet-stream');
      
      const isImg = fileType.startsWith('image/') && !isGif;
      const isVid = fileType.startsWith('video/');
      const isAud = fileType.startsWith('audio/');

      const shouldSkipCompression = isGif || !isCompress || (isImg && file.size < 2 * 1024 * 1024);
      
      if (shouldSkipCompression) {
        if (onStatusChange) onStatusChange('Отправка...');
        
        const buffer = await file.arrayBuffer();
        
        return await window.api.invoke('upload-file', { 
            fileBuffer: new Uint8Array(buffer),
            fileName: fileName,
            fileType: fileType
        });
      }

      let compressedFileBlob;
      let newFileName = fileName;
      let newFileType = fileType;
      
      if (isImg) {
        if (onStatusChange) onStatusChange('Оптимизация...');
        compressedFileBlob = await mediaProcessor.process(file);
        newFileName = compressedFileBlob.name;
        newFileType = compressedFileBlob.type;
      } else if (isAud || isVid) {
        if (onStatusChange) onStatusChange(isVid ? 'Обработка видео...' : 'Обработка аудио...');
        const fileDataBuffer = new Uint8Array(await file.arrayBuffer());
        const result = await window.api.invoke(isAud ? 'compress-audio' : 'compress-video', { 
            data: fileDataBuffer, name: fileName, useGpu 
        });

        if (result?.data) {
          compressedFileBlob = new Blob([result.data], { type: isAud ? 'audio/mpeg' : 'video/mp4' });
          newFileName = result.name;
          newFileType = compressedFileBlob.type;
        } else {
            throw new Error(result?.error || "Ошибка сжатия медиа");
        }
      } else {
        compressedFileBlob = file; 
      }

      if (onStatusChange) onStatusChange('Отправка сжатого файла...');
      
      const compressedBuffer = await compressedFileBlob.arrayBuffer();
      const uploadRes = await window.api.invoke('upload-file', {
        fileBuffer: new Uint8Array(compressedBuffer),
        fileName: newFileName,
        fileType: newFileType
      });

      console.log(`[Media] ${newFileName} (compressed) готов за ${Date.now() - start}ms`);
      return uploadRes;

    } catch (e) {
      console.error('[Media] Критическая ошибка:', e);
      alert(`Ошибка загрузки: ${e.message}`);
      return { error: { message: e.message } };
    }
  },

  deleteFile: async (fileId) => {
    return window.api.call(`/files/${fileId}`, 'DELETE');
  },
};