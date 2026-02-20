const STORAGE_KEY = 'itd_local_bookmarks_v1';

export const bookmarkUtils = {
    
    getAll: () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error("Ошибка чтения закладок", e);
            return [];
        }
    },

    
    isSaved: (postId) => {
        const saved = bookmarkUtils.getAll();
        return saved.some(p => p.id === postId);
    },

    
    toggle: (post) => {
        const saved = bookmarkUtils.getAll();
        const index = saved.findIndex(p => p.id === post.id);
        let isSaved = false;

        if (index >= 0) {
            
            saved.splice(index, 1);
            isSaved = false;
        } else {
            
            
            saved.unshift(post);
            isSaved = true;
        }

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
            
            window.dispatchEvent(new Event('bookmarks-updated'));
        } catch (e) {
            alert('Не удалось сохранить: возможно, закончилось место в хранилище.');
        }

        return isSaved;
    }
};