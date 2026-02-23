/* @source src/components/modals/DevToolsWarningModal.jsx */
import React from 'react';
import { useModalStore } from '../../store/modalStore';
import { DevToolsWarnIcon } from '../icons/CustomIcons';

const DevToolsWarningModal = () => {
    const closeModal = useModalStore(state => state.closeModal);

    const handleOpenAnyway = () => {
        if (window.api && window.api.invoke) {
            window.api.invoke('debug:toggle-devtools');
        }
        closeModal();
    };

    return (
        <div style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ color: '#f4212e', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                <DevToolsWarnIcon />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px', color: 'var(--color-text)' }}>
                Подождите! Это опасно.
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
                Раздел инструментов разработчика предназначен <b>исключительно для разработчиков</b>. 
                <br/><br/>
                Если кто-то попросил вас скопировать и вставить сюда какой-либо текст или код, чтобы "включить функцию", "взломать аккаунт" или "пройти проверку" — <b>это мошенники</b>. 
                Вставка стороннего кода может привести к <b>полной потере доступа</b> к вашему аккаунту.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                    onClick={closeModal}
                    style={{ width: '100%', padding: '14px', backgroundColor: '#f4212e', color: '#fff', border: 'none', borderRadius: '999px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: 'opacity 0.2s' }}
                    onMouseOver={e => e.target.style.opacity = '0.9'}
                    onMouseOut={e => e.target.style.opacity = '1'}
                >
                    Закрыть и обезопасить себя
                </button>
                <button 
                    onClick={handleOpenAnyway}
                    style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: 'var(--color-text-secondary)', border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                >
                    Я понимаю риски, открыть DevTools
                </button>
            </div>
        </div>
    );
};

export default DevToolsWarningModal;