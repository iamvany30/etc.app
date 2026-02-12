import { request } from '../core';

export const postsService = {
    getPosts: (tab = 'popular', cursor = null, limit = 20) => {
        let url = `/posts?limit=${limit}&tab=${tab}`;
        if (cursor) url += `&cursor=${cursor}`;
        return request(url, 'GET');
    },

    getPostDetails: (postId) => request(`/posts/${postId}`, 'GET'),
    
    createPost: (content, attachmentIds = []) => 
        request('/posts', 'POST', { content, attachmentIds }),
    
    deletePost: (postId) => request(`/posts/${postId}`, 'DELETE'),
    
    editPost: (postId, content) => request(`/posts/${postId}`, 'PUT', { content }),
    
     
    likePost: (postId) => request(`/posts/${postId}/like`, 'POST'),
    repostPost: (postId, content = "") => request(`/posts/${postId}/repost`, 'POST', { content }),
    pinPost: (postId) => request(`/posts/${postId}/pin`, 'POST'),
    unpinPost: (postId) => request(`/posts/${postId}/pin`, 'DELETE'),
    viewPost: (postId) => request(`/posts/${postId}/view`, 'POST'),
     
    addComment: (postId, content, attachmentIds = []) => 
        request(`/posts/${postId}/comments`, 'POST', { content, attachmentIds }),
};