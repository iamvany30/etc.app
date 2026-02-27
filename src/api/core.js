/* @source src/api/core.js */
import { UnifiedCache } from '../core/UnifiedCache';
import { getCachedUrl } from '../utils/assetHelper';

const MEDIA_KEYS = new Set(['url', 'avatar', 'cover', 'banner', 'image', 'src']);


const mapMediaUrls = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            if (typeof obj[i] === 'string' && obj[i].startsWith('asset://') && !obj[i].includes('?url=')) {
                obj[i] = null; 
            } else {
                mapMediaUrls(obj[i]);
            }
        }
    } else {
        for (const key of Object.keys(obj)) {
            if (typeof obj[key] === 'string') {
                
                if (obj[key].startsWith('http') && MEDIA_KEYS.has(key)) {
                    obj[key] = getCachedUrl(obj[key]);
                } 
                
                else if (obj[key].startsWith('asset://') && !obj[key].includes('?url=')) {
                    obj[key] = null; 
                }
            } else if (typeof obj[key] === 'object') {
                mapMediaUrls(obj[key]);
            }
        }
    }
};

export const request = async (endpoint, method = 'GET', body = null) => {
    try {
        if (!window.api || typeof window.api.call !== 'function') {
            throw new Error("INTERNAL_BRIDGE_ERROR");
        }
        
        const result = await window.api.call(endpoint, method, body);
        
        if (result?.error === 'Parse Error' || (result?.error && typeof result.error === 'string' && result.error.includes('Parse Error'))) {
            return {
                error: {
                    code: 'SERVER_ERROR',
                    message: result.raw || 'Произошла ошибка (неверный формат ответа)'
                }
            };
        }

        if (!result?.error && method === 'GET') {
            mapMediaUrls(result);
            UnifiedCache.analyzeAndCache(endpoint, result);
        }
        
        return result;
    } catch (e) {
        if (method === 'GET') {
            const cachedData = await UnifiedCache.getFallback(endpoint);
            if (cachedData) {
                mapMediaUrls(cachedData); 
                return cachedData;
            }
        }

        return { error: { message: e.message, code: "CLIENT_TRANSPORT_ERROR" } };
    }
};