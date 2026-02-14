import { request } from '../core';

export const postsService = {
    getPosts: (tab = 'popular', cursor = null, limit = 20) => {
        let url = `/posts?limit=${limit}&tab=${tab}`;
        if (cursor) url += `&cursor=${cursor}`;
        return request(url, 'GET');
    },

    getPostDetails: (postId) => request(`/posts/${postId}`, 'GET'),
    
    createPost: (content, attachmentIds = [], poll = null, spans = []) => {
        const body = { content, attachmentIds, poll, spans };
        if (!attachmentIds || attachmentIds.length === 0) delete body.attachmentIds;
        if (!poll) delete body.poll;
        if (!spans || spans.length === 0) delete body.spans;
        return request('/posts', 'POST', body);
    },
    
    deletePost: (postId) => request(`/posts/${postId}`, 'DELETE'),
    
    editPost: (postId, content) => request(`/posts/${postId}`, 'PUT', { content }),
    
    likePost: (postId) => request(`/posts/${postId}/like`, 'POST'),
    repostPost: (postId, content = "") => request(`/posts/${postId}/repost`, 'POST', { content }),
    removeRepost: (postId) => request(`/posts/${postId}/repost`, 'DELETE'),
    
    pinPost: (postId) => request(`/posts/${postId}/pin`, 'POST'),
    unpinPost: (postId) => request(`/posts/${postId}/pin`, 'DELETE'),
    viewPost: (postId) => request(`/posts/${postId}/view`, 'POST'),
     
    
    addComment: (postId, content, attachmentIds = []) => 
        request(`/posts/${postId}/comments`, 'POST', { content, attachmentIds }),

    
    addReply: (commentId, content, attachmentIds = [], replyToUserId) => 
        request(`/comments/${commentId}/replies`, 'POST', { 
            content, 
            attachmentIds, 
            replyToUserId 
        }),
    
    votePoll: (postId, optionIds) => request(`/posts/${postId}/poll/vote`, 'POST', { optionIds }),
};