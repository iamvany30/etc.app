import { useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { apiClient } from '../api/client';

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
                 
                const res = await apiClient.getNotifications('all', null, 5);
                
                 
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

    const actorName = notif.actor?.displayName || 'Кто-то';
    let title = 'Новое событие';
    let body = 'Что-то произошло в профиле';

    switch (notif.type) {
        case 'like':
            title = `${actorName} оценил(а)`;
            body = notif.preview || 'Ваш пост понравился';
            break;
        case 'comment':
            title = `${actorName} прокомментировал(а)`;
            body = notif.preview || 'Новый комментарий под постом';
            break;
        case 'repost':
            title = `${actorName} сделал(а) репост`;
            body = notif.preview || 'Вашим постом поделились';
            break;
        case 'follow':
            title = 'Новый подписчик';
            body = `${actorName} теперь читает вас`;
            break;
        case 'mention':
            title = `${actorName} упомянул(а) вас`;
            body = notif.preview || 'Вас упомянули в посте';
            break;
        case 'wall_post':
            title = `${actorName} написал(а) на стене`;
            body = notif.preview || 'Новая запись в профиле';
            break;
        default:
            title = `Уведомление от ${actorName}`;
            body = notif.preview || 'Новое действие';
    }

    const myNotification = new Notification(title, {
        body: body,
        icon: notif.actor?.avatar || undefined,
        silent: false 
    });

    myNotification.onclick = () => {
        if (window.api && window.api.window) {
            window.focus(); 
        }
    };
}

export default NotificationWatcher;