import React from 'react';
import '../styles/AccountSwitchOverlay.css';

const AccountSwitchOverlay = ({ targetUser, isExiting }) => {
    if (!targetUser) return null;

    const displayName = targetUser.displayName || targetUser.username || 'Пользователь';
    const handle     = targetUser.username || '';
    const avatar     = targetUser.avatar;

    
    
    
    const isImage = avatar && avatar.length > 10;

    return (
        <div 
            className={`account-switch-overlay ${isExiting ? 'exiting' : ''}`} 
            role="status"
        >
            <div className="aso-glow-bg" aria-hidden="true" />

            <div className="aso-card">
                <div className="aso-avatar-wrapper">
                    {}
                    <div className="aso-ripple" />
                    <div className="aso-ripple" />
                    <div className="aso-avatar-ring" />

                    <div className="avatar aso-avatar">
                        {isImage ? (
                            <img 
                                src={avatar} 
                                alt={displayName} 
                                className="aso-avatar-img"
                            />
                        ) : (
                            <span className="aso-emoji">
                                {avatar || '👤'}
                            </span>
                        )}
                    </div>
                </div>

                <div className="aso-text">
                    <div className="aso-label">Переключение</div>
                    <div className="aso-name">{displayName}</div>
                    {handle && <div className="aso-handle">@{handle}</div>}
                </div>

                <div className="aso-divider" />

                <div className="aso-progress-track">
                    <div className="aso-progress-bar" />
                </div>

                <div className="aso-status">
                    {isExiting ? 'Запуск интерфейса...' : 'Синхронизация...'}
                </div>
            </div>
        </div>
    );
};

export default AccountSwitchOverlay;