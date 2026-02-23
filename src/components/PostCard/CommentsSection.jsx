/* @source src/components/PostCard/CommentsSection.jsx */
import React, { useState, useEffect } from 'react';
import CreateComment from '../CreateComment';
import CommentRow from './CommentRow';
import '../../styles/CommentsSection.css';

const CommentsSection = ({ ctrl, highlightCommentId }) => {
    
    const [expandedIds, setExpandedIds] = useState(new Set());

    
    useEffect(() => {
        if (highlightCommentId) {
            const ids = new Set();
            const traverse = (items) => {
                for (const c of items) {
                    if (c.id === highlightCommentId || (c.replies && traverse(c.replies))) {
                        ids.add(c.id);
                        return true;
                    }
                }
                return false;
            };
            traverse(ctrl.comments);
            setExpandedIds(ids);
            
            setTimeout(() => {
                const el = document.getElementById(`comment-${highlightCommentId}`);
                if(el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }, 500);
        }
    }, [highlightCommentId, ctrl.comments]);

    const onCommentCreated = (newComment) => {
        if (ctrl.replyTo) {
            ctrl.setComments(prev => {
                const addToTree = (nodes) => nodes.map(n => {
                    if (n.id === ctrl.replyTo.id) {
                        return {
                            ...n,
                            replies: [...(n.replies || []), newComment],
                            repliesCount: (n.repliesCount || 0) + 1
                        };
                    }
                    if (n.replies) return { ...n, replies: addToTree(n.replies) };
                    return n;
                });
                return addToTree(prev);
            });
            setExpandedIds(prev => new Set(prev).add(ctrl.replyTo.id));
        } else {
            ctrl.setComments(prev => [newComment, ...prev]);
        }
        ctrl.setCommentsCount(prev => prev + 1);
        ctrl.setReplyTo(null); 
    };

    return (
        <div className="comments-virtual-wrapper" onClick={e => e.stopPropagation()}>
            <div className="comments-create-sticky">
                <CreateComment 
                    postId={ctrl.localPost.id} 
                    onCommentCreated={onCommentCreated}
                    replyTo={ctrl.replyTo}
                    onCancelReply={() => ctrl.setReplyTo(null)}
                />
            </div>

            <div className="comments-list-container">
                {ctrl.comments.map(comment => (
                    <CommentRow 
                        key={comment.id}
                        item={{ type: 'comment', data: comment, depth: 0 }}
                        ctrl={ctrl}
                        highlightCommentId={highlightCommentId}
                        postAuthorId={ctrl.localPost.author?.id}
                        expandedIds={expandedIds}
                        setExpandedIds={setExpandedIds}
                    />
                ))}
            </div>

            {}
            {ctrl.comments.length === 0 && (
                <div className="comments-empty">
                    {ctrl.loadingComments ? (
                        <div className="spinner-mini" />
                    ) : (
                        <span>Нет комментариев. Напишите первое сообщение!</span>
                    )}
                </div>
            )}

            {}
            {ctrl.comments.length > 0 && (
                <div className="comments-footer-area">
                    {ctrl.hasMoreComments ? (
                        <div className="comments-load-more-container">
                            <button 
                                className="comments-load-more-btn"
                                onClick={() => ctrl.loadComments(true)}
                                disabled={ctrl.loadingComments}
                            >
                                {ctrl.loadingComments ? <div className="spinner-mini" /> : 'Загрузить ещё комментарии'}
                            </button>
                        </div>
                    ) : (
                        ctrl.comments.length >= 5 ? (
                            <div className="comments-end-msg">Вся ветка загружена</div>
                        ) : null
                    )}
                </div>
            )}
        </div>
    );
};

export default CommentsSection;