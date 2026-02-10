import React from 'react';
import { useModal } from '../../context/ModalContext';

const ConfirmDeleteModal = ({ onConfirm }) => {
    const { closeModal } = useModal();

    const handleConfirm = () => {
        onConfirm();  
        closeModal();  
    };

    return (
        <div style={{ padding: '32px', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700' }}>
                Удалить пост?
            </h2>
            <p style={{ 
                margin: '0 0 24px 0', 
                color: 'var(--color-text-secondary)', 
                fontSize: '15px', 
                lineHeight: '20px' 
            }}>
                Это действие нельзя будет отменить. Пост будет удален из вашего профиля и ленты новостей.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                    onClick={handleConfirm}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#f4212e',  
                        color: '#fff',
                        border: 'none',
                        borderRadius: '999px',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#c91b26'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#f4212e'}
                >
                    Удалить
                </button>

                <button 
                    onClick={closeModal}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '999px',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(239, 243, 244, 0.1)'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                    Отмена
                </button>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;