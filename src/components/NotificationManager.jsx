import React, { useEffect, useState, useRef, useCallback } from 'react';
import { apiClient } from '../api/client';
import { useUser } from '../context/UserContext';

const NotificationManager = () => {
    const [toasts, setToasts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const lastActivity = useRef(Date.now());
    const batchReadIds = useRef(new Set());
    const batchTimer = useRef(null);

     
    useEffect(() => {
        const updateActivity = () => { lastActivity.current = Date.now(); };
        window.addEventListener('mousemove', updateActivity);
        window.addEventListener('keydown', updateActivity);
        return () => {
            window.removeEventListener('mousemove', updateActivity);
            window.removeEventListener('keydown', updateActivity);
        };
    }, []);

     
    useEffect(() => {
        if (!window.api.onNotification) return;

        window.api.onNotification((data) => {
             
            setToasts(prev => [...prev, { ...data, timestamp: Date.now() }].slice(-3));
            setUnreadCount(prev => prev + 1);
        });

         
        apiClient.getNotificationsCount().then(res => setUnreadCount(res?.count || 0));
    }, []);

     
    useEffect(() => {
        const timer = setInterval(() => {
            const now = Date.now();
            if (now - lastActivity.current < 5000) {  
                setToasts(prev => prev.filter(t => now - t.timestamp < 15000));
            }
        }, 1000);
        return () => clearInterval(timer);
    }, []);

     
    const markAsRead = useCallback((id) => {
        batchReadIds.current.add(id);
        if (batchTimer.current) clearTimeout(batchTimer.current);
        
        batchTimer.current = setTimeout(async () => {
            const ids = Array.from(batchReadIds.current);
            if (ids.length > 0) {
                await apiClient.markBatchRead(ids);
                batchReadIds.current.clear();
                setUnreadCount(prev => Math.max(0, prev - ids.length));
            }
        }, 500);  
    }, []);

     
    useEffect(() => {
        window.markNotificationRead = markAsRead;
    }, [markAsRead]);

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <div key={toast.id} className="notification-toast">
                    <div className="avatar-small">{toast.actor.avatar}</div>
                    <div className="toast-body">
                        <strong>{toast.actor.displayName}</strong>
                        <p>{toast.preview || 'Новое взаимодействие'}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default NotificationManager;