/* @source src/utils/bookmarkUtils.js */
import { storage } from './storage';

const STORAGE_KEY = 'itd_local_bookmarks_v1';


let memoryCache = [];
let isInitialized = false;

export const bookmarkUtils = {
    
    init: async () => {
        if (isInitialized) return;
        const data = await storage.get(STORAGE_KEY);
        if (data) memoryCache = data;
        isInitialized = true;
        window.dispatchEvent(new Event('bookmarks-updated')); 
    },

    getAll: () => memoryCache,

    isSaved: (postId) => {
        return memoryCache.some(p => p.id === postId);
    },

    toggle: (post) => {
        const index = memoryCache.findIndex(p => p.id === post.id);
        let isSaved = false;

        if (index >= 0) {
            memoryCache.splice(index, 1);
            isSaved = false;
        } else {
            memoryCache.unshift(post);
            isSaved = true;
        }

        
        storage.set(STORAGE_KEY, memoryCache).catch(e => console.error(e));
        window.dispatchEvent(new Event('bookmarks-updated'));

        return isSaved;
    }
};