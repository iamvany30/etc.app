/* @source src/components/NotificationWatcher.jsx */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { useIslandStore } from '../store/islandStore';
import { apiClient } from '../api/client';

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
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '64px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji || '👤', 64, 68); 
        return canvas.toDataURL('image/png');
    } catch (e) {
        return null;
    }
};

const getIconDataUrl = async (avatar) => {
    if (!avatar) return generateEmojiIcon('👤');
    if (typeof avatar === 'string' && avatar.startsWith('http')) {
        try {
            const res = await window.api.invoke('utils:fetch-base64', avatar);
            if (res) return res;
        } catch(e) {
            console.error("Ошибка загрузки аватарки", e);
        }
        return generateEmojiIcon('👤');
    }
    return generateEmojiIcon(avatar);
};

const NotificationWatcher = () => {
    const currentUser = useUserStore(state => state.currentUser);
    const showIslandAlert = useIslandStore(state => state.showIslandAlert);
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) return;

        
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const removeActionSub = window.api.on('notification-action', async (data) => {
            const { action, replyText, payload } = data;
            if (!payload) return;

            if (action === 'click') {
                if (payload.type === 'follow') {
                    navigate(`/profile/${payload.actorUsername}`);
                } else if (payload.targetId) {
                    if ((payload.type === 'comment' || payload.type === 'reply') && payload.context?.commentId) {
                        navigate(`/post/${payload.targetId}#comment-${payload.context.commentId}`);
                    } else {
                        navigate(`/post/${payload.targetId}`);
                    }
                } else {
                    navigate(`/profile/${payload.actorUsername}`);
                }
            } else if (action === 'reply' && replyText) {
                if (payload.targetId) {
                    try {
                        if ((payload.type === 'comment' || payload.type === 'reply') && payload.context?.commentId) {
                            await apiClient.addReply(payload.context.commentId, replyText, [], payload.actorId);
                        } else {
                            await apiClient.addComment(payload.targetId, replyText, []);
                        }
                        showIslandAlert('success', 'Ответ отправлен', '💬');
                    } catch (e) {
                        showIslandAlert('error', 'Ошибка отправки ответа', '❌');
                    }
                }
            }
        });

        const removeListener = window.api.on('notification', (data) => {
            console.log('[Watcher] Incoming:', data);
            const notif = data.notification || data; 
            if (!notif || !notif.id) return;

            window.dispatchEvent(new CustomEvent('notification-count-update', { 
                detail: { type: 'increment' } 
            }));

            const actorName = notif.actor?.displayName || 'Пользователь';
            let title = 'итд.app'; 
            let body = notif.preview || 'Новое взаимодействие';
            let hasReply = false;
            let msg = 'Новое уведомление';
            
            switch (notif.type) {
                case 'like': 
                    title = 'Новый лайк'; body = `${actorName} оценил(а) запись`; msg = `${actorName} оценил(а) вашу запись`; 
                    break;
                case 'comment': 
                    title = 'Новый комментарий'; body = `${actorName}: ${notif.preview}`; hasReply = true; msg = `${actorName} прокомментировал(а)`; 
                    break;
                case 'reply': 
                    title = 'Новый ответ'; body = `${actorName}: ${notif.preview}`; hasReply = true; msg = `${actorName} ответил(а) вам`; 
                    break;
                case 'follow': 
                    title = 'Новый подписчик'; body = `${actorName} теперь читает вас!`; msg = `${actorName} подписался(ась)`; 
                    break;
                case 'mention': 
                    title = 'Вас упомянули'; body = `${actorName} упомянул(а) вас`; msg = `${actorName} упомянул(а) вас`; 
                    break;
            }

            
            const islandIcon = (typeof notif.actor?.avatar === 'string' && notif.actor?.avatar.startsWith('http')) 
                ? '🔔' 
                : (notif.actor?.avatar || '🔔');
            showIslandAlert('success', msg, islandIcon);

            
            getIconDataUrl(notif.actor?.avatar).then(iconUrl => {
                const payload = {
                    type: notif.type,
                    targetId: notif.targetId,
                    context: notif.context,
                    actorUsername: notif.actor?.username,
                    actorId: notif.actor?.id
                };

                const triggerFallback = () => {
                    console.log("[Watcher] Используем HTML5 fallback уведомление");
                    if (Notification.permission === 'granted') {
                        const fb = new window.Notification(title, { body, silent: false });
                        fb.onclick = () => {
                            if (window.api && window.api.window) window.api.window.maximize();
                            if (notif.targetId) navigate(`/post/${notif.targetId}`);
                        };
                    }
                };

                
                window.api.invoke('app:get-version').then(version => {
                    
                    window.api.invoke('app:show-notification', {
                        title, body, icon: iconUrl, hasReply, payload
                    }).then((res) => {
                        
                        if (res && res.success === false) triggerFallback();
                    }).catch(err => {
                        console.error('Нативный вызов недоступен:', err);
                        triggerFallback();
                    });
                }).catch(() => triggerFallback());
            });
        });

        apiClient.getNotificationsCount().then(res => {
            if (res && res.count !== undefined) {
                window.dispatchEvent(new CustomEvent('notification-count-update', { detail: { type: 'set', value: res.count } }));
            }
        }).catch(() => {});

        return () => {
            if (removeListener) {
                if (typeof removeListener === 'function') removeListener();
                else if (removeListener.removeListener) removeListener.removeListener();
            }
            if (removeActionSub) {
                if (typeof removeActionSub === 'function') removeActionSub();
                else if (removeActionSub.removeListener) removeActionSub.removeListener();
            }
        };
    }, [currentUser, showIslandAlert, navigate]);

    return null;
};

export default NotificationWatcher;