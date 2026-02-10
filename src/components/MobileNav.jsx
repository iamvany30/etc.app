import React from 'react';
import { NavLink } from 'react-router-dom';
import { IconFeed, IconExplore, IconNotifications, IconProfile } from './icons/SidebarIcons';
import { useUser } from '../context/UserContext';
import '../styles/MobileNav.css';  

const MobileNav = () => {
    const { currentUser } = useUser();
    
    if (!currentUser) return null;

    return (
        <nav className="mobile-nav">
            <NavLink to="/" className={({isActive}) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <IconFeed width="24" height="24" />
            </NavLink>
            
            <NavLink to="/explore" className={({isActive}) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <IconExplore width="24" height="24" />
            </NavLink>
            
            <NavLink to="/notifications" className={({isActive}) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <IconNotifications width="24" height="24" />
            </NavLink>
            
            <NavLink to={`/profile/${currentUser.username}`} className={({isActive}) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <IconProfile width="24" height="24" />
            </NavLink>
        </nav>
    );
};

export default MobileNav;