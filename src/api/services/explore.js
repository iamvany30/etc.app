import { request } from '../core';

export const exploreService = {
    getExplore: () => request('/hashtags/trending?limit=10', 'GET'),
    
    getTopClans: () => request('/users/stats/top-clans', 'GET'),
    
    getHashtagPosts: (tag, cursor = null, limit = 20) => {
        const cleanTag = tag.replace('#', ''); 
        let url = `/hashtags/${encodeURIComponent(cleanTag)}/posts?limit=${limit}`;
        if (cursor) url += `&cursor=${cursor}`;
        return request(url, 'GET');
    },
};