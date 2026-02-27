import { request } from '../core';

export const usersService = {
    getProfile: (username) => request(`/users/${username}`, 'GET'),
    updateProfile: (data) => request('/users/me', 'PUT', data),
    
    getPrivacySettings: async () => {
        const res = await request('/users/me/privacy', 'GET');
        console.log('[API] /users/me/privacy RAW:', res);
        return res;
    },
    updatePrivacySettings: (settings) => request('/users/me/privacy', 'PUT', settings),
    
    search: (q) => request(`/search?q=${encodeURIComponent(q)}&userLimit=5&hashtagLimit=5`, 'GET'),
    advancedSearch: ({ q, type = 'all', sort = 'relevance', limit = 20, cursor = null }) => {
        let url = `/search?q=${encodeURIComponent(q)}&type=${type}&sort=${sort}&limit=${limit}`;
        if (cursor) url += `&cursor=${cursor}`;
        return request(url, 'GET');
    },

    getSuggestions: () => request('/users/suggestions/who-to-follow', 'GET'),
    
    getUserPosts: (username, cursor = null, limit = 20, pinnedPostId = null) => {
        let url = `/posts/user/${username}?limit=${limit}&sort=new`;
        if (cursor) url += `&cursor=${cursor}`;
        if (pinnedPostId) url += `&pinnedPostId=${pinnedPostId}`;
        return request(url, 'GET');
    },

    getUserLikedPosts: (username, cursor = null, limit = 20) => request(`/posts/user/${username}/liked?limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`, 'GET'),
    followUser: (username) => request(`/users/${username}/follow`, 'POST'),
    unfollowUser: (username) => request(`/users/${username}/follow`, 'DELETE'),
    getFollowers: (username) => request(`/users/${username}/followers`, 'GET'),
    getFollowing: (username) => request(`/users/${username}/following`, 'GET'),
    sendLastSeen: () => request('/users/me/offline', 'POST', { timestamp: new Date().toISOString() }).catch(() => {}),
    getVerificationStatus: () => request('/verification/status', 'GET'),
    submitVerification: (data) => request('/verification/submit', 'POST', data),
    deleteAccount: (password) => request('/users/me', 'DELETE', { password }),
    exportData: () => request('/users/me/export', 'GET'),

    getMyPins: async () => {
        const res = await request('/users/me/pins', 'GET');
        console.log('[API] /users/me/pins RAW:', res);
        
        if (res.error) return res;
        
        const pinsList = res.pins || res.data?.pins || [];
        const activePin = res.activePin || res.data?.activePin || null;
        
        return {
            data: pinsList.map(n => ({
                slug: n.slug,
                name: n.name,
                description: n.description,
                isActive: n.slug === activePin
            }))
        };
    },
    setActivePin: (slug) => request('/users/me/pin', 'PUT', { slug }),
    removeActivePin: () => request('/users/me/pin', 'DELETE'),
    blockUser: (username) => request(`/users/${username}/block`, 'POST'),
    unblockUser: (username) => request(`/users/${username}/block`, 'DELETE'),
    getBlockedUsers: (page = 1, limit = 20) => request(`/users/me/blocked?page=${page}&limit=${limit}`, 'GET')
};