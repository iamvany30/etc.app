import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useUserStore } from '../store/userStore';
import { useModalStore } from '../store/modalStore';
import { useIslandStore } from '../store/islandStore'; 
import { apiClient } from '../api/client';
import PhoneVerificationModal from './modals/PhoneVerificationModal';
import EmojiPicker from './EmojiPicker';
import '../styles/CreateComment.css';  
import { ImageIcon, CloseIcon, SendIcon, EmojiIcon } from './icons/CommonIcons';

const CreateComment = ({ postId, onCommentCreated, replyTo, onCancelReply }) => {
    const currentUser = useUserStore(state => state.currentUser);
    const openModal = useModalStore(state => state.openModal);
    const showIslandAlert = useIslandStore(state => state.showIslandAlert); 
    const [text, setText] = useState("");
    const [attachments, setAttachments] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        if (replyTo && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [replyTo]);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file || attachments.length > 0) return;  
        setIsUploading(true);
        try {
            const result = await apiClient.uploadFile(file);
            if (result?.data?.id) setAttachments([result.data]);
        } catch (err) { 
            console.error(err); 
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const insertEmoji = useCallback((emoji) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            setText(prev => prev + emoji);
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = textarea.value;
        const newText = currentText.substring(0, start) + emoji + currentText.substring(end);
        
        setText(newText);
        
        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }, 0);
    }, []);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if ((!text.trim() && attachments.length === 0) || isSending || isUploading) return;
        
        setIsSending(true);
        try {
            const attachmentIds = attachments.map(att => att.id);
            let result;

            if (replyTo) {
                result = await apiClient.addReply(replyTo.id, text, attachmentIds, replyTo.author.id);
            } else {
                result = await apiClient.addComment(postId, text, attachmentIds);
            }
            
            if (result && !result.error) {
                setText("");
                setAttachments([]);
                setShowEmojiPicker(false);
                if (onCommentCreated) onCommentCreated(result.data || result);
                if (onCancelReply) onCancelReply();
                if (textareaRef.current) textareaRef.current.style.height = 'auto';
            } else {
                if (result?.error?.code === 'PHONE_VERIFICATION_REQUIRED') {
                    openModal(<PhoneVerificationModal user={currentUser} />);
                } else {
                    
                    showIslandAlert('error', result?.error?.message || 'Не удалось отправить.', '❌');
                }
            }
        } catch (err) {
            
            showIslandAlert('error', err.message, '📡');
        } finally {
            setIsSending(false);
        }
    };
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    if (!currentUser) return null;

    return (
        <div className="create-comment-container">
            {replyTo && (
                <div className="reply-indicator">
                    <span>В ответ <b>@{replyTo.author.username}</b></span>
                    <button type="button" className="cancel-reply-btn" onClick={onCancelReply}>
                        <CloseIcon />
                    </button>
                </div>
            )}
            <form className="create-comment-form" onSubmit={handleSubmit}>
                <div className="avatar" style={{width: 32, height: 32, fontSize: 16}}>
                    {currentUser.avatar}
                </div>
                <div className="comment-input-area">
                    <textarea 
                        ref={textareaRef}
                        className="comment-textarea"
                        placeholder={replyTo ? "Написать ответ..." : "Написать комментарий..."}
                        value={text} 
                        onChange={e => {
                            setText(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onKeyDown={handleKeyDown}
                    />
                    
                    {attachments.length > 0 && (
                        <div className="comment-attachments-preview">
                            {attachments.map(att => (
                                <div key={att.id} className="comment-attachment-item">
                                    <img src={att.url} alt="media" />
                                    <button 
                                        type="button" 
                                        className="remove-comment-att-btn" 
                                        onClick={() => setAttachments([])}
                                    >
                                        <CloseIcon />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <div className="comment-form-footer" style={{ position: 'relative' }}>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileSelect} 
                            style={{display: 'none'}} 
                            accept="image/*,video/*" 
                        />
                        
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                                type="button" 
                                className="comment-tool-btn" 
                                onClick={() => fileInputRef.current.click()} 
                                disabled={isUploading || attachments.length > 0}
                                title="Прикрепить медиа"
                            >
                                <ImageIcon size={22} />
                            </button>
                            
                            <button 
                                type="button" 
                                className={`comment-tool-btn ${showEmojiPicker ? 'active' : ''}`} 
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                title="Эмодзи"
                            >
                                <EmojiIcon size={22} />
                            </button>
                        </div>

                        {showEmojiPicker && (
                            <EmojiPicker 
                                position="top"
                                onSelect={insertEmoji} 
                                onClose={() => setShowEmojiPicker(false)} 
                            />
                        )}

                        <button 
                            type="submit" 
                            className="comment-submit-btn" 
                            disabled={(!text.trim() && attachments.length === 0) || isSending}
                        >
                            {isSending ? '...' : <SendIcon />}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateComment;