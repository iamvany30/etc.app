import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useModal } from '../context/ModalContext';
import { apiClient } from '../api/client';
import PhoneVerificationModal from './modals/PhoneVerificationModal';
import '../styles/CreateComment.css';  
import { ImageIcon, CloseIcon, SendIcon } from './icons/CommonIcons';

const CreateComment = ({ postId, onCommentCreated, replyTo, onCancelReply }) => {
    const { currentUser } = useUser();
    const { openModal } = useModal();
    const [text, setText] = useState("");
    const [attachments, setAttachments] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
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
        } catch (err) { console.error(err); } 
        finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

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
                if (onCommentCreated) onCommentCreated(result.data || result);
                if (onCancelReply) onCancelReply();
                if (textareaRef.current) textareaRef.current.style.height = 'auto';
            } else {
                if (result?.error?.code === 'PHONE_VERIFICATION_REQUIRED') {
                    openModal(<PhoneVerificationModal user={currentUser} />);
                } else {
                    alert(`Ошибка: ${result?.error?.message || 'Не удалось отправить.'}`);
                }
            }
        } catch (err) {
            alert(`Ошибка: ${err.message}`);
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
                    <button className="cancel-reply-btn" onClick={onCancelReply}><CloseIcon /></button>
                </div>
            )}
            <form className="create-comment-form" onSubmit={handleSubmit}>
                <div className="avatar" style={{width: 32, height: 32, fontSize: 16}}>{currentUser.avatar}</div>
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
                                    <button type="button" className="remove-comment-att-btn" onClick={() => setAttachments([])}><CloseIcon /></button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="comment-form-footer">
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{display: 'none'}} accept="image/*,video/*" />
                        <button type="button" className="comment-tool-btn" onClick={() => fileInputRef.current.click()} disabled={isUploading || attachments.length > 0}><ImageIcon /></button>
                        <button type="submit" className="comment-submit-btn" disabled={(!text.trim() && attachments.length === 0) || isSending}>
                            {isSending ? '...' : <SendIcon />}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateComment;