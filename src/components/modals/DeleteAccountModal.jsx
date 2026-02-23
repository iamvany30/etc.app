import React, { useState } from 'react';
import { useModalStore } from '../../store/modalStore';
import { useUserStore } from '../../store/userStore';
import { apiClient } from '../../api/client';

const DeleteAccountModal = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const closeModal = useModalStore(s => s.closeModal);
    const currentUser = useUserStore(s => s.currentUser);

    const handleDelete = async () => {
        if (!password) {
            setError('Введите пароль');
            return;
        }
        setLoading(true);
        try {
            const res = await apiClient.deleteAccount(password);
            
            if (res?.success || (res && !res.error)) {
                await useUserStore.getState().logoutAccount(currentUser?.id);
                closeModal();
            } else {
                setError(res.error?.message || 'Ошибка удаления');
            }
        } catch (e) {
            setError('Ошибка сети');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: '800', color: '#f4212e' }}>Удаление аккаунта</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', marginBottom: '24px', lineHeight: 1.5 }}>
                Это действие необратимо. Ваш профиль, посты и комментарии будут удалены навсегда.<br/><br/>Введите ваш пароль для подтверждения.
            </p>
            
            {error && (
                <div style={{ 
                    color: '#f4212e', 
                    marginBottom: '16px', 
                    fontSize: '13px', 
                    fontWeight: '600',
                    background: 'rgba(244, 33, 46, 0.1)',
                    padding: '8px',
                    borderRadius: '8px'
                }}>
                    {error}
                </div>
            )}
            
            <input 
                type="password" 
                placeholder="Текущий пароль"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--color-input-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', marginBottom: '24px', fontSize: '15px', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={closeModal} style={{ flex: 1, padding: '14px', borderRadius: '99px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)', cursor: 'pointer', fontWeight: '700' }}>Отмена</button>
                <button onClick={handleDelete} disabled={loading} style={{ flex: 1, padding: '14px', borderRadius: '99px', background: '#f4212e', border: 'none', color: '#fff', fontWeight: '700', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.5 : 1 }}>
                    {loading ? 'Удаление...' : 'Удалить навсегда'}
                </button>
            </div>
        </div>
    );
};

export default DeleteAccountModal;