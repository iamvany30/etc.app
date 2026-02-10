import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useUser } from '../context/UserContext';
import '../styles/Comment.css';

const renderParsedText = (text) => {
    if (!text) return null;
    const regex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(#[\wа-яА-ЯёЁ]+)|(@[a-zA-Z0-9_]+)/g;
    const parts = text.split(regex).filter(Boolean);

    return parts.map((part, i) => {
        if (/^https?:\/\//.test(part)) return <a key={i} href={part} target="_blank" rel="noopener" className="post-external-link">{part}</a>;
        if (part.startsWith('#')) return <Link key={i} to={`/explore?q=${encodeURIComponent(part)}`} className="post-hashtag">{part}</Link>;
        if (part.startsWith('@')) return <Link key={i} to={`/profile/${part.substring(1)}`} className="post-mention">{part}</Link>;
        return part;
    });
};

const Comment = ({ comment, postId, onCommentAdded }) => {
    const { currentUser } = useUser();
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyText.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            
            const finalContent = `@${comment.author.username} ${replyText}`;
            const res = await apiClient.addComment(postId, finalContent);
            
            if (res && !res.error) {
                setReplyText('');
                setIsReplying(false);
                if (onCommentAdded) onCommentAdded(res);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!comment) return null;

    return (
        <div className="comment-thread">
            <div className="comment-item">
                <Link to={`/profile/${comment.author?.username}`}>
                    <div className="avatar" style={{width: 32, height: 32, fontSize: 16}}>
                        {comment.author?.avatar}
                    </div>
                </Link>
                <div className="comment-content-wrapper">
                    <div className="comment-header">
                        <Link to={`/profile/${comment.author?.username}`} className="post-author">
                            {comment.author?.displayName}
                        </Link>
                        <span className="post-handle">@{comment.author?.username}</span>
                    </div>
                    <div className="comment-text">
                        {renderParsedText(comment.content)}
                    </div>
                    
                    <div className="comment-actions">
                        <button 
                            className="comment-reply-btn" 
                            onClick={() => setIsReplying(!isReplying)}
                        >
                            Ответить
                        </button>
                    </div>

                    {isReplying && (
                        <form className="reply-form" onSubmit={handleReplySubmit}>
                            <input 
                                autoFocus
                                className="reply-input"
                                placeholder={`Ответить @${comment.author.displayName}...`}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                            />
                            <button type="submit" disabled={!replyText.trim() || isSubmitting}>
                                {isSubmitting ? '...' : 'ОК'}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {comment.replies && comment.replies.length > 0 && (
                <div className="replies-container">
                    {comment.replies.map(reply => (
                        <Comment 
                            key={reply.id} 
                            comment={reply} 
                            postId={postId} 
                            onCommentAdded={onCommentAdded} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Comment;