import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { useModal } from '../../context/ModalContext';


const EditProfileModal = () => {
    const { currentUser, setCurrentUser } = useUser();
    const { closeModal } = useModal();
    
     
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
                 
                setCurrentUser(prev => ({ ...prev, ...updatedUser }));
                 
                closeModal();
            } else {
                alert('Ошибка при сохранении');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>Редактировать профиль</h2>
            
            { }
            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '4px' }}>Имя</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    style={{
                        width: '100%', 
                        padding: '12px', 
                        background: 'transparent', 
                        border: '1px solid var(--color-border)', 
                        borderRadius: '4px',
                        color: 'var(--color-text)',
                        fontSize: '16px'
                    }}
                />
            </div>

            { }
            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '4px' }}>О себе</label>
                <textarea 
                    value={bio} 
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    style={{
                        width: '100%', 
                        padding: '12px', 
                        background: 'transparent', 
                        border: '1px solid var(--color-border)', 
                        borderRadius: '4px',
                        color: 'var(--color-text)',
                        fontSize: '16px',
                        resize: 'none'
                    }}
                />
            </div>

            { }
            <button 
                onClick={handleSave} 
                disabled={isLoading}
                style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#fff',
                    color: '#000',
                    border: 'none',
                    borderRadius: '999px',
                    fontWeight: 'bold',
                    cursor: isLoading ? 'wait' : 'pointer',
                    opacity: isLoading ? 0.7 : 1
                }}
            >
                {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
        </div>
    );
};

export default EditProfileModal;