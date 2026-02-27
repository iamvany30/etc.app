/* @source src/components/modals/ExtensionGuideModal.jsx */
import React, { useState } from 'react';
import { useModalStore } from '../../store/modalStore';
import { useIslandStore } from '../../store/islandStore';
import { 
    Copy, 
    CheckCircle, 
    Download, 
    SquareShareLine, 
    SquareTransferVertical, 
    infoCircle
} from "@solar-icons/react";
import '../../styles/ExtensionGuideModal.css';

const ExtensionGuideModal = () => {
    const closeModal = useModalStore(state => state.closeModal);
    const showIslandAlert = useIslandStore(state => state.showIslandAlert);
    
    const [copied, setCopied] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    
    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            if (window.api && window.api.invoke) {
                const res = await window.api.invoke('app:download-ext');
                if (res && res.success) {
                    showIslandAlert('success', 'Файл сохранен в Загрузки!', '📥');
                } else {
                    throw new Error(res?.error || 'Ошибка копирования');
                }
            } else {
                
                const link = document.createElement('a');
                link.href = process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/ext.crx` : './ext.crx';
                link.download = 'ext.crx';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showIslandAlert('success', 'Файл скачан!', '📥');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showIslandAlert('error', 'Не удалось сохранить файл', '❌');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleCopyUrl = () => {
        navigator.clipboard.writeText('chrome://extensions');
        setCopied(true);
        showIslandAlert('clipboard', 'Адрес скопирован! Вставьте в браузер.', '📋');
        setTimeout(() => setCopied(false), 2000);
    };

    const openSite = () => {
        const url = 'https://xn--d1ah4a.com';
        if (window.api && window.api.openExternalLink) {
            window.api.openExternalLink(url);
        } else {
            window.open(url, '_blank');
        }
        closeModal();
    };

    return (
        <div className="ext-guide-container">
            <div className="ext-guide-icon-box">
                
                <SquareTransferVertical size={42} variant="Bold" />
            </div>

            <h2 className="ext-guide-title">Быстрый вход</h2>
            <p className="ext-guide-subtitle">
                Установите расширение, чтобы входить в аккаунт в один клик, обходя проверки Cloudflare.
            </p>

            <div className="ext-steps-list">
                
                
                <div className="ext-step-item">
                    <div className="ext-step-number">1</div>
                    <div className="ext-step-content">
                        <span className="step-title">Скачайте файл</span>
                        <p className="step-desc">Сохраните <b>ext.crx</b> на компьютер.</p>
                        <button className="ext-action-btn primary" onClick={handleDownload} disabled={isDownloading}>
                            {isDownloading ? <span className="ext-spinner"></span> : <Download size={18} />}
                            <span>Скачать в "Загрузки"</span>
                        </button>
                    </div>
                </div>

                
                <div className="ext-step-item">
                    <div className="ext-step-number">2</div>
                    <div className="ext-step-content">
                        <span className="step-title">Установите в браузер</span>
                        <p className="step-desc">
                            1. Скопируйте адрес ниже.<br/>
                            2. Вставьте в новую вкладку браузера.<br/>
                            3. Включите <b>"Режим разработчика"</b> (справа сверху) и перетащите туда скачанный файл.
                            4. Проверьте чтобы расширение было включено.
                        </p>
                        
                        <button className={`ext-copy-url-btn ${copied ? 'copied' : ''}`} onClick={handleCopyUrl}>
                            <div className="url-text">chrome://extensions</div>
                            <div className="url-action">
                                {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                                <span>{copied ? 'Скопировано' : 'Копировать адрес'}</span>
                            </div>
                        </button>
                    </div>
                </div>

                
                <div className="ext-step-item">
                    <div className="ext-step-number">3</div>
                    <div className="ext-step-content">
                        <span className="step-title">Войдите</span>
                        <p className="step-desc">Перейдите на сайт. Расширение покажет кнопку <b>"Открыть в приложении"</b>.</p>
                        <button className="ext-action-btn secondary" onClick={openSite}>
                            <span>Открыть сайт</span>
                            <SquareShareLine size={18} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ExtensionGuideModal;