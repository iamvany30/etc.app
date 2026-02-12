/* eslint-disable no-restricted-globals */

 
const MAX_IMAGE_SIZE = 2560;  
const WEBP_QUALITY = 0.8;     
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

/**
 * Обработчик сообщений от основного потока
 */
self.onmessage = async (e) => {
    const { id, file } = e.data;

    try {
        let resultFile = file;

        if (file.type.startsWith('image/')) {
            if (file.type !== 'image/gif') {
                resultFile = await processImage(file);
            }
        } 
        else if (file.type.startsWith('video/')) {
            resultFile = await processVideo(file);
        }

        self.postMessage({ 
            id, 
            success: true, 
            file: resultFile 
        });

    } catch (error) {
        console.error('Worker processing error:', error);
        self.postMessage({ 
            id, 
            success: false, 
            error: error.message 
        });
    }
};

 
async function processImage(file) {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
        if (width > height) {
            height = Math.round(height * (MAX_IMAGE_SIZE / width));
            width = MAX_IMAGE_SIZE;
        } else {
            width = Math.round(width * (MAX_IMAGE_SIZE / height));
            height = MAX_IMAGE_SIZE;
        }
    }
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await canvas.convertToBlob({ type: 'image/webp', quality: WEBP_QUALITY });
    const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
    return new File([blob], newName, { type: 'image/webp' });
}

async function processVideo(file) {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        return file;
    }
    const ext = file.name.split('.').pop();
    const cleanName = `video_${Date.now()}.${ext}`;
    return new File([file], cleanName, { type: file.type });
}