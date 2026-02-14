import { request } from '../core';

export const notificationsService = {
    getNotificationsCount: () => request('/notifications/count', 'GET'),
    
    
    getNotifications: (tab = 'all', offset = 0, limit = 20) => {
        
        
        let url = `/notifications?limit=${limit}&offset=${offset}`;
        if (tab !== 'all') {
            url += `&type=${tab}`; 
        }
        
        return request(url, 'GET');
    },
    
    markBatchRead: (ids) => request('/notifications/read-batch', 'POST', { ids }),
    markAllRead: () => request('/notifications/read-all', 'POST'),
};