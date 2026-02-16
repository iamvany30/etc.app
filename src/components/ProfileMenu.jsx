/* @source src/components/ProfileMenu.jsx */
import React, { useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import '../styles/ProfileMenu.css';  

const IconSettings = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const IconLogout = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;

const ProfileMenu = ({ user, anchorRect, onSettingsClick, onLogoutClick, onClose }) => {
    
    useEffect(() => {
        if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
        }
        return () => { document.body.style.overflow = ''; };
    }, []);

    const menuStyle = useMemo(() => {
        if (!anchorRect || window.innerWidth <= 768) return {};
        return {
            position: 'fixed',
            bottom: window.innerHeight - anchorRect.top + 12, 
            left: anchorRect.left,
            width: anchorRect.width,
            zIndex: 10000
        };
    }, [anchorRect]);

    const content = (
        <>
            <div className="profile-menu-backdrop" onClick={onClose}></div>
            <div className="profile-menu-container" style={menuStyle}>
                <div className="profile-menu-items">
                    <button className="profile-menu-item" onClick={onSettingsClick}>
                        <div className="menu-icon-wrap"><IconSettings /></div>
                        <span>Настройки</span>
                    </button>

                    <button className="profile-menu-item danger" onClick={onLogoutClick}>
                        <div className="menu-icon-wrap"><IconLogout /></div>
                        <span>Выйти из @{user.username}</span>
                    </button>
                </div>
            </div>
        </>
    );

    return ReactDOM.createPortal(content, document.body);
};

export default ProfileMenu;