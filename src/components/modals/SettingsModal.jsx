import React, { useState, useMemo } from 'react';
import { useUserStore } from '../../store/userStore';
import { useModalStore } from '../../store/modalStore';
import { 
    IconBack, IconUser, IconLock, IconPalette, IconMedia, 
    IconLogout, IconInfo, IconShield, IconUsers, IconChevron,
    IconBell, IconBlock 
} from '../icons/SettingsIcons';

import AccountsSettings from './sections/AccountsSettings'; 
import AccountSettings from './sections/AccountSettings';
import SecuritySettings from './sections/SecuritySettings';
import PrivacySettings from './sections/PrivacySettings';
import AppearanceSettings from './sections/AppearanceSettings';
import MediaSettings from './sections/MediaSettings';
import InfoSettings from './sections/InfoSettings';
import ThemeSettings from './sections/ThemeSettings';
import NotificationSettings from './sections/NotificationSettings';
import BlockedUsersSettings from './sections/BlockedUsersSettings';
import LogoutConfirmModal from './LogoutConfirmModal';
import '../../styles/settings/Layout.css';
import '../../styles/settings/UI.css'; 

const SettingsModal = () => {
    const currentUser = useUserStore(state => state.currentUser);
    const setCurrentUser = useUserStore(state => state.setCurrentUser);
    
    const openModal = useModalStore(state => state.openModal);
    const closeModal = useModalStore(state => state.closeModal);
    
    const isDesktop = window.innerWidth > 768;
    const [activeTabId, setActiveTabId] = useState(isDesktop ? 'accounts_manage' : null);
    const [status, setStatus] = useState({ type: '', msg: '' });

    const handleLogoutTrigger = () => {
        openModal(
            <LogoutConfirmModal 
                onConfirm={async () => {
                    try {
                        await useUserStore.getState().logoutAccount(currentUser.id);
                        closeModal();
                    } catch (e) {
                        console.error(e);
                    }
                }} 
                onCancel={() => openModal(<SettingsModal />)}
            />
        );
    };

    const TABS = useMemo(() => [
        {
            category: 'Аккаунт',
            items: [
                { id: 'accounts_manage', label: 'Мои аккаунты', icon: <IconUsers />, component: AccountsSettings },
                { id: 'account', label: 'Профиль', icon: <IconUser />, component: AccountSettings, props: { user: currentUser, setCurrentUser } },
                { id: 'security', label: 'Безопасность', icon: <IconLock />, component: SecuritySettings },
                { id: 'private', label: 'Приватность', icon: <IconShield />, component: PrivacySettings },
                { id: 'blocked', label: 'Заблокированные', icon: <IconBlock />, component: BlockedUsersSettings },
            ]
        },
        {
            category: 'Интерфейс',
            items: [
                { id: 'appearance', label: 'Внешний вид', icon: <IconPalette />, component: AppearanceSettings },
                { id: 'themes', label: 'Оболочки', icon: <IconPalette />, component: ThemeSettings },
                { id: 'media', label: 'Медиа и данные', icon: <IconMedia />, component: MediaSettings },
            ]
        },
        {
            category: 'Система',
            items: [
                { id: 'notifications', label: 'Уведомления', icon: <IconBell />, component: NotificationSettings },
                { id: 'info', label: 'О приложении', icon: <IconInfo />, component: InfoSettings },
            ]
        }
    ], [currentUser, setCurrentUser]);

    const activeItem = useMemo(() => {
        for (const group of TABS) {
            const found = group.items.find(i => i.id === activeTabId);
            if (found) return found;
        }
        return null;
    }, [activeTabId, TABS]);

    const handleTabChange = (id) => {
        setActiveTabId(id);
        setStatus({ type: '', msg: '' });
    };

    const handleBack = () => {
        setActiveTabId(null);
        setStatus({ type: '', msg: '' });
    };

    const sliderClass = activeTabId && !isDesktop ? 'show-content' : 'show-sidebar';

    const renderContent = () => {
        if (!activeItem) return null;
        const Component = activeItem.component;
        return <Component 
            setStatus={setStatus} 
            reopenModal={() => openModal(<SettingsModal />)} 
            {...(activeItem.props || {})} 
        />;
    };

    return (
        <div className="settings-modal-new">
            <div className={`settings-container ${sliderClass}`}>
                <div className="settings-sidebar-pane">
                    <div className="settings-sidebar-header">
                        <h2>Настройки</h2>
                    </div>
                    <div className="settings-nav-scroll">
                        {TABS.map((group, idx) => (
                            <div key={idx} className="settings-group">
                                <div className="group-title">{group.category}</div>
                                {group.items.map(item => (
                                    <button 
                                        key={item.id}
                                        className={`nav-item ${activeTabId === item.id ? 'active' : ''}`}
                                        onClick={() => handleTabChange(item.id)}
                                    >
                                        <span className="nav-icon">{item.icon}</span>
                                        <span className="nav-label">{item.label}</span>
                                        <IconChevron className="mobile-chevron" />
                                    </button>
                                ))}
                            </div>
                        ))}
                        
                        <div className="settings-group">
                            <div className="group-title">Действия</div>
                            <button className="nav-item danger" onClick={handleLogoutTrigger}>
                                <span className="nav-icon"><IconLogout /></span>
                                <span className="nav-label">Выйти</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="settings-content-pane">
                    <div className="mobile-header">
                        <button className="back-button" onClick={handleBack}>
                            <IconBack />
                        </button>
                        <h3>{activeItem?.label || 'Настройки'}</h3>
                    </div>

                    <div className="desktop-header">
                        <h3>{activeItem?.label || 'Выберите пункт'}</h3>
                    </div>

                    <div className="content-scroller">
                        {status.msg && (
                            <div className={`status-message-inline ${status.type}`}>
                                {status.msg}
                            </div>
                        )}
                        <div className="settings-form-wrapper">
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;