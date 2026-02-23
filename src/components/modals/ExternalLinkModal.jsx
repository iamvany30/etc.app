import React, { useState } from 'react';
import { useModalStore } from '../../store/modalStore';
import { checkIsTrusted } from '../../utils/linkUtils';
import '../../styles/ExternalLinkModal.css'; 

export const isTrustedLink = (url) => checkIsTrusted(url);

const ExternalLinkModal = ({ url }) => {
    const closeModal = useModalStore(state => state.closeModal);
    const [alwaysTrust, setAlwaysTrust] = useState(false);

    const handleProceed = () => {
        if (alwaysTrust) {
            try {
                const { hostname } = new URL(url);
                const whiteList = JSON.parse(localStorage.getItem('itd_whitelist') || '[]');
                if (!whiteList.includes(hostname)) {
                    whiteList.push(hostname);
                    localStorage.setItem('itd_whitelist', JSON.stringify(whiteList));
                }
            } catch (e) {}
        }
        
        
        const useInternalBrowser = localStorage.getItem('itd_use_internal_browser') === 'true';
        
        if (useInternalBrowser) {
            window.dispatchEvent(new CustomEvent('open-internal-browser', { detail: url }));
        } else {
            if (window.api?.openExternalLink) {
                window.api.openExternalLink(url);
            } else {
                window.open(url, '_blank');
            }
        }
        
        closeModal();
    };

    return (
        <div className="external-link-modal">
            <h4>Внешний переход</h4>
            <div className="link-preview">{url}</div>
            <p className="warning-text">Будьте осторожны, не вводите свои данные на незнакомых сайтах.</p>
            
            <label className="trust-checkbox-label">
                <input 
                    type="checkbox" 
                    checked={alwaysTrust} 
                    onChange={e => setAlwaysTrust(e.target.checked)} 
                />
                <span>Доверять этому сайту всегда</span>
            </label>

            <div className="modal-actions">
                <button className="cancel-btn" onClick={closeModal}>Отмена</button>
                <button className="proceed-btn" onClick={handleProceed}>Перейти</button>
            </div>
        </div>
    );
};

export default ExternalLinkModal;