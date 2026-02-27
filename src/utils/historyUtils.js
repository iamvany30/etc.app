/* @source src/utils/historyUtils.js */
import { storage } from './storage';

const STORAGE_KEY = 'itd_local_history_v1';

let memoryCache = [];
let isInitialized = false;
let limit = parseInt(localStorage.getItem('itd_history_limit') || '100');

export const historyUtils = {
    init: async () => {
        if (isInitialized) return;
        const data = await storage.get(STORAGE_KEY);
        if (data) memoryCache = data;
        isInitialized = true;
        window.dispatchEvent(new Event('history-updated'));
    },

    getAll: () => memoryCache,

    add: (post) => {
        if (!post || !post.id) return;

        
        memoryCache = memoryCache.filter(p => p.id !== post.id);
        
        memoryCache.unshift(post);

        
        if (memoryCache.length > limit) {
            memoryCache = memoryCache.slice(0, limit);
        }

        storage.set(STORAGE_KEY, memoryCache).catch(e => console.error(e));
        window.dispatchEvent(new Event('history-updated'));
    },

    clear: () => {
        memoryCache = [];
        storage.remove(STORAGE_KEY).catch(e => console.error(e));
        window.dispatchEvent(new Event('history-updated'));
    },

    setLimit: (newLimit) => {
        limit = parseInt(newLimit);
        localStorage.setItem('itd_history_limit', limit);
        
        
        if (memoryCache.length > limit) {
            memoryCache = memoryCache.slice(0, limit);
            storage.set(STORAGE_KEY, memoryCache).catch(e => console.error(e));
            window.dispatchEvent(new Event('history-updated'));
        }
    },

    getLimit: () => limit
};