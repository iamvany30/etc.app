/* @source src/components/Sidebar.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useModal } from '../context/ModalContext';
import { useIsland } from '../context/IslandContext';
import { apiClient } from '../api/client';
import ProfileMenu from './ProfileMenu';
import SettingsModal from './modals/SettingsModal';
import LogoutConfirmModal from './modals/LogoutConfirmModal';
import '../styles/Sidebar.css';


import { MusicIcon } from './icons/MusicIcon';
import { IconFeed, IconExplore, IconNotifications, IconBookmarks, IconProfile, IconDownload} from './icons/SidebarIcons';

const Sidebar = () => {
    const { currentUser, setCurrentUser } = useUser();
    const { openModal } = useModal();
    const { showIslandAlert } = useIsland();
    const location = useLocation();
    
    const [unreadCount, setUnreadCount] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [anchorRect, setAnchorRect] = useState(null); 
    const profileBtnRef = useRef(null);

    
    useEffect(() => {
        apiClient.getNotificationsCount().then(res => {
            if (res?.count) setUnreadCount(res.count);
        });
        
        if (window.api?.onNotification) {
            const unsubscribe = window.api.onNotification(() => {
                if (window.location.hash !== '#/notifications') {
                    setUnreadCount(prev => prev + 1);
                }
            });
            return () => unsubscribe.removeListener?.();
        }
    }, []);

    
    useEffect(() => {
        if (location.pathname === '/notifications') setUnreadCount(0);
    }, [location.pathname]);

    if (!currentUser) return <aside className="sidebar-desktop" />;

    
    const handleLogoutTrigger = () => {
        setIsMenuOpen(false);
        openModal(
            <LogoutConfirmModal onConfirm={async () => {
                showIslandAlert('success', 'Сессия завершена', '👋');
                setTimeout(async () => {
                    await window.api.call('/v1/auth/logout', 'POST');
                    setCurrentUser(null);
                    localStorage.removeItem('nowkie_user');
                    window.location.reload();
                }, 800);
            }} />
        );
    };

    
    const handleProfileClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setAnchorRect(rect);
        setIsMenuOpen(!isMenuOpen);
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

            {}
            <div className="sidebar-profile-area">
                {isMenuOpen && (
                    <ProfileMenu 
                        user={currentUser}
                        anchorRect={anchorRect}
                        onSettingsClick={() => { openModal(<SettingsModal />); setIsMenuOpen(false); }}
                        onLogoutClick={handleLogoutTrigger}
                        onClose={() => setIsMenuOpen(false)}
                    />
                )}

                <button 
                    ref={profileBtnRef}
                    className={`sidebar-user-profile ${isMenuOpen ? 'menu-active' : ''}`} 
                    onClick={handleProfileClick}
                >
                    <div className="avatar sidebar-avatar-clan">
                        {currentUser.avatar || "👤"}
                    </div>
                    <div className="sidebar-user-info">
                        <span className="display-name">{currentUser.displayName}</span>
                        <span className="username">@{currentUser.username}</span>
                    </div>
                    <div className="sidebar-more-dots">···</div>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;