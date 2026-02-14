import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/ProfileMenu.css';  

const IconSettings = () => <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"></path></svg>;
const IconLogout = () => <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M16 17v-3H9v-4h7V7l5 5-5 5zm-8-3H5v5h3v-5zm0-7H5v5h3V7zm0-5H5v3h3V2z"></path></svg>;

const ProfileMenu = ({ user, onSettingsClick, onLogoutClick, onClose }) => {
    
     
    useEffect(() => {
        if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return (
        <>
              
            <div className="profile-menu-backdrop" onClick={onClose}></div>

            <div className="profile-menu">
                  
                <Link to={`/profile/${user.username}`} className="profile-menu-header" onClick={onClose}>
                    <div className="avatar" style={{width: 44, height: 44, fontSize: 20}}>
                        {user.avatar}
                    </div>
                    <div className="sidebar-user-info">
                        <span className="display-name">{user.displayName}</span>
                        <span className="username">@{user.username}</span>
                    </div>
                </Link>

                  
                <div className="profile-menu-items">
                    <button className="profile-menu-item" onClick={onSettingsClick}>
                        <IconSettings />
                        <span>Настройки</span>
                    </button>
                    <button className="profile-menu-item danger" onClick={onLogoutClick}>
                        <IconLogout />
                        <span>Выйти</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default ProfileMenu;