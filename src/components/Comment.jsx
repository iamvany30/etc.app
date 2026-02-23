import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useModalStore } from '../store/modalStore';
import { handleGlobalLinkClick } from '../utils/linkUtils';
import MediaGrid from './MediaGrid';
import { ReplyIcon } from './icons/CustomIcons';
import '../styles/Comment.css';

const TimeAgo = ({ dateStr }) => {
    const [time, setTime] = useState('');
    
    useEffect(() => {
        if (!dateStr) return;
        const calcTime = () => {
            const date = new Date(dateStr);
            const now = new Date();
            const diff = Math.round((now - date) / 1000);
            if (diff < 60) setTime(`${diff}с`);
            else if (diff < 3600) setTime(`${Math.floor(diff / 60)}м`);
            else if (diff < 86400) setTime(`${Math.floor(diff / 3600)}ч`);
            else setTime(date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }));
        };
        calcTime();
        const timer = setInterval(calcTime, 60000);
        return () => clearInterval(timer);
    }, [dateStr]);

    return <span className="post-time">{time}</span>;
};

const Comment = ({ comment, postId, onReply, highlightCommentId, isReply = false }) => {
    const openModal = useModalStore(state => state.openModal);
    const navigate = useNavigate();

    const shouldExpand = useMemo(() => {
        const checkContainsHighlight = (replies) => {
            if (!replies || !highlightCommentId) return false;
            return replies.some(r => r.id === highlightCommentId || checkContainsHighlight(r.replies));
        };
        return checkContainsHighlight(comment.replies);
    }, [comment.replies, highlightCommentId]);

    const [showReplies, setShowReplies] = useState(shouldExpand);

    useEffect(() => {
        if (shouldExpand) setShowReplies(true);
    }, [shouldExpand]);

    const handleLinkClick = useCallback((e, url) => {
        handleGlobalLinkClick(e, url, navigate, openModal);
    }, [navigate, openModal]);

    const renderParsedText = useMemo(() => {
        const text = comment.content;
        if (!text) return null;

        const regex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(#[\wа-яА-ЯёЁ]+)|(@[a-zA-Z0-9_]+)/g;
        const parts = text.split(regex).filter(Boolean);

        return parts.map((part, i) => {
            if (/^https?:\/\/[^\s]+/.test(part)) {
                return <a key={i} href={part} onClick={(e) => handleLinkClick(e, part)} className="post-external-link">{part}</a>;
            }
            if (/^www\./.test(part)) {
                return <a key={i} href={`http://${part}`} onClick={(e) => handleLinkClick(e, `http://${part}`)} className="post-external-link">{part}</a>;
            }
            if (part.startsWith('#')) {
                return <Link key={i} to={`/explore?q=${encodeURIComponent(part)}`} onClick={(e) => e.stopPropagation()} className="post-hashtag">{part}</Link>;
            }
            if (part.startsWith('@')) {
                return <Link key={i} to={`/profile/${part.substring(1)}`} onClick={(e) => e.stopPropagation()} className="post-mention">{part}</Link>;
            }
            return part;
        });
    }, [comment.content, handleLinkClick]);

    if (!comment || !comment.author) return null;

    const isMutual = comment.author.isFollowing && comment.author.isFollowedBy;
    const followsYou = comment.author.isFollowedBy && !comment.author.isFollowing;
    const isHighlighted = highlightCommentId === comment.id;

    return (
        <div 
            className={`comment-thread ${isHighlighted ? 'highlighted' : ''} ${isReply ? 'is-reply' : ''}`} 
            id={`comment-${comment.id}`}
        >
            <div className="comment-item">
                <div className="comment-avatar-col">
                    <Link to={`/profile/${comment.author.username}`} className="comment-avatar-link">
                        <div className="avatar comment-avatar">
                            {comment.author.avatar || "👤"}
                        </div>
                    </Link>
                    {(showReplies || (!showReplies && comment.repliesCount > 0)) && (
                        <div className="comment-thread-line" />
                    )}
                </div>
                
                <div className="comment-content-wrapper">
                    <div className="comment-header">
                        <Link to={`/profile/${comment.author.username}`} className="post-author">
                            {comment.author.displayName}
                        </Link>
                        <span className="post-handle">@{comment.author.username}</span>
                        <span className="post-dot">·</span>
                        <TimeAgo dateStr={comment.createdAt} />
                        
                        {isMutual && <span className="mutual-badge-mini">взаимно</span>}
                        {followsYou && !isMutual && <span className="mutual-badge-mini">читает вас</span>}
                    </div>
                    
                    <div className="comment-body">
                        {comment.content && (
                            <div className="comment-text">
                                {renderParsedText}
                            </div>
                        )}
                        
                        {comment.attachments && comment.attachments.length > 0 && (
                            <div className="comment-media-container">
                                <MediaGrid attachments={comment.attachments} />
                            </div>
                        )}
                    </div>
                    
                    <div className="comment-actions">
                        <button 
                            className="comment-reply-btn" 
                            onClick={() => onReply && onReply(comment)}
                        >
                            <ReplyIcon />
                            <span>Ответить</span>
                        </button>
                    </div>
                </div>
            </div>

            {comment.repliesCount > 0 && !showReplies && (
                <div className="comment-show-replies">
                    <div className="comment-thread-line-stub" />
                    <button className="view-replies-btn" onClick={() => setShowReplies(true)}>
                        Показать ответы ({comment.repliesCount})
                    </button>
                </div>
            )}

            {showReplies && comment.replies && comment.replies.length > 0 && (
                <div className="replies-container">
                    {comment.replies.map(reply => (
                        <Comment 
                            key={reply.id} 
                            comment={reply} 
                            postId={postId}
                            onReply={onReply}
                            highlightCommentId={highlightCommentId}
                            isReply={true}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Comment;