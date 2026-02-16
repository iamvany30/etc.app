/* @source MobileNav.jsx */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { IconFeed, IconExplore, IconNotifications, IconProfile } from './icons/SidebarIcons';
import { MusicIcon } from './icons/MusicIcon'; 
import { useUser } from '../context/UserContext';
import '../styles/MobileNav.css';  

const MobileNav = () => {
    const { currentUser } = useUser();
    if (!currentUser) return null;

    const navItems = [
        { to: "/", label: "Лента", icon: <IconFeed /> },
        { to: "/music", label: "Музыка", icon: <MusicIcon /> },
        { to: "/explore", label: "Обзор", icon: <IconExplore /> },
        { to: "/notifications", label: "События", icon: <IconNotifications /> },
        { to: `/profile/${currentUser.username}`, label: "Профиль", icon: <IconProfile /> }
    ];

    return (
        <nav className="mobile-nav">
            {navItems.map(item => (
                <NavLink key={item.to} to={item.to} className={({isActive}) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                    <div className="nav-item-content">
                        {item.icon}
                        <span className="nav-item-label">{item.label}</span>
                    </div>
                </NavLink>
            ))}
        </nav>
    );
};

export default MobileNav;