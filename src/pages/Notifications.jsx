/* @source src/pages/Notifications.jsx */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { NotificationSkeleton } from '../components/Skeletons';
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
        case 'like': return { icon: <IconLikeFilled />, badgeClass: 'badge-like', text: 'оценил(а) ваш пост' };
        case 'comment': return { icon: <IconCommentFilled />, badgeClass: 'badge-comment', text: 'прокомментировал(а) ваш пост' };
        case 'reply': return { icon: <IconCommentFilled />, badgeClass: 'badge-reply', text: 'ответил(а) на ваш комментарий' };
        case 'repost': return { icon: <IconRepostFilled />, badgeClass: 'badge-repost', text: 'сделал(а) репост вашего поста' };
        case 'follow': return { icon: <IconUserFilled />, badgeClass: 'badge-follow', text: 'подписался(ась) на вас' };
        case 'mention': return { icon: <IconMentionFilled />, badgeClass: 'badge-mention', text: 'упомянул(а) вас' };
        case 'wall_post': return { icon: <IconWallPost />, badgeClass: 'badge-wall', text: 'написал(а) на вашей стене' };
        default: return { icon: <IconUserFilled />, badgeClass: 'badge-default', text: 'взаимодействовал(а) с вами' };
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

const NotificationItem = React.memo(({ notif }) => {
    const { actor, type, preview, createdAt, read, targetId, context } = notif;
    const { icon, badgeClass, text } = getNotificationTypeInfo(type);
    const itemRef = useRef(null);

    const getNotificationLink = () => {
        if (type === 'follow' || type === 'mention_user') return `/profile/${actor.username}`;
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
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                apiClient.markBatchRead([notif.id]).catch(() => {});
                observer.disconnect();
            }
        }, { threshold: 0.1 });
        observer.observe(itemRef.current);
        return () => observer.disconnect();
    }, [notif.id, read]);

    return (
        <Link to={getNotificationLink()} className={`notification-item ${!read ? 'unread' : ''}`} ref={itemRef}>
            <div className="notif-avatar-container">
                <div className="notif-avatar-wrap">
                    <div className="avatar notif-avatar-img" style={{width: 48, height: 48, fontSize: 20}}>
                        {actor.avatar && actor.avatar.length > 5 ? <img src={actor.avatar} alt="" /> : (actor.avatar || "👤")}
                    </div>
                    <div className={`notif-type-badge ${badgeClass}`}>{icon}</div>
                </div>
            </div>
            <div className="notif-body">
                <div className="notif-header">
                    <span className="notif-actor-name">{actor.displayName}</span>
                    <span className="notif-action-text">{text}</span>
                    <span className="notif-dot">·</span>
                    <TimeAgo dateStr={createdAt} />
                </div>
                {preview && <div className="notif-preview-text">{preview}</div>}
            </div>
        </Link>
    );
});

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const hasMoreRef = useRef(true);
    const isFetchingRef = useRef(false);
    const sentinelRef = useRef(null);

    const loadNotifications = useCallback(async (isInitial = false) => {
        if (isFetchingRef.current || (!isInitial && !hasMoreRef.current)) return;

        isFetchingRef.current = true;
        if (isInitial) {
            setLoading(true);
            setNotifications([]);
        } else {
            setLoadingMore(true);
        }

        try {
            const currentOffset = isInitial ? 0 : notifications.length;
            const typeParam = activeTab === 'mentions' ? 'mention' : 'all';

            const res = await apiClient.getNotifications(typeParam, currentOffset, 20);

            const list = res?.notifications || res?.data?.notifications || (Array.isArray(res) ? res : []);

            if (Array.isArray(list)) {
                setNotifications(prev => isInitial ? list : [...prev, ...list]);
                hasMoreRef.current = list.length === 20;
            } else {
                hasMoreRef.current = false;
            }

            if (isInitial && activeTab === 'all' && window.resetNotificationCount) {
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
        loadNotifications(true);
    }, [activeTab]);

    
    useEffect(() => {
        if (loading) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !isFetchingRef.current && hasMoreRef.current) {
                loadNotifications(false);
            }
        }, { rootMargin: '200px' });

        const currentSentinel = sentinelRef.current;
        if (currentSentinel) observer.observe(currentSentinel);

        return () => {
            if (currentSentinel) observer.unobserve(currentSentinel);
        };
    }, [loadNotifications, loading]);

    const handleMarkAllRead = async () => {
        try {
            await apiClient.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            if (window.resetNotificationCount) window.resetNotificationCount();
        } catch (e) {}
    };

    return (
        <div className="notifications-page">
            <div className="sticky-header">
                <div className="notifications-top-bar">
                    <h2 className="sticky-header-title">Уведомления</h2>
                    <button className="mark-all-read-btn" onClick={handleMarkAllRead}>
                        Прочитать все
                    </button>
                </div>
                <div className="sticky-tabs">
                    <button
                        className={`sticky-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        Все
                    </button>
                    <button
                        className={`sticky-tab-btn ${activeTab === 'mentions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('mentions')}
                    >
                        Упоминания
                    </button>
                </div>
            </div>

            <div className="notifications-list-scroll">
                {}
                {loading ? (
                    <div className="notifications-list">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                            <NotificationSkeleton key={i} />
                        ))}
                    </div>
                ) : notifications.length > 0 ? (
                    
                    <div className="notifications-list content-fade-in">
                        {notifications.map((notif) => (
                            <NotificationItem key={notif.id} notif={notif} />
                        ))}

                        <div ref={sentinelRef} style={{ height: '20px', width: '100%' }} />

                        {loadingMore && <div className="notif-more-loader"><NotificationSkeleton /></div>}
                    </div>
                ) : (
                    
                    <div className="notif-empty-state content-fade-in">
                        <div className="notif-empty-icon">🔔</div>
                        <h3>Здесь пока ничего нет</h3>
                        <p>События появятся, когда кто-то оценит ваши посты или подпишется.</p>
                    </div>
                )}
                
                {}
                <div style={{ height: '140px' }} />
            </div>
        </div>
    );
};

export default NotificationsPage;