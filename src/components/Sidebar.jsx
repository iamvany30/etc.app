/* @source src/components/Sidebar.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { useModalStore } from '../store/modalStore';
import { useIslandStore } from '../store/islandStore';
import { apiClient } from '../api/client';
import ProfileMenu from './ProfileMenu';
import SettingsModal from './modals/SettingsModal';
import LogoutConfirmModal from './modals/LogoutConfirmModal';
import '../styles/Sidebar.css';

import { MusicIcon } from './icons/MusicIcon';
import { IconFeed, IconExplore, IconNotifications, IconBookmarks, IconProfile, IconDownload} from './icons/SidebarIcons';

const Sidebar = () => {
    const currentUser = useUserStore(state => state.currentUser);
    const openModal = useModalStore(state => state.openModal);
    const showIslandAlert = useIslandStore(state => state.showIslandAlert);
    
    const location = useLocation();
    
    const [unreadCount, setUnreadCount] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [anchorRect, setAnchorRect] = useState(null); 
    const profileBtnRef = useRef(null);

    useEffect(() => {
        if (currentUser) {
            apiClient.getNotificationsCount().then(res => {
                if (res?.count !== undefined) setUnreadCount(res.count);
            });
        }
    }, [currentUser]);

    useEffect(() => {
        const handleCountUpdate = (e) => {
            const { type, value } = e.detail;
            
            setUnreadCount(prev => {
                if (type === 'set') return value;
                if (type === 'reset') return 0;
                if (type === 'increment') {
                     if (window.location.hash.includes('/notifications')) return 0;
                     return prev + 1;
                }
                if (type === 'decrement') return Math.max(0, prev - 1);
                return prev;
            });
        };

        window.addEventListener('notification-count-update', handleCountUpdate);
        return () => window.removeEventListener('notification-count-update', handleCountUpdate);
    }, []);

    useEffect(() => {
        if (location.pathname === '/notifications') {
            setUnreadCount(0);
        }
    }, [location.pathname]);

    if (!currentUser) return <aside className="sidebar-desktop" />;

    const handleLogoutTrigger = () => {
        setIsMenuOpen(false);
        openModal(
            <LogoutConfirmModal onConfirm={async () => {
                showIslandAlert('success', 'Сессия завершена', '👋');
                setTimeout(async () => {
                    await useUserStore.getState().logoutAccount(currentUser.id);
                }, 800);
            }} />
        );
    };

    const handleProfileClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setAnchorRect(rect);
        setIsMenuOpen(true);
    };

    const navItems = [
        { to: "/", label: "Лента", icon: <IconFeed /> },
        { to: "/music", label: "Музыка", icon: <MusicIcon /> },
        { to: "/downloads", label: "Загрузки", icon: <IconDownload /> },
        { to: "/bookmarks", label: "Закладки", icon: <IconBookmarks /> }, 
        { to: "/explore", label: "Обзор", icon: <IconExplore /> },
        { to: "/notifications", label: "События", icon: <IconNotifications />, badge: unreadCount },
        { to: `/profile/${currentUser.username}`, label: "Профиль", icon: <IconProfile /> }
    ];

    return (
        <aside className="sidebar-desktop">
            <div className="sidebar-top-group">
                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <div className="icon-container">
                                {item.icon}
                                {item.badge > 0 && <span className="notification-badge">{item.badge}</span>}
                            </div>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div className="sidebar-profile-area">
                {isMenuOpen && (
                    <ProfileMenu 
                        user={currentUser}
                        anchorRect={anchorRect}
                        onSettingsClick={() => openModal(<SettingsModal />)}
                        onLogoutClick={handleLogoutTrigger}
                        onClose={() => setIsMenuOpen(false)}
                    />
                )}

                <button 
                    ref={profileBtnRef}
                    className={`sidebar-user-profile ${isMenuOpen ? 'menu-active' : ''}`} 
                    onClick={handleProfileClick}
                >
                    <div className="sidebar-avatar-wrap">
                        <div className="avatar sidebar-avatar">
                            {currentUser.avatar && currentUser.avatar.length > 5 
                                ? <img src={currentUser.avatar} alt=""/> 
                                : (currentUser.avatar || "👤")}
                        </div>
                        {currentUser.online !== false && <div className="sidebar-online-dot"></div>}
                    </div>
                    
                    <div className="sidebar-user-info">
                        <span className="display-name">{currentUser.displayName}</span>
                        <span className="username">@{currentUser.username}</span>
                    </div>
                    
                    <div className="sidebar-more-dots">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="12" cy="5" r="1"></circle>
                            <circle cx="12" cy="19" r="1"></circle>
                        </svg>
                    </div>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;