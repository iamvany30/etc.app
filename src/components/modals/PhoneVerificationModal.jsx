import React from 'react';
import { useModalStore } from '../../store/modalStore';

const PhoneVerificationModal = ({ user }) => {
    const closeModal = useModalStore(state => state.closeModal);

    const handleVerify = () => {
        const telegramLink = `https://t.me/itd_verification_bot?start=${user.id}`;
        window.api.openExternalLink(telegramLink);
        closeModal();
    };

    return (
        <div style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ 
                fontSize: '48px', 
                marginBottom: '16px',
                display: 'block' 
            }}>📱</div>
            
            <h2 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: '800' }}>
                Требуется подтверждение
            </h2>
            
            <p style={{ 
                margin: '0 0 24px 0', 
                color: 'var(--color-text-secondary)', 
                fontSize: '15px', 
                lineHeight: '22px' 
            }}>
                Для публикации постов и комментариев необходимо привязать номер телефона через нашего Telegram-бота. Это помогает нам бороться со спамом.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                    onClick={handleVerify}
                    style={{
                        width: '100%',
                        padding: '14px',
                        backgroundColor: '#2AABEE', 
                        color: '#fff',
                        border: 'none',
                        borderRadius: '999px',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.opacity = '0.9'}
                    onMouseOut={(e) => e.target.style.opacity = '1'}
                >
                    Подтвердить через Telegram
                </button>

                <button 
                    onClick={closeModal}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text-secondary)',
                        border: 'none',
                        fontWeight: '600',
                        fontSize: '15px',
                        cursor: 'pointer'
                    }}
                >
                    Позже
                </button>
            </div>
        </div>
    );
};

export default PhoneVerificationModal;