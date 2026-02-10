import React from 'react';
import { useModal } from '../../context/ModalContext';
import '../../styles/ExternalLinkModal.css'; 


const TRUSTED_DOMAINS = [
    'youtube.com',
    'youtu.be',
    'google.com',
    'github.com',
    'итд.com',
];

export const isTrustedLink = (url) => {
    try {
        const hostname = new URL(url).hostname;
        return TRUSTED_DOMAINS.some(trustedDomain => hostname.endsWith(trustedDomain));
    } catch (e) {
        return false;
    }
};

const ExternalLinkModal = ({ url }) => {
    const { closeModal } = useModal();

    const handleProceed = () => {
        window.api.openExternalLink(url);
        closeModal();
    };

    return (
        <div className="external-link-modal">
            <h4>Переход на внешний сайт</h4>
            <p>Вы собираетесь перейти по ссылке:</p>
            <div className="link-preview">{url}</div>
            <p className="warning-text">
                Будьте осторожны, не вводите свои личные данные на незнакомых сайтах.
            </p>
            <div className="modal-actions">
                <button className="cancel-btn" onClick={closeModal}>Отмена</button>
                <button className="proceed-btn" onClick={handleProceed}>Перейти</button>
            </div>
        </div>
    );
};

export default ExternalLinkModal;