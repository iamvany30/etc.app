/* @source src/components/Comment.jsx */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useModal } from '../context/ModalContext';
import ExternalLinkModal, { isTrustedLink } from './modals/ExternalLinkModal';
import MediaGrid from './MediaGrid';
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

    return <span className="post-handle" style={{ marginLeft: 4 }}>· {time}</span>;
};


const Comment = ({ comment, postId, onReply, highlightCommentId }) => {
    const { openModal } = useModal();

    
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
        e.preventDefault();
        e.stopPropagation();

        try {
            const urlObj = new URL(url);
            const isInternalDomain = urlObj.hostname.endsWith('итд.com') || 
                                     urlObj.hostname.endsWith('xn--d1ah4a.com') ||
                                     urlObj.hostname === 'localhost';

            if (isInternalDomain) {
                const path = urlObj.pathname;

                
                const postMatch = path.match(/^\/@[^/]+\/post\/([^/]+)/);
                if (postMatch) {
                    window.location.hash = `#/post/${postMatch[1]}`;
                    return;
                }

                
                const staticPages = { 
                    '/feed': '#/', 
                    '/explore': '#/explore', 
                    '/notifications': '#/notifications', 
                    '/music': '#/music' 
                };
                if (staticPages[path]) {
                    window.location.hash = staticPages[path];
                    return;
                }

                
                if (path.length > 1) {
                    const username = path.startsWith('/@') ? path.substring(2) : path.substring(1);
                    window.location.hash = `#/profile/${username}`;
                    return;
                }
            }
        } catch (err) {
            console.error("Link parsing error", err);
        }

        
        if (isTrustedLink(url)) {
            window.api.openExternalLink(url);
        } else {
            openModal(<ExternalLinkModal url={url} />);
        }
    }, [openModal]);

    
    const renderParsedText = useMemo(() => {
        const text = comment.content;
        if (!text) return null;

        const regex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(#[\wа-яА-ЯёЁ]+)|(@[a-zA-Z0-9_]+)/g;
        const parts = text.split(regex).filter(Boolean);

        return parts.map((part, i) => {
            if (/^https?:\/\//.test(part)) {
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
            className={`comment-thread ${isHighlighted ? 'highlighted' : ''}`} 
            id={`comment-${comment.id}`}
        >
            <div className="comment-item">
                <Link to={`/profile/${comment.author.username}`} className="comment-avatar-link">
                    <div className="avatar comment-avatar" style={{ backgroundColor: 'var(--color-item-bg)' }}>
                        {comment.author.avatar || "👤"}
                    </div>
                </Link>
                
                <div className="comment-content-wrapper">
                    <div className="comment-header">
                        <Link to={`/profile/${comment.author.username}`} className="post-author">
                            {comment.author.displayName}
                        </Link>
                        <span className="post-handle">@{comment.author.username}</span>
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
                            Ответить
                        </button>
                    </div>
                </div>
            </div>

            {}
            {comment.repliesCount > 0 && !showReplies && (
                <button className="view-replies-btn" onClick={() => setShowReplies(true)}>
                    ── Показать ответы ({comment.repliesCount})
                </button>
            )}

            {showReplies && (
                <div className="replies-container">
                    {(comment.replies || []).map(reply => (
                        <Comment 
                            key={reply.id} 
                            comment={reply} 
                            postId={postId}
                            onReply={onReply}
                            highlightCommentId={highlightCommentId}  
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Comment;