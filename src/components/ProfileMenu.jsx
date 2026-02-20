/* @source src/components/ProfileMenu.jsx */
import React, { useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import '../styles/ProfileMenu.css';


const IconSettings = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const IconLogout = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const IconAdd = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconCheck = () => <svg width="16" height="16" fill="none" stroke="#00ba7c" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>;

const ProfileMenu = ({ user, anchorRect, onSettingsClick, onLogoutClick, onClose }) => {
    const { accounts, switchAccount } = useUser();
    const navigate = useNavigate();

    const menuStyle = useMemo(() => {
        if (!anchorRect) return {};
        const isMobile = window.innerWidth <= 768;
        return isMobile ? {} : {
            position: 'fixed',
            bottom: window.innerHeight - anchorRect.top + 12,
            left: anchorRect.left,
            width: 260,
            zIndex: 10000
        };
    }, [anchorRect]);

    const handleAddAccount = () => {
        onClose();
        
        
        navigate('/login'); 
    };

    return ReactDOM.createPortal(
        <>
            <div className="profile-menu-backdrop" onClick={onClose} />
            <div className="profile-menu-container" style={menuStyle}>
                
                {}
                <div className="accounts-list">
                    {accounts.map(acc => (
                        <button 
                            key={acc.id} 
                            className={`account-item ${acc.isActive ? 'active' : ''}`}
                            onClick={() => !acc.isActive && switchAccount(acc.id)}
                        >
                            <div className="avatar small">{acc.avatar || "👤"}</div>
                            <div className="account-info">
                                <span className="acc-name">{acc.displayName}</span>
                                <span className="acc-handle">@{acc.username}</span>
                            </div>
                            {acc.isActive && <IconCheck />}
                        </button>
                    ))}
                </div>

                <div className="menu-divider" />

                <div className="profile-menu-items">
                    <button className="profile-menu-item" onClick={handleAddAccount}>
                        <div className="menu-icon-wrap"><IconAdd /></div>
                        <span>Добавить аккаунт</span>
                    </button>

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
        </>,
        document.body
    );
};

export default ProfileMenu;