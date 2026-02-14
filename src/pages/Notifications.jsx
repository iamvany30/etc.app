import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import '../styles/Notifications.css';

import { 
    IconLikeFilled, 
    IconCommentFilled, 
    IconRepostFilled, 
    IconUserFilled, 
    IconMentionFilled, 
    IconWallPost 
} from '../components/icons/NotificationIcons';

const getNotificationTypeInfo = (type) => {
    switch (type) {
        case 'like':
            return { icon: <IconLikeFilled />, badgeClass: 'badge-like', text: 'оценил ваш пост' };
        case 'comment':
            return { icon: <IconCommentFilled />, badgeClass: 'badge-comment', text: 'прокомментировал ваш пост' };
        case 'reply':
            return { icon: <IconCommentFilled />, badgeClass: 'badge-reply', text: 'ответил на ваш комментарий' };
        case 'repost':
            return { icon: <IconRepostFilled />, badgeClass: 'badge-repost', text: 'сделал репост вашего поста' };
        case 'follow':
            return { icon: <IconUserFilled />, badgeClass: 'badge-follow', text: 'подписался на вас' };
        case 'mention':
            return { icon: <IconMentionFilled />, badgeClass: 'badge-mention', text: 'упомянул вас' };
        case 'wall_post':
            return { icon: <IconWallPost />, badgeClass: 'badge-wall', text: 'написал на вашей стене' };
        default:
            return { icon: <IconUserFilled />, badgeClass: 'badge-default', text: 'взаимодействовал с вами' };
    }
};

const TimeAgo = ({ dateStr }) => {
    const [time, setTime] = useState('');
    useEffect(() => {
        if (!dateStr) return;
        const calcTime = () => {
            const date = new Date(dateStr);
            const now = new Date();
            const diff = Math.round((now - date) / 1000);
            if (diff < 60) setTime(`${diff}с`);
            else if (diff < 3600) setTime(`${Math.floor(diff / 60)}м`);
            else if (diff < 86400) setTime(`${Math.floor(diff / 3600)}ч`);
            else setTime(date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }));
        };
        calcTime();
        const timer = setInterval(calcTime, 60000);
        return () => clearInterval(timer);
    }, [dateStr]);
    return <span className="notif-time">{time}</span>;
};

const NotificationItem = ({ notif }) => {
    const { actor, type, preview, createdAt, read, targetId, context } = notif;
    const { icon, badgeClass, text } = getNotificationTypeInfo(type);
    const itemRef = useRef(null);

    const getNotificationLink = () => {
        if (type === 'follow' || type === 'mention_user') {
            return `/profile/${actor.username}`;
        }
        if (targetId) {
            if ((type === 'comment' || type === 'reply') && context?.commentId) {
                return `/post/${targetId}#comment-${context.commentId}`;
            }
            return `/post/${targetId}`;
        }
        return `/profile/${actor.username}`;
    };

    useEffect(() => {
        if (read || !itemRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    apiClient.markBatchRead([notif.id]);
                    observer.disconnect();
                }
            },
            { threshold: 0.8 }
        );

        observer.observe(itemRef.current);
        return () => observer.disconnect();
    }, [notif.id, read]);

    return (
        <Link to={getNotificationLink()} className={`notification-item ${!read ? 'unread' : ''}`} ref={itemRef}>
            <div className="notif-avatar-wrap">
                <div className="notif-avatar">
                    {actor.avatar && actor.avatar.length > 4 ? (
                        <img src={actor.avatar} alt={actor.username} />
                    ) : (
                        actor.avatar || "👤"
                    )}
                </div>
                <div className={`notif-badge ${badgeClass}`}>
                    {icon}
                </div>
            </div>

            <div className="notif-content">
                <div className="notif-header">
                    <span className="notif-author">{actor.displayName}</span>
                    <span className="notif-action-text">{text}</span>
                </div>
                {preview && <div className="notif-preview">{preview}</div>}
                <TimeAgo dateStr={createdAt} />
            </div>
        </Link>
    );
};

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const LIMIT = 20;
    
    
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    
    const hasMoreRef = useRef(true);
    const isFetchingRef = useRef(false);
    
    
    const observerRef = useRef(null);
    const sentinelRef = useRef(null);
    const listRef = useRef(null); 

    const loadNotifications = useCallback(async (isInitial = false) => {
        if (isFetchingRef.current || (!isInitial && !hasMoreRef.current)) return;

        isFetchingRef.current = true;
        
        if (isInitial) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            
            
            
            const currentOffset = isInitial ? 0 : notifications.length;
            const apiTab = activeTab === 'mentions' ? 'mention' : 'all';
            
            
            const res = await apiClient.getNotifications(apiTab, currentOffset, LIMIT);
            
            const responseData = res?.data || res;
            
            const list = Array.isArray(responseData) ? responseData : (responseData?.notifications || []);

            if (isInitial) {
                setNotifications(list);
            } else {
                setNotifications(prev => [...prev, ...list]);
            }

            
            if (list.length < LIMIT) {
                hasMoreRef.current = false;
            } else {
                hasMoreRef.current = true;
            }

            if (isInitial && window.resetNotificationCount) {
                window.resetNotificationCount();
            }

        } catch (error) {
            console.error("Failed to load notifications", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            isFetchingRef.current = false;
        }
    }, [activeTab, notifications.length]); 

    
    useEffect(() => {
        hasMoreRef.current = true;
        setNotifications([]);
        loadNotifications(true);
    }, [activeTab]); 

    
    useEffect(() => {
        if (loading) return;

        const options = {
            root: listRef.current, 
            rootMargin: '400px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMoreRef.current && !isFetchingRef.current) {
                loadNotifications(false);
            }
        }, options);

        if (sentinelRef.current) {
            observer.observe(sentinelRef.current);
        }
        observerRef.current = observer;

        return () => {
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, [loading, loadNotifications, notifications.length]); 

    const handleMarkAllRead = async () => {
        try {
            await apiClient.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            if (window.resetNotificationCount) {
                window.resetNotificationCount();
            }
        } catch (e) {
            console.error("Failed to mark all as read:", e);
        }
    };

    return (
        <div className="notifications-page">
            <header className="notifications-header">
                <div className="notifications-header-top">
                    <h2 className="notifications-title">Уведомления</h2>
                    <button className="mark-read-btn" onClick={handleMarkAllRead}>
                        Прочитать все
                    </button>
                </div>
                <div className="notifications-tabs">
                    <button 
                        className={`notif-tab ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        Все
                    </button>
                    <button 
                        className={`notif-tab ${activeTab === 'mentions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('mentions')}
                    >
                        Упоминания
                    </button>
                </div>
            </header>

            <div className="notifications-list" ref={listRef}>
                {loading && notifications.length === 0 ? (
                    <div className="notifications-loading">Загрузка...</div>
                ) : notifications.length > 0 ? (
                    <>
                        {notifications.map((notif) => (
                            <NotificationItem key={notif.id} notif={notif} />
                        ))}
                        
                        
                        <div 
                            ref={sentinelRef} 
                            style={{ height: '40px', width: '100%', flexShrink: 0 }} 
                        >
                            {loadingMore && (
                                <div style={{ 
                                    textAlign: 'center', 
                                    padding: '10px', 
                                    color: 'var(--color-text-secondary)',
                                    fontSize: '13px' 
                                }}>
                                    Загрузка...
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="notifications-empty">
                        <h3>Уведомлений пока нет</h3>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;