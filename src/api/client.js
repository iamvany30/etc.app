/**
 * src/api/client.js
 */


const convertToJpeg = (file) => {
    return new Promise((resolve) => {
        
        if (file.type === 'image/gif' || !file.type.startsWith('image/')) {
            return resolve(file);
        }

        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob(blob => {
                if (!blob) return resolve(file); 
                const f = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: 'image/jpeg' });
                resolve(f);
            }, 'image/jpeg', 0.85);
        };
        img.onerror = () => resolve(file);
    });
};


const safeCall = async (endpoint, method, body) => {
    try {
        const result = await window.api.call(endpoint, method, body);
        
        if (result?.error?.code === 'NETWORK_ERROR') {
            console.error("Network Error:", result.error.message);
        }
        
        return result;
    } catch (e) {
        console.error("Client call error:", e);
        return { error: { message: "Unknown Client Error" } };
    }
};

export const apiClient = {
    
    uploadFile: async (file) => {
        try {
            let processedFile = file;

            if (file.type.startsWith('image/') && file.type !== 'image/gif') {
                processedFile = await convertToJpeg(file);
            }

            const arrayBuffer = await processedFile.arrayBuffer();
            
            return safeCall('/files/upload', 'POST', {
                file: {
                    name: processedFile.name,
                    type: processedFile.type,
                    data: new Uint8Array(arrayBuffer)
                }
            });
        } catch (e) {
            return { error: e.message };
        }
    },

    
    getExplore: () => safeCall('/hashtags/trending?limit=10', 'GET'),
    getTopClans: () => safeCall('/users/stats/top-clans', 'GET'),
    getSuggestions: () => safeCall('/users/suggestions/who-to-follow', 'GET'),
    
    
    search: (q) => safeCall(`/search?q=${encodeURIComponent(q)}&userLimit=5&hashtagLimit=5`, 'GET'),

    
    
    getHashtagPosts: (tag, cursor = null, limit = 20) => {
        const cleanTag = tag.replace('#', ''); 
        let url = `/hashtags/${encodeURIComponent(cleanTag)}/posts?limit=${limit}`;
        if (cursor) url += `&cursor=${cursor}`;
        return safeCall(url, 'GET');
    },
    
    
    getPosts: (tab = 'popular', cursor = null, limit = 20) => {
        let url = `/posts?limit=${limit}&tab=${tab}`;
        if (cursor) url += `&cursor=${cursor}`;
        return safeCall(url, 'GET');
    },
    
    createPost: (content, attachmentIds = []) => safeCall('/posts', 'POST', { content, attachmentIds }),
    likePost: (postId) => safeCall(`/posts/${postId}/like`, 'POST'),
    repostPost: (postId, content = "") => safeCall(`/posts/${postId}/repost`, 'POST', { content }),
    
    
    getPostDetails: (postId) => safeCall(`/posts/${postId}`, 'GET'),
    
    deletePost: (postId) => safeCall(`/posts/${postId}`, 'DELETE'),
    editPost: (postId, content) => safeCall(`/posts/${postId}`, 'PUT', { content }),
    pinPost: (postId) => safeCall(`/posts/${postId}/pin`, 'POST'),
    unpinPost: (postId) => safeCall(`/posts/${postId}/pin`, 'DELETE'),
    
    
    addComment: (postId, content) => safeCall(`/posts/${postId}/comments`, 'POST', { content }),

    
    getProfile: (username) => safeCall(`/users/${username}`, 'GET'),
    updateProfile: (data) => safeCall('/users/me', 'PUT', data),
    
    getUserPosts: (username, cursor = null, limit = 20) => {
        let url = `/posts/user/${username}?limit=${limit}&sort=new`;
        if (cursor) url += `&cursor=${cursor}`;
        return safeCall(url, 'GET');
    },
    
    getUserLikedPosts: (username, cursor = null, limit = 20) => {
        let url = `/posts/user/${username}/liked?limit=${limit}`;
        if (cursor) url += `&cursor=${cursor}`;
        return safeCall(url, 'GET');
    },

    
    followUser: (username) => safeCall(`/users/${username}/follow`, 'POST'),
    unfollowUser: (username) => safeCall(`/users/${username}/follow`, 'DELETE'),
    getFollowers: (username) => safeCall(`/users/${username}/followers`, 'GET'),
    getFollowing: (username) => safeCall(`/users/${username}/following`, 'GET'),
    
    
    getNotificationsCount: () => safeCall('/notifications/count', 'GET'),
    
    getNotifications: (tab = 'all', cursor = null, limit = 20) => {
        let url = `/notifications?tab=${tab}&limit=${limit}`;
        if (cursor) url += `&cursor=${cursor}`;
        return safeCall(url, 'GET');
    },
    
    markBatchRead: (ids) => safeCall('/notifications/read-batch', 'POST', { ids }),
    markAllRead: () => safeCall('/notifications/read-all', 'POST'),
    
    
    getMe: () => safeCall('/profile', 'GET'),
    
    changePassword: (oldPassword, newPassword) => 
        safeCall('/v1/auth/change-password', 'POST', { oldPassword, newPassword }),

    getPrivacySettings: () => safeCall('/users/me/privacy', 'GET'),
    updatePrivacySettings: (data) => safeCall('/users/me/privacy', 'PUT', data),
};