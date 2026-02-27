/* @source src/components/modals/EditPostModal.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { useModalStore } from '../../store/modalStore';
import { useIslandStore } from '../../store/islandStore';
import { apiClient } from '../../api/client';
import { reconstructMarkdown } from '../../utils/markdownUtils';

const EditPostModal = ({ post, onSuccess }) => {
    const closeModal = useModalStore(state => state.closeModal);
    const showIslandAlert = useIslandStore(state => state.showIslandAlert);
    const textareaRef = useRef(null);
    
    const [text, setText] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    
    useEffect(() => {
        if (post) {
            const rawMarkdown = reconstructMarkdown(post.content || '', post.spans || []);
            setText(rawMarkdown);
            
            
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
                    textareaRef.current.focus();
                    textareaRef.current.setSelectionRange(rawMarkdown.length, rawMarkdown.length);
                }
            }, 50);
        }
    }, [post]);

    const handleTextChange = (e) => {
        setText(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };

    const handleSave = async () => {
        const trimmed = text.trim();
        if (!trimmed && !(post.attachments && post.attachments.length > 0) && !post.poll) return;

        setIsSaving(true);
        try {
            const res = await apiClient.editPost(post.id, text);
            if (res && !res.error) {
                showIslandAlert('success', 'Пост обновлен', '✏️');
                if (onSuccess) {
                    onSuccess({
                        content: res.data?.content || text,
                        spans: res.data?.spans || [],
                        isEdited: true
                    });
                }
                closeModal();
            } else {
                showIslandAlert('error', res?.error?.message || 'Ошибка сохранения', '❌');
            }
        } catch (e) {
            showIslandAlert('error', 'Ошибка сети', '📡');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', width: '100%' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: '800', color: 'var(--color-text)' }}>
                Редактирование поста
            </h2>
            
            <div style={{
                backgroundColor: 'var(--color-input-bg)',
                borderRadius: '16px',
                padding: '12px',
                border: '1px solid var(--color-primary)'
            }}>
                <textarea 
                    ref={textareaRef}
                    value={text}
                    onChange={handleTextChange}
                    placeholder="Текст поста..."
                    disabled={isSaving}
                    style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text)',
                        fontSize: '15px',
                        fontFamily: 'inherit',
                        resize: 'none',
                        outline: 'none',
                        minHeight: '80px',
                        maxHeight: '50vh',
                        lineHeight: 1.5
                    }}
                />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button 
                    onClick={closeModal} 
                    disabled={isSaving}
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
                    disabled={isSaving}
                    style={{
                        flex: 1, padding: '14px', borderRadius: '99px',
                        background: 'var(--color-primary)', border: 'none',
                        color: '#fff', fontWeight: '700', fontSize: '14px',
                        cursor: isSaving ? 'default' : 'pointer', opacity: isSaving ? 0.7 : 1
                    }}
                >
                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                </button>
            </div>
        </div>
    );
};

export default EditPostModal;