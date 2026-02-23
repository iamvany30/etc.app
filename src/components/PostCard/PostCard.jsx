/* @source src/components/PostCard/PostCard.jsx */
import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { usePostCard } from './usePostCard';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostFooter from './PostFooter';
import CommentsSection from './CommentsSection';
import { PinIcon } from '../icons/MenuIcons'; 
import { RepostIcon } from '../icons/InteractionsIcons';
import '../../styles/PostCard.css';

const PostCard = ({ post, initialShowComments = false, highlightCommentId = null, isPinned = false }) => {
    const ctrl = usePostCard(post, initialShowComments, highlightCommentId);

    if (ctrl.isDeleted || !ctrl.localPost) return null;

    const { localPost } = ctrl;
    const isRepost = !localPost.content && localPost.originalPost;

    return (
        <article 
            ref={ctrl.postRef} 
            className={`post-container ${isPinned ? 'is-pinned-card' : ''}`}
            onClick={() => ctrl.navigate(`/post/${ctrl.localPost.id}`)}
            data-context-post-id={localPost.id}
            data-context-author-username={localPost.author?.username}
        >
            {(isPinned || isRepost) && (
                <div className="post-meta-row">
                    {isPinned ? (
                        <>
                            <PinIcon pinned={true} /> 
                            <span>Закреплённый пост</span>
                        </>
                    ) : (
                        <>
                            <RepostIcon /> 
                            <span>{localPost.author?.displayName} репостнул(а)</span>
                        </>
                    )}
                </div>
            )}

            <div className="post-avatar-column">
                <Link 
                    to={`/profile/${localPost.author?.username}`} 
                    className="avatar-wrapper-post"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="avatar" style={{
                        width: '100%', 
                        height: '100%', 
                        fontSize: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'var(--color-item-bg)',
                        borderRadius: '50%',
                        border: '1px solid var(--color-border)',
                        overflow: 'hidden'
                    }}>
                        {localPost.author?.avatar || "👤"}
                    </div>
                    {localPost.author?.online && (
                        <div className="online-indicator-post" title="В сети" />
                    )}
                </Link>
            </div>

            <div className="post-content-column">
                <PostHeader post={localPost} ctrl={ctrl} isPinned={isPinned} />
                
                <PostContent 
                    post={localPost}
                    isEditing={ctrl.isEditing}
                    editContent={ctrl.editContent}
                    setEditContent={ctrl.setEditContent}
                    handleEditSave={ctrl.handleEditSave}
                    setIsEditing={ctrl.setIsEditing}
                    musicData={ctrl.musicData}
                    onLinkClick={ctrl.handleLinkClick}
                    textareaRef={ctrl.textareaRef}
                />

                <PostFooter ctrl={ctrl} />
            </div>

            {ctrl.showComments && (
                <div className="comments-section-wrapper" onClick={e => e.stopPropagation()}>
                    <CommentsSection 
                        ctrl={ctrl}
                        highlightCommentId={highlightCommentId}
                    />
                </div>
            )}
        </article>
    );
};

export default memo(PostCard);