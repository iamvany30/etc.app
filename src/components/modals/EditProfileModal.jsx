import React, { useState } from 'react';
import { useUserStore } from '../../store/userStore';
import { useModalStore } from '../../store/modalStore';
import { useIslandStore } from '../../store/islandStore';

const EditProfileModal = () => {
    const currentUser = useUserStore(state => state.currentUser);
    const setCurrentUser = useUserStore(state => state.setCurrentUser);
    const closeModal = useModalStore(state => state.closeModal);
    const showIslandAlert = useIslandStore(state => state.showIslandAlert);
    
    const [name, setName] = useState(currentUser?.displayName || '');
    const [bio, setBio] = useState(currentUser?.bio || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const updatedUser = await window.api.call('/users/me', 'PUT', { 
                displayName: name, 
                bio: bio 
            });

            if (updatedUser && !updatedUser.error) {
                setCurrentUser({ ...currentUser, ...updatedUser });
                closeModal();
                showIslandAlert('success', 'Профиль обновлен', '✅');
            } else {
                showIslandAlert('error', 'Ошибка при сохранении', '❌');
            }
        } catch (e) {
            console.error(e);
            showIslandAlert('error', 'Ошибка соединения', '📡');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '800' }}>Редактировать профиль</h2>
            
            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>Отображаемое имя</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    style={{
                        width: '100%', 
                        padding: '14px', 
                        background: 'var(--color-input-bg)', 
                        border: '1px solid var(--color-border)', 
                        borderRadius: '12px',
                        color: 'var(--color-text)',
                        fontSize: '15px',
                        outline: 'none'
                    }}
                />
            </div>

            <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>О себе</label>
                <textarea 
                    value={bio} 
                    onChange={e => setBio(e.target.value)}
                    rows={4}
                    style={{
                        width: '100%', 
                        padding: '14px', 
                        background: 'var(--color-input-bg)', 
                        border: '1px solid var(--color-border)', 
                        borderRadius: '12px',
                        color: 'var(--color-text)',
                        fontSize: '15px',
                        resize: 'none',
                        outline: 'none'
                    }}
                />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                    onClick={closeModal} 
                    disabled={isLoading}
                    style={{
                        flex: 1, padding: '14px', borderRadius: '99px',
                        background: 'transparent', border: '1px solid var(--color-border)',
                        color: 'var(--color-text)', fontWeight: '700', fontSize: '14px', cursor: 'pointer'
                    }}
                >
                    Отмена
                </button>
                <button 
                    onClick={handleSave} 
                    disabled={isLoading}
                    style={{
                        flex: 1, padding: '14px', borderRadius: '99px',
                        background: 'var(--color-primary)', border: 'none',
                        color: '#fff', fontWeight: '700', fontSize: '14px',
                        cursor: isLoading ? 'default' : 'pointer', opacity: isLoading ? 0.7 : 1
                    }}
                >
                    {isLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
            </div>
        </div>
    );
};

export default EditProfileModal;