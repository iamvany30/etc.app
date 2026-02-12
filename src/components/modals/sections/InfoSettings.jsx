import React from 'react';
import { Link } from 'react-router-dom';
import { IconExternalLink, IconChevron } from '../SettingsIcons';

 
 
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
        role: 'Дизайн лого', 
        avatar: '🫠',
        link: '/profile/GraphiChestnut',
        linkType: 'internal' 
    },
];
const legalLinks = [
    { href: "https://xn--d1ah4a.com/legal/terms", text: "Условия использования" },
    { href: "https://xn--d1ah4a.com/legal/privacy", text: "Политика конфиденциальности" },
    { href: "https://xn--d1ah4a.com/legal/cookies", text: "Использование Cookie" }
];

 

const InfoLink = ({ href, text }) => (
    <a href={href} 
       onClick={(e) => { e.preventDefault(); window.api.openExternalLink(href); }} 
       className="settings-option">
        <span className="settings-option-name">{text}</span>
        <IconExternalLink />
    </a>
);

const ContributorItem = ({ person }) => {
    const content = (
        <>
            <div className="contributor-avatar">{person.avatar}</div>
            <div className="contributor-info">
                <span className="contributor-name">{person.name}</span>
                <span className="contributor-role">{person.role}</span>
            </div>
            {person.linkType === 'internal' && <IconChevron />}
            {person.linkType === 'external' && <IconExternalLink />}
        </>
    );

    if (!person.link) {
        return <div className="contributor-item">{content}</div>;
    }

    if (person.linkType === 'internal') {
        return <Link to={person.link} className="contributor-item clickable">{content}</Link>;
    }
    
     
    return (
        <button className="contributor-item clickable" onClick={() => window.api.openExternalLink(person.link)}>
            {content}
        </button>
    );
};


 

const InfoSettings = () => {
    return (
        <div className="settings-content">
            <div className="settings-section-title">Команда проекта</div>
            <div className="contributor-list">
                {contributors.map(person => (
                    <ContributorItem key={person.name} person={person} />
                ))}
            </div>

            { }
            <div className="settings-section-title">Правовая информация</div>
            {legalLinks.map(link => (
                <InfoLink key={link.href} {...link} />
            ))}

            { }
            <div className="settings-footer">
                <span className="app-icon">💡</span>
                итд.app v0.2.0
            </div>
        </div>
    );
};

export default InfoSettings;