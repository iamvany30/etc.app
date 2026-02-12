import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useModal } from '../context/ModalContext';
import { apiClient } from '../api/client';
import { MusicIcon } from './icons/MusicIcon';
import SettingsModal from './modals/SettingsModal';
import ProfileMenu from './ProfileMenu';
import '../styles/Sidebar.css';

import { IconFeed, IconExplore, IconNotifications, IconProfile } from './icons/SidebarIcons';

const Sidebar = () => {
  const { currentUser, setCurrentUser } = useUser();
  const { openModal } = useModal();
  const location = useLocation();
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    apiClient.getNotificationsCount().then(res => {
        if (res?.count) setUnreadCount(res.count);
    });
    const unsubscribe = window.api.onNotification(() => {
        if (window.location.hash !== '#/notifications') {
            setUnreadCount(prev => prev + 1);
        }
    });
    window.resetNotificationCount = () => setUnreadCount(0);
    return () => {
        if (unsubscribe && typeof unsubscribe.removeListener === 'function') {
            unsubscribe.removeListener();
        }
    };
  }, []);

  useEffect(() => {
    if (location.pathname === '/notifications') {
        setUnreadCount(0);
    }
  }, [location.pathname]);

  useEffect(() => {
      const handleClickOutside = (event) => {
          if (menuRef.current && !menuRef.current.contains(event.target)) {
              setIsMenuOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return <aside className="sidebar-desktop" />;

  const handleLogout = async () => {
    if (window.confirm('Вы точно хотите выйти?')) {
        await window.api.call('/v1/auth/logout', 'POST');
        setCurrentUser(null);
        localStorage.removeItem('nowkie_user');
        setIsMenuOpen(false);
        window.location.reload();
    }
  };

  const navItems = [
    { to: "/", label: "Лента", icon: <IconFeed /> },
    { to: "/music", label: "Музыка", icon: <MusicIcon /> },
    { to: "/explore", label: "Обзор", icon: <IconExplore /> },
    { to: "/notifications", label: "Уведомления", icon: <IconNotifications /> },
    { to: `/profile/${currentUser.username}`, label: "Профиль", icon: <IconProfile /> }
  ];

  return (
    <aside className="sidebar-desktop">
        <div className='sidebar-top-group'>
            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                    >
                        <div className="icon-container">
                            {item.icon}
                            {item.to === "/notifications" && unreadCount > 0 && (
                                <span className="notification-badge">{unreadCount}</span>
                            )}
                        </div>
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>

      { }
      <div ref={menuRef} style={{ position: 'relative', width: '100%' }}>
          {isMenuOpen && (
            <ProfileMenu 
                user={currentUser}
                onSettingsClick={() => {
                    openModal(<SettingsModal />);
                    setIsMenuOpen(false);
                }}
                onLogoutClick={handleLogout}
                onClose={() => setIsMenuOpen(false)}
            />
          )}

          <button className="sidebar-user-profile" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <div className="avatar" style={{width: 40, height: 40, fontSize: 20}}>
              {currentUser.avatar}
            </div>
            <div className="sidebar-user-info">
                <span className="display-name">{currentUser.displayName}</span>
                <span className="username">@{currentUser.username}</span>
            </div>
          </button>
      </div>
    </aside>
  );
};

export default Sidebar;