import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useModalStore } from '../../store/modalStore';
import { handleGlobalLinkClick } from '../../utils/linkUtils';
import MediaGrid from '../MediaGrid';
import { Reply } from "@solar-icons/react";
import '../../styles/CommentsSection.css';

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
    return <span className="comment-time">{time}</span>;
};

const CommentSkeleton = ({ depth }) => (
    <div className="comment-row-wrapper skeleton" style={{ marginLeft: `${Math.min(depth, 5) * 32}px` }}>
        {depth > 0 && <div className="comment-depth-indicator" />}
        <div className="comment-inner-container">
            <div className="comment-avatar-area">
                <div className="avatar small skeleton-pulse" style={{background: 'var(--color-border)'}} />
            </div>
            <div className="comment-body-area">
                <div className="skeleton-line w-40 skeleton-pulse" style={{marginBottom: 6, height: 14}} />
                <div className="skeleton-line w-80 skeleton-pulse" style={{height: 14}} />
            </div>
        </div>
    </div>
);

const CommentRow = ({ item, ctrl, highlightCommentId, postAuthorId, expandedIds, setExpandedIds }) => {
    const navigate = useNavigate();
    const openModal = useModalStore(state => state.openModal);

    const [isLoadingReplies, setIsLoadingReplies] = useState(false);

    const handleLinkClick = useCallback((e, url) => {
        handleGlobalLinkClick(e, url, navigate, openModal);
    }, [navigate, openModal]);

    const commentContent = item.data?.content;

    const renderParsedText = useMemo(() => {
        if (!commentContent) return null;
        const regex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(#[\wа-яА-ЯёЁ]+)|(@[a-zA-Z0-9_]+)/g;
        const parts = commentContent.split(regex).filter(Boolean);

        return parts.map((part, i) => {
            if (/^https?:\/\/[^\s]+/.test(part)) return <a key={i} href={part} onClick={(e) => handleLinkClick(e, part)} className="comment-md-link">{part}</a>;
            if (/^www\./.test(part)) return <a key={i} href={`http://${part}`} onClick={(e) => handleLinkClick(e, `http://${part}`)} className="comment-md-link">{part}</a>;
            if (part.startsWith('#')) return <Link key={i} to={`/explore?q=${encodeURIComponent(part)}`} onClick={(e) => e.stopPropagation()} className="comment-md-tag">{part}</Link>;
            if (part.startsWith('@')) return <Link key={i} to={`/profile/${part.substring(1)}`} onClick={(e) => e.stopPropagation()} className="comment-md-mention">{part}</Link>;
            return part;
        });
    }, [commentContent, handleLinkClick]);

    if (item.type === 'skeleton') {
        return <CommentSkeleton depth={item.depth} />;
    }

    const comment = item.data;
    const depth = item.depth;
    
    const isExpanded = expandedIds.has(comment.id);
    const isHighlighted = highlightCommentId === comment.id;
    const visualDepth = Math.min(depth, 5); 
    
    const repliesCount = comment.repliesCount ?? comment.commentsCount ?? comment._count?.replies ?? comment._count?.comments ?? 0;
    const loadedReplies = comment.replies || [];
    const missingCount = Math.max(0, repliesCount - loadedReplies.length);
    const hasReplies = repliesCount > 0 || loadedReplies.length > 0;
    const isPostAuthor = comment.author?.id === postAuthorId;

    const handleToggleReplies = async (e) => {
        e.stopPropagation();

        if (isExpanded && missingCount <= 0) {
            setExpandedIds(prev => { const n = new Set(prev); n.delete(comment.id); return n; });
            return;
        }

        setExpandedIds(prev => new Set(prev).add(comment.id));

        if (missingCount <= 0 || isLoadingReplies) return;

        setIsLoadingReplies(true);
        try {
            
            const res = await window.api.call(`/comments/${comment.id}/replies?page=1&limit=50&sort=oldest`, 'GET');
            const dataObj = res?.data || res || {};
            const fetchedReplies = dataObj.replies || dataObj.comments || dataObj.data || [];

            ctrl.setComments(prev => {
                const updateTree = (nodes) => nodes.map(n => {
                    if (n.id === comment.id) return { ...n, replies: fetchedReplies };
                    if (n.replies) return { ...n, replies: updateTree(n.replies) };
                    return n;
                });
                return updateTree(prev);
            });
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingReplies(false);
        }
    };

    let toggleBtnText = "";
    if (isLoadingReplies) toggleBtnText = "Загрузка...";
    else if (isExpanded) {
        if (missingCount > 0) toggleBtnText = `Показать ещё ${missingCount} ответов`;
        else toggleBtnText = "Свернуть ветку";
    } else {
        toggleBtnText = `Показать ответы (${repliesCount || loadedReplies.length})`;
    }

    return (
        <React.Fragment>
            <div 
                className={`comment-row-wrapper ${isHighlighted ? 'highlighted' : ''}`}
                style={{ marginLeft: `${visualDepth * 32}px` }} 
                id={`comment-${comment.id}`}
            >
                {depth > 0 && <div className="comment-depth-indicator" />}

                <div className="comment-inner-container">
                    <div className="comment-avatar-area">
                        <Link to={`/profile/${comment.author.username}`} className="comment-avatar-link">
                            <div className="avatar small">
                                {comment.author.avatar && comment.author.avatar.length > 5 ? (
                                    <img src={comment.author.avatar} alt={comment.author.username} />
                                ) : (
                                    comment.author.avatar || "👤"
                                )}
                            </div>
                        </Link>
                    </div>

                    <div className="comment-body-area">
                        <div className="comment-header-row">
                            <Link to={`/profile/${comment.author.username}`} className="comment-author-name">
                                {comment.author.displayName}
                            </Link>
                            {isPostAuthor && <span className="comment-author-badge">Автор</span>}
                            <span className="comment-handle">@{comment.author.username}</span>
                            <span className="comment-dot">·</span>
                            <TimeAgo dateStr={comment.createdAt} />
                        </div>

                        <div className="comment-text-content">
                            {renderParsedText}
                        </div>

                        {comment.attachments && comment.attachments.length > 0 && (
                            <div className="comment-attachments-box">
                                <MediaGrid attachments={comment.attachments} />
                            </div>
                        )}

                        <div className="comment-footer-actions">
                            <button className="cmt-action-btn reply" onClick={() => ctrl.setReplyTo(comment)}>
                                <Reply size={16} /> <span>Ответить</span>
                            </button>

                            {hasReplies && (
                                <button className="cmt-toggle-replies-btn" onClick={handleToggleReplies}>
                                    {toggleBtnText}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {}
            {isExpanded && (
                <div className="replies-container">
                    {isLoadingReplies && loadedReplies.length === 0 && (
                        <React.Fragment>
                            <CommentSkeleton depth={depth + 1} />
                            <CommentSkeleton depth={depth + 1} />
                        </React.Fragment>
                    )}
                    {loadedReplies.map(reply => (
                        <CommentRow
                            key={reply.id}
                            item={{ type: 'comment', data: reply, depth: depth + 1 }}
                            ctrl={ctrl}
                            highlightCommentId={highlightCommentId}
                            postAuthorId={postAuthorId}
                            expandedIds={expandedIds}
                            setExpandedIds={setExpandedIds}
                        />
                    ))}
                </div>
            )}
        </React.Fragment>
    );
};

export default memo(CommentRow);