import React from 'react';
import { useModalStore } from '../../store/modalStore';

const ConfirmActionModal = ({ 
    title, 
    message, 
    confirmText = "Подтвердить", 
    cancelText = "Отмена", 
    onConfirm, 
    onCancel,
    isDanger = true
}) => {
    const closeModal = useModalStore(state => state.closeModal);

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        else closeModal();
    };

    const handleCancel = () => {
        if (onCancel) onCancel();
        else closeModal();
    };

    return (
        <div style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>
                {isDanger ? '⚠️' : '❓'}
            </div>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '800', color: 'var(--color-text)' }}>
                {title}
            </h2>
            {message && (
                <p style={{ margin: '0 0 24px 0', color: 'var(--color-text-secondary)', fontSize: '15px', lineHeight: '22px' }}>
                    {message}
                </p>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                    onClick={handleConfirm}
                    style={{
                        width: '100%',
                        padding: '14px',
                        backgroundColor: isDanger ? '#f4212e' : 'var(--color-primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '999px',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.opacity = '0.85'}
                    onMouseOut={(e) => e.target.style.opacity = '1'}
                >
                    {confirmText}
                </button>

                <button 
                    onClick={handleCancel}
                    style={{
                        width: '100%',
                        padding: '14px',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text)', 
                        border: '1px solid var(--color-border)', 
                        borderRadius: '999px',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                    {cancelText}
                </button>
            </div>
        </div>
    );
};

export default ConfirmActionModal;