import { request } from '../core';

export const authService = {
    logout: () => request('/v1/auth/logout', 'POST'),
    
    changePassword: (oldPassword, newPassword) => 
        request('/v1/auth/change-password', 'POST', { oldPassword, newPassword }),
        
    getMe: () => request('/profile', 'GET'),
    
     
    getPrivacySettings: () => request('/users/me/privacy', 'GET'),
    updatePrivacySettings: (data) => request('/users/me/privacy', 'PUT', data),
};