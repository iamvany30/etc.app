/* @source src/components/modals/sections/InfoSettings.jsx */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconExternalLink, IconChevron } from '../../icons/SettingsIcons';

const contributors = [
    { 
        name: 'iamvany', 
        role: 'Разработчик и основатель', 
        avatar: '🤙',
        link: '/profile/vany',
        linkType: 'internal' 
    },
    { 
        name: 'Graphic Chestnut', 
        role: 'Дизайн логотипа', 
        avatar: '🫠',
        link: '/profile/GraphiChestnut',
        linkType: 'internal' 
    },
];

const InfoSettings = () => {
    const [version, setVersion] = useState('');

    useEffect(() => {
        if (window.api) {
            window.api.invoke('app:get-version').then(setVersion);
        }
    }, []);

    return (
        <div className="settings-content info-view">
            <div className="settings-section-title">Команда проекта</div>
            <div className="contributor-grid">
                {contributors.map(person => (
                    <Link to={person.link} key={person.name} className="contributor-card">
                        <div className="contributor-avatar-wrap">
                            <span className="contributor-emoji">{person.avatar}</span>
                        </div>
                        <div className="contributor-info">
                            <span className="contributor-name">{person.name}</span>
                            <span className="contributor-role">{person.role}</span>
                        </div>
                        <IconChevron size={16} className="contributor-arrow" />
                    </Link>
                ))}
            </div>

            <div className="settings-section-title">Правовая информация</div>
            <div className="legal-links">
                <button className="settings-option compact" onClick={() => window.api.openExternalLink('https://xn--d1ah4a.com/legal/terms')}>
                    <span>Условия использования</span>
                    <IconExternalLink size={14} />
                </button>
                <button className="settings-option compact" onClick={() => window.api.openExternalLink('https://xn--d1ah4a.com/legal/privacy')}>
                    <span>Политика конфиденциальности</span>
                    <IconExternalLink size={14} />
                </button>
            </div>

            <div className="info-footer">
                <span className="info-version">Версия {version || '0.5.0'}</span>
                <p className="info-copyright">© 2026 iamvany. Все права защищены.</p>
            </div>
        </div>
    );
};

export default InfoSettings;