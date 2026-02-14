import { request } from '../core';


const API_DOMAIN = 'https://xn--d1ah4a.com/api';

export const usersService = {
    getProfile: (username) => request(`/users/${username}`, 'GET'),
    
    updateProfile: (data) => request('/users/me', 'PUT', data),

    
    updatePrivacy: (settings) => request('/users/me/privacy', 'PUT', settings),

    search: (q) => request(`/search?q=${encodeURIComponent(q)}&userLimit=5&hashtagLimit=5`, 'GET'),
    getSuggestions: () => request('/users/suggestions/who-to-follow', 'GET'),

    getUserPosts: (username, cursor = null, limit = 20) => {
        let url = `/posts/user/${username}?limit=${limit}&sort=new`;
        if (cursor) url += `&cursor=${cursor}`;
        return request(url, 'GET');
    },
    
    getUserLikedPosts: (username, cursor = null, limit = 20) => {
        let url = `/posts/user/${username}/liked?limit=${limit}`;
        if (cursor) url += `&cursor=${cursor}`;
        return request(url, 'GET');
    },

    followUser: (username) => request(`/users/${username}/follow`, 'POST'),
    unfollowUser: (username) => request(`/users/${username}/follow`, 'DELETE'),
    getFollowers: (username) => request(`/users/${username}/followers`, 'GET'),
    getFollowing: (username) => request(`/users/${username}/following`, 'GET'),

    

    
    sendLastSeen: () => {
        try {
            
            const userStr = localStorage.getItem('nowkie_user');
            if (!userStr) return;
            
            const user = JSON.parse(userStr);
            const token = user.accessToken;
            if (!token) return;

            
            
            fetch(`${API_DOMAIN}/users/me/offline`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ timestamp: new Date().toISOString() }),
                keepalive: true
            }).catch(e => console.error("Send last seen failed", e));
        } catch (e) {
            console.error("Error sending offline status", e);
        }
    }
};