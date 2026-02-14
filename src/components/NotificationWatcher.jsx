import { useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { apiClient } from '../api/client';


const DEFAULT_ICON = '/logo192.png'; 

const NotificationWatcher = () => {
    const { currentUser } = useUser();
    const lastNotificationIdRef = useRef(null);

    useEffect(() => {
        if (!currentUser) return;

        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const checkNotifications = async () => {
            try {
                
                const res = await apiClient.getNotifications('all', 0, 5);
                
                const list = res?.notifications || res?.data?.notifications || [];

                if (list.length === 0) return;

                const latest = list[0];

                
                if (!lastNotificationIdRef.current) {
                    lastNotificationIdRef.current = latest.id;
                    return;
                }

                
                if (latest.id !== lastNotificationIdRef.current) {
                    lastNotificationIdRef.current = latest.id;
                    if (!latest.read) {
                        showWindowsNotification(latest);
                    }
                }
            } catch (error) {
                console.error("Ошибка проверки уведомлений:", error);
            }
        };

        checkNotifications();
        const intervalId = setInterval(checkNotifications, 30000); 

        return () => clearInterval(intervalId);
    }, [currentUser]);

    return null;
};

function showWindowsNotification(notif) {
    if (Notification.permission !== 'granted') return;

    const actorName = notif.actor?.displayName || 'Пользователь';
    let title = 'итд.app'; 
    let body = 'Что-то произошло';

    
    switch (notif.type) {
        case 'like':
            title = 'Новый лайк';
            body = `${actorName} оценил(а) вашу запись: "${notif.preview || 'Пост'}"`;
            break;
        case 'comment':
            title = 'Новый комментарий';
            body = `${actorName} прокомментировал(а): "${notif.preview || ''}"`;
            break;
        case 'reply':
            title = 'Ответ на комментарий';
            body = `${actorName} ответил(а) вам: "${notif.preview || ''}"`;
            break;
        case 'repost':
            title = 'Репост';
            body = `${actorName} поделился(ась) вашей записью`;
            break;
        case 'follow':
            title = 'Новый подписчик';
            body = `${actorName} теперь читает вас!`;
            break;
        case 'mention':
            title = 'Упоминание';
            body = `${actorName} упомянул(а) вас в записи`;
            break;
        case 'wall_post':
            title = 'Запись на стене';
            body = `${actorName} оставил(а) запись в вашем профиле`;
            break;
        default:
            title = `Уведомление от ${actorName}`;
            body = notif.preview || 'Новое взаимодействие';
    }

    
    let iconUrl = DEFAULT_ICON;
    if (notif.actor?.avatar && notif.actor.avatar.startsWith('http')) {
        iconUrl = notif.actor.avatar;
    }

    
    const myNotification = new Notification(title, {
        body: body,
        icon: iconUrl,
        silent: false,
        tag: notif.id 
    });

    myNotification.onclick = () => {
        if (window.api && window.api.window) {
            
            window.api.window.maximize(); 
            window.focus();
            
            
            
        }
    };
}

export default NotificationWatcher;