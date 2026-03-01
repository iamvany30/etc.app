/* @source src/components/modals/BookmarkFolderModal.jsx */
import React, { useState } from 'react';
import { useModalStore } from '../../store/modalStore';
import { bookmarkUtils } from '../../utils/bookmarkUtils';
import { Folder, AddCircle } from "@solar-icons/react";

const BookmarkFolderModal = ({ postId, currentFolderId, onMoved }) => {
    const closeModal = useModalStore(state => state.closeModal);
    const folders = bookmarkUtils.getFolders();
    
    const [isCreating, setIsCreating] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const handleMove = (folderId) => {
        bookmarkUtils.movePost(postId, folderId);
        if (onMoved) onMoved();
        closeModal();
    };

    const handleCreateAndMove = () => {
        if (!newFolderName.trim()) return;
        const newId = bookmarkUtils.createFolder(newFolderName.trim());
        handleMove(newId);
    };

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: '800' }}>Выберите папку</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', maxHeight: '300px', overflowY: 'auto' }} className="custom-scrollbar">
                {folders.map(f => (
                    <button 
                        key={f.id}
                        onClick={() => handleMove(f.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '14px',
                            background: f.id === currentFolderId ? 'var(--color-primary-alpha)' : 'var(--color-input-bg)',
                            border: `1px solid ${f.id === currentFolderId ? 'var(--color-primary)' : 'transparent'}`,
                            borderRadius: '12px', cursor: 'pointer', color: 'var(--color-text)',
                            fontSize: '15px', fontWeight: '600', transition: 'all 0.2s'
                        }}
                    >
                        <Folder size={20} color={f.color || 'var(--color-text-secondary)'} variant="Bold" />
                        {f.name}
                        {f.id === currentFolderId && <span style={{ marginLeft: 'auto', color: 'var(--color-primary)' }}>✓</span>}
                    </button>
                ))}
            </div>

            {isCreating ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                        autoFocus
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        placeholder="Название папки"
                        style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--color-input-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', outline: 'none' }}
                    />
                    <button onClick={handleCreateAndMove} style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '12px', padding: '0 16px', fontWeight: 'bold', cursor: 'pointer' }}>OK</button>
                </div>
            ) : (
                <button 
                    onClick={() => setIsCreating(true)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: 'transparent', border: '1px dashed var(--color-border)', borderRadius: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    <AddCircle size={20} /> Создать новую папку
                </button>
            )}
        </div>
    );
};

export default BookmarkFolderModal;