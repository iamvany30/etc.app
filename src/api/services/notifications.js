import { request } from '../core';

export const notificationsService = {
    getNotificationsCount: () => request('/notifications/count', 'GET'),
    
    getNotifications: (tab = 'all', cursor = null, limit = 20) => {
        let url = `/notifications?tab=${tab}&limit=${limit}`;
        if (cursor) url += `&cursor=${cursor}`;
        return request(url, 'GET');
    },
    
    markBatchRead: (ids) => request('/notifications/read-batch', 'POST', { ids }),
    markAllRead: () => request('/notifications/read-all', 'POST'),
};