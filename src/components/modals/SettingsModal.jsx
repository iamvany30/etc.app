import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { useModal } from '../../context/ModalContext';
import '../../styles/SettingsModal.css';

 
import { 
    IconBack, IconChevron, IconUser, IconLock, 
    IconPalette, IconMedia, IconLogout, IconInfo  
} from './SettingsIcons';

 
import AccountSettings from './sections/AccountSettings';
import SecuritySettings from './sections/SecuritySettings';
import PrivacySettings from './sections/PrivacySettings';
import AppearanceSettings from './sections/AppearanceSettings';
import MediaSettings from './sections/MediaSettings';
import InfoSettings from './sections/InfoSettings';
import ThemeSettings from './sections/ThemeSettings';

const SettingsModal = () => {
    const { currentUser, setCurrentUser } = useUser();
    const { closeModal } = useModal();
    const [view, setView] = useState('main'); 
    const [status, setStatus] = useState({ type: '', msg: '' });

    const handleLogout = async () => {
        if (window.confirm('Вы точно хотите выйти?')) {
            await window.api.call('/v1/auth/logout', 'POST');
            setCurrentUser(null);
            closeModal();
            window.location.reload();
        }
    };

    const titles = {
        main: 'Настройки',
        account: 'Ваш аккаунт',
        security: 'Безопасность',
        private: 'Приватность',
        appearance: 'Внешний вид',
        themes: 'Оболочки',
        media: 'Медиа и ресурсы',
        info: 'Информация' 
    };

    const MenuItem = ({ id, icon, label, desc }) => (
        <button className="settings-option" onClick={() => { setView(id); setStatus({type:'', msg:''}); }}>
            <div className="settings-option-left">
                <div className="settings-icon">{icon}</div>
                <div className="settings-option-info">
                    <span className="settings-option-name">{label}</span>
                    {desc && <span className="settings-option-desc">{desc}</span>}
                </div>
            </div>
            <span className="settings-arrow"><IconChevron /></span>
        </button>
    );

    return (
        <div className="settings-modal">
              
            <div className="settings-header">
                {view !== 'main' && (
                    <button className="settings-back-btn" onClick={() => { setView('main'); setStatus({type:'', msg:''}); }}>
                        <IconBack />
                    </button>
                )}
                <h2 className="settings-title">{titles[view]}</h2>
            </div>

              
            {status.msg && (
                <div style={{padding: '0 24px'}}>
                    <div className={`status-message ${status.type}`}>{status.msg}</div>
                </div>
            )}

              
            {view === 'main' && (
                <div className="settings-content">
                    <div className="settings-section-title">Учетная запись</div>
                    <MenuItem id="account" icon={<IconUser />} label="Личная информация" desc="Имя, юзернейм, био" />
                    <MenuItem id="security" icon={<IconLock />} label="Пароль" desc="Изменить пароль" />
                    <MenuItem id="private" icon={<IconLock />} label="Приватность" desc="Настройки приватности" />
                    
                    <div className="settings-section-title">Приложение</div>
                    <MenuItem id="appearance" icon={<IconPalette />} label="Внешний вид" desc="Темы и цвета" />
                    <MenuItem id="themes" icon={<IconPalette />} label="Оболочки" desc="Пользовательские настройки" />
                    <MenuItem id="media" icon={<IconMedia />} label="Медиа и данные" desc="Сжатие, GPU" />
                    <MenuItem id="info" icon={<IconInfo />} label="Информация" desc="О приложении и команде" />   

                    <div style={{marginTop: 20}}>
                        <button className="settings-option" onClick={handleLogout}>
                            <div className="settings-option-left">
                                <div className="settings-icon" style={{color:'#f4212e', background:'rgba(244,33,46,0.1)'}}>
                                    <IconLogout />
                                </div>
                                <div className="settings-option-info">
                                    <span className="settings-option-name" style={{color:'#f4212e'}}>Выйти из аккаунта</span>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            )}

              
            {view === 'account' && <AccountSettings user={currentUser} setCurrentUser={setCurrentUser} setStatus={setStatus} />}
            {view === 'security' && <SecuritySettings setStatus={setStatus} />}
            {view === 'private' && <PrivacySettings setStatus={setStatus} />}
            {view === 'appearance' && <AppearanceSettings />}
            {view === 'themes' && <ThemeSettings setStatus={setStatus} />}
            {view === 'media' && <MediaSettings />}
            {view === 'info' && <InfoSettings />}   
        </div>
    );
};

export default SettingsModal;