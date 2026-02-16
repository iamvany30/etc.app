
import { apiClient } from '../api/client';

const cache = {
    popular: { posts: [], pagination: null, scrollIndex: 0, timestamp: 0 },
    subscribed: { posts: [], pagination: null, scrollIndex: 0, timestamp: 0 }
};

const CACHE_TTL = 10 * 60 * 1000; 

export const FeedCache = {
    get: (tab) => {
        const data = cache[tab];
        
        if (!data || data.posts.length === 0) return null;
        return data;
    },

    set: (tab, data) => {
        if (!cache[tab]) cache[tab] = {};
        cache[tab] = { ...cache[tab], ...data, timestamp: Date.now() };
    },

    saveScroll: (tab, index) => {
        if (cache[tab]) {
            cache[tab].scrollIndex = index;
        }
    },

    
    preload: async () => {
        console.log('[FeedCache] Starting background preload...');
        try {
            
            const res = await apiClient.getPosts('popular', null, 20);
            const data = res?.data || res;
            
            if (data?.posts?.length > 0) {
                cache.popular = {
                    posts: data.posts,
                    pagination: data.pagination,
                    scrollIndex: 0,
                    timestamp: Date.now()
                };
                console.log('[FeedCache] Popular feed preloaded');
            }
        } catch (e) {
            console.error('[FeedCache] Preload failed', e);
        }
    },

    clear: () => {
        cache.popular = { posts: [], pagination: null, scrollIndex: 0, timestamp: 0 };
        cache.subscribed = { posts: [], pagination: null, scrollIndex: 0, timestamp: 0 };
    }
};