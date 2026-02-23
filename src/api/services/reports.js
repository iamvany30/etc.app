import { request } from '../core';

export const reportsService = {
    createReport: ({ targetType, targetId, reason, description }) => 
        request('/reports', 'POST', { targetType, targetId, reason, description }),
};