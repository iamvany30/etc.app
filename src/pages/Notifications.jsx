/* @source src/pages/Notifications.jsx */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { NotificationSkeleton } from '../components/Skeletons';
import ScrollArea from '../components/ScrollArea';
import '../styles/Notifications.css';

import {
    Heart,
    ChatRoundDots,
    Repeat,
    UserPlus,
    MentionCircle,
    DocumentText,
    Bell,
    CheckRead
} from "@solar-icons/react";


const getNotificationTypeInfo = (type) => {
    switch (type) {
        case 'like': 
            return { icon: <Heart variant="Bold" size={14} />, badgeClass: 'badge-like', text: 'оценил(а) ваш пост' };
        case 'comment': 
            return { icon: <ChatRoundDots variant="Bold" size={14} />, badgeClass: 'badge-comment', text: 'прокомментировал(а)' };
        case 'reply': 
            return { icon: <ChatRoundDots variant="Bold" size={14} />, badgeClass: 'badge-reply', text: 'ответил(а) вам' };
        case 'repost': 
            return { icon: <Repeat variant="Bold" size={14} />, badgeClass: 'badge-repost', text: 'сделал(а) репост' };
        case 'follow': 
            return { icon: <UserPlus variant="Bold" size={14} />, badgeClass: 'badge-follow', text: 'подписался(ась) на вас' };
        case 'mention': 
        case 'mention_user':
            return { icon: <MentionCircle variant="Bold" size={14} />, badgeClass: 'badge-mention', text: 'упомянул(а) вас' };
        case 'wall_post': 
            return { icon: <DocumentText variant="Bold" size={14} />, badgeClass: 'badge-wall', text: 'написал(а) на стене' };
        default: 
            return { icon: <Bell variant="Bold" size={14} />, badgeClass: 'badge-default', text: 'взаимодействовал(а)' };
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
    const navigate = useNavigate();
    const { actor, type, preview, createdAt, read, targetId, context } = notif;
    const { icon, badgeClass, text } = getNotificationTypeInfo(type);
    const itemRef = useRef(null);

    useEffect(() => {
        if (read || !itemRef.current) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                apiClient.markBatchRead([notif.id]).then(() => {
                    window.dispatchEvent(new CustomEvent('notification-count-update', { 
                        detail: { type: 'decrement' } 
                    }));
                }).catch(() => {});
                observer.disconnect();
            }
        }, { threshold: 0.5 });
        observer.observe(itemRef.current);
        return () => observer.disconnect();
    }, [notif.id, read]);

    
    const handleMainClick = (e) => {
        if (type === 'follow') {
            navigate(`/profile/${actor.username}`);
            return;
        }
        
        if (targetId) {
            if ((type === 'comment' || type === 'reply') && context?.commentId) {
                navigate(`/post/${targetId}#comment-${context.commentId}`);
            } else {
                navigate(`/post/${targetId}`);
            }
        } else {
            navigate(`/profile/${actor.username}`);
        }
    };

    const handleProfileClick = (e) => {
        e.stopPropagation(); 
        navigate(`/profile/${actor.username}`);
    };

    return (
        <div 
            className={`notification-item ${!read ? 'unread' : ''}`} 
            ref={itemRef}
            onClick={handleMainClick}
        >
            <div className="notif-avatar-section">
                <div className="notif-avatar-wrapper" onClick={handleProfileClick}>
                    <div className="avatar notif-avatar">
                        {actor.avatar && actor.avatar.length > 5 
                            ? <img src={actor.avatar} alt={actor.username} /> 
                            : (actor.avatar || "👤")}
                    </div>
                    <div className={`notif-badge ${badgeClass}`}>
                        {icon}
                    </div>
                </div>
            </div>

            <div className="notif-content">
                <div className="notif-header-line">
                    <span className="notif-actor-link" onClick={handleProfileClick}>
                        {actor.displayName}
                    </span>
                    <span className="notif-action-text">{text}</span>
                    <span className="notif-dot">·</span>
                    <TimeAgo dateStr={createdAt} />
                </div>
                
                {preview && (
                    <div className="notif-preview-bubble">
                        {preview}
                    </div>
                )}
            </div>

            {!read && <div className="notif-unread-dot" />}
        </div>
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

    useEffect(() => {
        window.dispatchEvent(new CustomEvent('notification-count-update', { 
            detail: { type: 'reset' } 
        }));
    }, []);

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
        return () => { if (currentSentinel) observer.unobserve(currentSentinel); };
    }, [loadNotifications, loading]);

    const handleMarkAllRead = async () => {
        try {
            await apiClient.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            window.dispatchEvent(new CustomEvent('notification-count-update', { 
                detail: { type: 'reset' } 
            }));
        } catch (e) {}
    };

    return (
        <div className="notifications-page">
            <header className="notif-sticky-header">
                <div className="notif-header-top">
                    <h2 className="header-title">Уведомления</h2>
                    <button className="mark-read-btn" onClick={handleMarkAllRead} title="Прочитать все">
                        <CheckRead size={20} />
                    </button>
                </div>
                <div className="notif-tabs-wrapper">
                    <div className="notif-tabs">
                        <button
                            className={`notif-tab ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            Все
                        </button>
                    </div>
                </div>
            </header>

            <ScrollArea className="notifications-list-scroll content-fade-in">
                {loading ? (
                    <div className="notifications-list">
                        {[1, 2, 3, 4, 5, 6, 7].map(i => <NotificationSkeleton key={i} />)}
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="notifications-list">
                        {notifications.map((notif) => (
                            <NotificationItem key={notif.id} notif={notif} />
                        ))}
                        <div ref={sentinelRef} style={{ height: '20px', width: '100%' }} />
                        {loadingMore && <div className="notif-more-loader"><NotificationSkeleton /></div>}
                    </div>
                ) : (
                    <div className="notif-empty-state">
                        <div className="notif-empty-icon">
                            <Bell size={48} variant="Bold" />
                        </div>
                        <h3>Тишина и покой</h3>
                        <p>Здесь появятся лайки, ответы и подписки, когда вы начнете активничать.</p>
                    </div>
                )}
                <div style={{ height: '140px' }} />
            </ScrollArea>
        </div>
    );
};

export default NotificationsPage;