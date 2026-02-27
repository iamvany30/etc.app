/* @source src/utils/assetHelper.js */

export const getCachedUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    
    if (url.startsWith('asset://') && !url.includes('?url=')) {
        return null; 
    }

    
    if (url.startsWith('data:') || url.startsWith('file:') || url.startsWith('asset://') || url.includes('localhost')) {
        return url;
    }

    
    return `asset://media/?url=${encodeURIComponent(url)}`;
};