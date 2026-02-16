/* @source src/components/modals/SettingsModal.jsx */
import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { useModal } from '../../context/ModalContext';
import '../../styles/SettingsModal.css';


import { 
    IconBack, 
    IconChevron, 
    IconUser, 
    IconLock, 
    IconPalette, 
    IconMedia, 
    IconLogout, 
    IconInfo,
    IconShield
} from '../icons/SettingsIcons';


import AccountSettings from './sections/AccountSettings';
import SecuritySettings from './sections/SecuritySettings';
import PrivacySettings from './sections/PrivacySettings';
import AppearanceSettings from './sections/AppearanceSettings';
import MediaSettings from './sections/MediaSettings';
import InfoSettings from './sections/InfoSettings';
import ThemeSettings from './sections/ThemeSettings';


import LogoutConfirmModal from './LogoutConfirmModal';

const SettingsModal = () => {
    const { currentUser, setCurrentUser } = useUser();
    const { openModal, closeModal } = useModal();
    const [view, setView] = useState('main'); 
    const [status, setStatus] = useState({ type: '', msg: '' });

    
    const titles = {
        main: 'Настройки',
        account: 'Ваш аккаунт',
        security: 'Пароль',
        private: 'Приватность',
        appearance: 'Внешний вид',
        themes: 'Оболочки',
        media: 'Медиа и данные',
        info: 'О приложении' 
    };

    
    const handleLogoutTrigger = () => {
        openModal(
            <LogoutConfirmModal 
                onConfirm={async () => {
                    try {
                        await window.api.call('/v1/auth/logout', 'POST');
                        setCurrentUser(null);
                        localStorage.removeItem('nowkie_user');
                        closeModal();
                        window.location.reload();
                    } catch (e) {
                        console.error("Logout failed", e);
                    }
                }} 
                
                onCancel={() => openModal(<SettingsModal />)}
            />
        );
    };

    
    const MenuItem = ({ id, icon, label, desc, isDanger, onClick }) => (
        <button 
            className={`settings-option ${isDanger ? 'danger-zone' : ''}`} 
            onClick={onClick || (() => { setView(id); setStatus({type:'', msg:''}); })}
        >
            <div className="settings-option-left">
                <div className={`settings-icon ${isDanger ? 'danger' : ''}`}>{icon}</div>
                <div className="settings-option-info">
                    <span className={`settings-option-name ${isDanger ? 'danger' : ''}`}>{label}</span>
                    {desc && <span className="settings-option-desc">{desc}</span>}
                </div>
            </div>
            {!isDanger && <span className="settings-arrow"><IconChevron /></span>}
        </button>
    );

    
    const renderContent = () => {
        switch (view) {
            case 'main':
                return (
                    <div className="settings-content">
                        <div className="settings-section-title">Аккаунт</div>
                        <MenuItem 
                            id="account" 
                            icon={<IconUser />} 
                            label="Личная информация" 
                            desc="Имя, юзернейм и описание" 
                        />
                        <MenuItem 
                            id="security" 
                            icon={<IconLock />} 
                            label="Безопасность" 
                            desc="Смена пароля" 
                        />
                        <MenuItem 
                            id="private" 
                            icon={<IconShield />} 
                            label="Приватность" 
                            desc="Стена и статус в сети" 
                        />
                        
                        <div className="settings-section-title">Интерфейс</div>
                        <MenuItem 
                            id="appearance" 
                            icon={<IconPalette />} 
                            label="Оформление" 
                            desc="Цвета и спецэффекты" 
                        />
                        <MenuItem 
                            id="themes" 
                            icon={<IconPalette />} 
                            label="Оболочки" 
                            desc="Кастомные темы сообщества" 
                        />
                        <MenuItem 
                            id="media" 
                            icon={<IconMedia />} 
                            label="Медиа" 
                            desc="Сжатие и работа GPU" 
                        />

                        <div className="settings-section-title">Система</div>
                        <MenuItem 
                            id="info" 
                            icon={<IconInfo />} 
                            label="О приложении" 
                            desc="Версия, команда и правовая инфо" 
                        />

                        <div style={{ marginTop: '12px', borderTop: '1px solid var(--color-border-light)' }}>
                            <MenuItem 
                                icon={<IconLogout />} 
                                label="Выйти из аккаунта" 
                                isDanger={true}
                                onClick={handleLogoutTrigger}
                            />
                        </div>
                    </div>
                );
            case 'account': return <AccountSettings user={currentUser} setCurrentUser={setCurrentUser} setStatus={setStatus} />;
            case 'security': return <SecuritySettings setStatus={setStatus} />;
            case 'private': return <PrivacySettings setStatus={setStatus} />;
            case 'appearance': return <AppearanceSettings />;
            case 'themes': return <ThemeSettings setStatus={setStatus} />;
            case 'media': return <MediaSettings />;
            case 'info': return <InfoSettings />;
            default: return null;
        }
    };

    return (
        <div className="settings-modal">
            <header className="settings-header">
                {view !== 'main' && (
                    <button 
                        className="settings-back-btn" 
                        onClick={() => { setView('main'); setStatus({type:'', msg:''}); }}
                    >
                        <IconBack />
                    </button>
                )}
                <h2 className="settings-title">{titles[view]}</h2>
            </header>

            {status.msg && (
                <div className={`status-message ${status.type}`}>
                    {status.msg}
                </div>
            )}

            <div key={view} className="settings-content-wrapper">
                {renderContent()}
            </div>
        </div>
    );
};

export default SettingsModal;