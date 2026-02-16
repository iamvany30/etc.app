import React from 'react';
import { useModal } from '../../context/ModalContext';

const LogoutConfirmModal = ({ onConfirm, onCancel }) => {
    const { closeModal } = useModal();

    const handleLogout = () => {
        onConfirm();
        closeModal();
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            closeModal();
        }
    };

    return (
        <div style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🚪</div>
            <h2 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '20px', 
                fontWeight: '800',
                color: 'var(--color-text)' 
            }}>
                Выйти из итд.app?
            </h2>
            <p style={{ 
                margin: '0 0 24px 0', 
                color: 'var(--color-text-secondary)', 
                fontSize: '15px', 
                lineHeight: '22px' 
            }}>
                Вы всегда сможете войти обратно. Все ваши данные будут сохранены на сервере.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                    onClick={handleLogout}
                    style={{
                        width: '100%',
                        padding: '14px',
                        backgroundColor: '#f4212e',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '99px',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: 'pointer'
                    }}
                >
                    Выйти
                </button>

                <button 
                    onClick={handleCancel}
                    style={{
                        width: '100%',
                        padding: '14px',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text)', 
                        border: '1px solid var(--color-border)', 
                        borderRadius: '99px',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: 'pointer'
                    }}
                >
                    Отмена
                </button>
            </div>
        </div>
    );
};

export default LogoutConfirmModal;