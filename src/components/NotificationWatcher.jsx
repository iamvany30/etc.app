/* @source src/components/NotificationWatcher.jsx */
import { useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { useIslandStore } from '../store/islandStore';
import { apiClient } from '../api/client';

const DEFAULT_ICON = '/logo192.png'; 

const generateEmojiIcon = (emoji) => {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.fillStyle = '#161b22'; 
        ctx.beginPath();
        ctx.arc(64, 64, 64, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '80px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji || '👤', 64, 72); 
        return canvas.toDataURL('image/png');
    } catch (e) {
        return null;
    }
};

const NotificationWatcher = () => {
    const currentUser = useUserStore(state => state.currentUser);
    const showIslandAlert = useIslandStore(state => state.showIslandAlert);

    useEffect(() => {
        if (!currentUser) return;

        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const removeListener = window.api.on('notification', (data) => {
            console.log('[Watcher] Incoming:', data);

            const notif = data.notification || data; 
            if (!notif || !notif.id) return;

            showNativeNotification(notif);

            window.dispatchEvent(new CustomEvent('notification-count-update', { 
                detail: { type: 'increment' } 
            }));

            const actor = notif.actor?.displayName || 'Пользователь';
            let msg = 'Новое уведомление';
            
            switch (notif.type) {
                case 'like': msg = `${actor} оценил(а) вашу запись`; break;
                case 'comment': msg = `${actor} прокомментировал(а)`; break;
                case 'reply': msg = `${actor} ответил(а) вам`; break;
                case 'follow': msg = `${actor} подписался(ась)`; break;
                case 'mention': msg = `${actor} упомянул(а) вас`; break;
            }
            
            const islandIcon = notif.actor?.avatar?.startsWith('http') ? '🔔' : (notif.actor?.avatar || '🔔');
            showIslandAlert('success', msg, islandIcon);
        });

        apiClient.getNotificationsCount().then(res => {
            if (res && res.count !== undefined) {
                window.dispatchEvent(new CustomEvent('notification-count-update', { 
                    detail: { type: 'set', value: res.count } 
                }));
            }
        }).catch(() => {});

        return () => {
            if (removeListener) removeListener();
        };
    }, [currentUser, showIslandAlert]);

    return null;
};

function showNativeNotification(notif) {
    if (Notification.permission !== 'granted') return;

    const actorName = notif.actor?.displayName || 'Пользователь';
    let title = 'итд.app'; 
    let body = notif.preview || 'Новое взаимодействие';
    
    switch (notif.type) {
        case 'like': title = 'Новый лайк'; body = `${actorName} оценил(а) запись`; break;
        case 'comment': title = 'Новый комментарий'; body = `${actorName}: ${notif.preview}`; break;
        case 'follow': title = 'Новый подписчик'; body = `${actorName} теперь читает вас!`; break;
        case 'mention': title = 'Вас упомянули'; body = `${actorName} упомянул(а) вас`; break;
    }

    let iconUrl = DEFAULT_ICON;
    const avatar = notif.actor?.avatar;

    if (avatar) {
        if (avatar.startsWith('http')) {
            iconUrl = avatar;
        } else {
            const generated = generateEmojiIcon(avatar);
            if (generated) iconUrl = generated;
        }
    }

    const n = new Notification(title, { 
        body, 
        icon: iconUrl, 
        silent: false,
        tag: notif.id 
    });

    n.onclick = () => {
        if (window.api && window.api.window) {
            window.api.window.maximize(); 
        }
        window.location.hash = '#/notifications';
    };
}

export default NotificationWatcher;