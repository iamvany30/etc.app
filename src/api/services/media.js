import { mediaProcessor } from '../mediaProcessor';
export const mediaService = {
  uploadFile: async (file) => {
    const compressEnabled = localStorage.getItem('itd_compress_files') !== 'false';
    const useGpu = localStorage.getItem('itd_use_gpu') === 'true';  

    try {
      let fileToUpload = file;
      let fileName = file.name;
      let fileType = file.type;

      if (compressEnabled) {
        const isImage = file.type.startsWith('image/') && file.type !== 'image/gif';
        const isVideo = file.type.startsWith('video/');
        const isAudio = file.type.startsWith('audio/');

        if (isImage) {
          console.log('[MediaService] Сжатие изображения через Worker...');
          fileToUpload = await mediaProcessor.process(file);
          fileName = fileToUpload.name;
          fileType = fileToUpload.type;
        } 
        else if ((isAudio || isVideo) && window.api) {
          console.log(`[MediaService] Сжатие ${isAudio ? 'аудио' : 'видео'} через Electron...`);
          const arrayBuffer = await file.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          let result = null;

          if (isAudio) {
            result = await window.api.invoke('compress-audio', { data: uint8Array, name: file.name });
            fileType = 'audio/mpeg';
          } else {
            result = await window.api.invoke('compress-video', { data: uint8Array, name: file.name, useGpu });
            fileType = 'video/mp4';
          }

          if (result && !result.error && result.data) {
            console.log('[MediaService] Сжатие успешно. Новый размер:', (result.data.length / 1024 / 1024).toFixed(2), 'MB');
            fileToUpload = new Blob([result.data], { type: fileType });
            fileName = result.name;
          } else {
            console.warn('[MediaService] Сжатие не удалось, будет загружен оригинальный файл. Причина:', result?.error);
          }
        }
      }

      console.log(`[MediaService] Отправка файла на загрузку: ${fileName}`);
      const fileBuffer = await fileToUpload.arrayBuffer();
      
      const result = await window.api.invoke('upload-file', {
        fileBuffer: new Uint8Array(fileBuffer),
        fileName: fileName,
        fileType: fileType,
      });

      if (result.error) {
        console.error('[MediaService] Ошибка загрузки через Electron:', result.error.message);
        return { error: { message: result.error.message } };
      }

      console.log('[MediaService] Загрузка успешна:', result.data);
      return { data: result.data };

    } catch (e) {
      console.error('[MediaService] Критическая ошибка при загрузке файла:', e);
      return { error: { message: e.message || "Не удалось загрузить файл" } };
    }
  },

  deleteFile: async (fileId) => {
    return window.api.call(`/files/${fileId}`, 'DELETE');
  },
};