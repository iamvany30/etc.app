import React, { useState, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { apiClient } from '../api/client';
import '../styles/CreateComment.css';  

 
const ImageIcon = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0z"></path></svg>);
const CloseIcon = () => (<svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"></path></svg>);
const SendIcon = () => (<svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>);


const CreateComment = ({ postId, onCommentCreated }) => {
    const { currentUser } = useUser();
    const [text, setText] = useState("");
    const [attachments, setAttachments] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file || attachments.length > 0) return;  

        setIsUploading(true);
        try {
            const uploaded = await apiClient.uploadFile(file);
            if (uploaded && uploaded.id) {
                setAttachments([uploaded]);
            } else {
                alert(`Ошибка загрузки: ${uploaded?.error?.message || 'Неизвестная ошибка'}`);
            }
        } catch (err) {
            alert("Сетевая ошибка при загрузке: " + err.message);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (id) => {
        setAttachments(prev => prev.filter(att => att.id !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if ((!text.trim() && attachments.length === 0) || isSending || isUploading) return;
        
        setIsSending(true);
        try {
            const attachmentIds = attachments.map(att => att.id);
            const newComment = await apiClient.addComment(postId, text, attachmentIds);
            
            if (newComment && !newComment.error) {
                setText("");
                setAttachments([]);
                if (onCommentCreated) onCommentCreated(newComment);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    if (!currentUser) return null;

    return (
        <form className="create-comment-form" onSubmit={handleSubmit}>
            <div className="avatar" style={{width: 32, height: 32, fontSize: 16}}>
                {currentUser.avatar}
            </div>
            <div className="comment-input-area">
                <textarea 
                    ref={textareaRef}
                    className="comment-textarea"
                    placeholder="Написать комментарий..." 
                    value={text} 
                    onChange={e => {
                        setText(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                    }} 
                />
                
                {attachments.length > 0 && (
                    <div className="comment-attachments-preview">
                        {attachments.map(att => (
                            <div key={att.id} className="comment-attachment-item">
                                <img src={att.url} alt="media" />
                                <button className="remove-comment-att-btn" onClick={() => removeAttachment(att.id)}><CloseIcon /></button>
                            </div>
                        ))}
                    </div>
                )}

                {isUploading && <div className="comment-upload-indicator">Загрузка...</div>}

                <div className="comment-form-footer">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{display: 'none'}} accept="image/*,video/*" />
                    <button 
                        type="button" 
                        className="comment-tool-btn" 
                        onClick={() => fileInputRef.current.click()} 
                        disabled={isUploading || attachments.length > 0} 
                        title="Прикрепить фото или видео">
                        <ImageIcon />
                    </button>
                    <button type="submit" className="comment-submit-btn" disabled={!text.trim() && attachments.length === 0}>
                        {isSending ? '...' : <SendIcon />}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default CreateComment;