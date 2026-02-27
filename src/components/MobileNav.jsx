/* @source src/components/MobileNav.jsx */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { IconFeed, IconExplore, IconNotifications, IconProfile } from './icons/SidebarIcons';

import { useUserStore } from '../store/userStore';
import '../styles/MobileNav.css';  

const MobileNav = () => {
    const currentUser = useUserStore(state => state.currentUser);
    if (!currentUser) return null;

    const navItems = [
        { to: "/", label: "Лента", icon: <IconFeed /> },
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
                    {}
                    <div className="nav-active-dot" />
                </NavLink>
            ))}
        </nav>
    );
};

export default MobileNav;