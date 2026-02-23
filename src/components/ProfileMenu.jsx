/* @source src/components/ProfileMenu.jsx */
import React, { useMemo, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useUserStore } from '../store/userStore';
import { useNavigate } from 'react-router-dom';
import { ProfileSettingsIcon, ProfileLogoutIcon, ProfileAddIcon, ProfileCheckIcon } from './icons/CustomIcons';
import '../styles/ProfileMenu.css';

const ProfileMenu = ({ user, anchorRect, onSettingsClick, onLogoutClick, onClose }) => {
    const accounts = useUserStore(state => state.accounts);
    const switchAccount = useUserStore(state => state.switchAccount);
    const navigate = useNavigate();
    
    
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 250); 
    };

    
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const menuStyle = useMemo(() => {
        if (!anchorRect) return {};
        const isMobile = window.innerWidth <= 768;
        return isMobile ? {} : {
            position: 'absolute', 
            top: anchorRect.top - 12, 
            left: anchorRect.left,
            width: 270,
            transform: 'translateY(-100%)', 
            zIndex: 10000
        };
    }, [anchorRect]);

    const handleAddAccount = () => {
        handleClose();
        setTimeout(() => navigate('/login'), 250);
    };

    const handleAction = (actionFn) => {
        handleClose();
        setTimeout(actionFn, 250);
    };

    return ReactDOM.createPortal(
        <>
            <div className={`profile-menu-backdrop ${isClosing ? 'closing' : ''}`} onClick={handleClose} />
            <div 
                className={`profile-menu-container ${isClosing ? 'closing' : ''}`} 
                style={menuStyle}
                onClick={e => e.stopPropagation()}
            >
                <div className="accounts-list custom-scrollbar">
                    {accounts.map(acc => (
                        <button 
                            key={acc.id} 
                            className={`account-item ${acc.isActive ? 'active' : ''}`}
                            onClick={() => {
                                if (!acc.isActive) {
                                    handleClose();
                                    switchAccount(acc.id);
                                }
                            }}
                        >
                            <div className="avatar small">
                                {acc.avatar && acc.avatar.length > 5 ? <img src={acc.avatar} alt=""/> : (acc.avatar || "👤")}
                            </div>
                            <div className="account-info">
                                <span className="acc-name">{acc.displayName}</span>
                                <span className="acc-handle">@{acc.username}</span>
                            </div>
                            {acc.isActive && <ProfileCheckIcon />}
                        </button>
                    ))}
                </div>

                <div className="menu-divider" />

                <div className="profile-menu-items">
                    <button className="profile-menu-action" onClick={handleAddAccount}>
                        <div className="menu-icon-wrap"><ProfileAddIcon /></div>
                        <span>Добавить аккаунт</span>
                    </button>

                    <button className="profile-menu-action" onClick={() => handleAction(onSettingsClick)}>
                        <div className="menu-icon-wrap"><ProfileSettingsIcon /></div>
                        <span>Настройки</span>
                    </button>

                    <button className="profile-menu-action danger" onClick={() => handleAction(onLogoutClick)}>
                        <div className="menu-icon-wrap"><ProfileLogoutIcon /></div>
                        <span>Выйти из @{user.username}</span>
                    </button>
                </div>
            </div>
        </>,
        document.body
    );
};

export default ProfileMenu;