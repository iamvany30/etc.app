/* @source src/utils/bookmarkUtils.js */
import { storage } from './storage';

const STORAGE_KEY = 'itd_local_bookmarks_v2'; 
const LEGACY_KEY = 'itd_local_bookmarks_v1';

let cache = {
    posts: [],
    folders: [
        { id: 'default', name: 'Все закладки', color: '#1d9bf0' }
    ]
};
let isInitialized = false;

export const bookmarkUtils = {
    init: async () => {
        if (isInitialized) return;
        
        const data = await storage.get(STORAGE_KEY);
        if (data && data.posts) {
            cache = data;
        } else {
            
            const legacyData = await storage.get(LEGACY_KEY);
            if (legacyData && Array.isArray(legacyData)) {
                cache.posts = legacyData.map(p => ({ ...p, folderId: 'default' }));
                await storage.set(STORAGE_KEY, cache);
            }
        }
        
        isInitialized = true;
        window.dispatchEvent(new Event('bookmarks-updated')); 
    },

    save: () => {
        storage.set(STORAGE_KEY, cache).catch(e => console.error(e));
        window.dispatchEvent(new Event('bookmarks-updated'));
    },

    getAll: (folderId = 'default') => {
        if (folderId === 'default') return cache.posts;
        return cache.posts.filter(p => p.folderId === folderId);
    },

    getFolders: () => cache.folders,

    createFolder: (name, color = '#794bc4') => {
        const id = 'folder_' + Date.now();
        cache.folders.push({ id, name, color });
        bookmarkUtils.save();
        return id;
    },

    deleteFolder: (id) => {
        if (id === 'default') return;
        cache.folders = cache.folders.filter(f => f.id !== id);
        
        cache.posts = cache.posts.map(p => p.folderId === id ? { ...p, folderId: 'default' } : p);
        bookmarkUtils.save();
    },

    movePost: (postId, folderId) => {
        const postIndex = cache.posts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
            cache.posts[postIndex].folderId = folderId;
            bookmarkUtils.save();
        }
    },

    isSaved: (postId) => cache.posts.some(p => p.id === postId),

    toggle: (post, folderId = 'default') => {
        const index = cache.posts.findIndex(p => p.id === post.id);
        let isSaved = false;

        if (index >= 0) {
            cache.posts.splice(index, 1);
        } else {
            cache.posts.unshift({ ...post, folderId });
            isSaved = true;
        }

        bookmarkUtils.save();
        return isSaved;
    }
};