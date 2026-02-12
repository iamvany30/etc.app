import { request } from '../core';

export const usersService = {
    getProfile: (username) => request(`/users/${username}`, 'GET'),
    
    updateProfile: (data) => request('/users/me', 'PUT', data),

     
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
};