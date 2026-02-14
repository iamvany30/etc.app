import React, { memo } from 'react';
import { usePostCard } from './usePostCard';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostFooter from './PostFooter';
import CommentsSection from './CommentsSection';
import '../../styles/PostCard.css';

const PostCard = ({ post, initialShowComments = false, highlightCommentId = null, isPinned = false }) => {
    const ctrl = usePostCard(post, initialShowComments, highlightCommentId);

    if (ctrl.isDeleted || !ctrl.localPost) return null;

    return (
        <article 
            ref={ctrl.postRef} 
            className={`post-container ${ctrl.wasViewed ? 'viewed-style' : ''} ${isPinned ? 'is-pinned-card' : ''}`} 
            onClick={() => ctrl.navigate(`/post/${ctrl.localPost.id}`)}
        >
            
            
            
            <PostHeader 
                post={ctrl.localPost} 
                isPinned={isPinned} 
                ctrl={ctrl}
            />

            <div className="post-body">
                <PostContent 
                    post={ctrl.localPost}
                    isEditing={ctrl.isEditing}
                    editContent={ctrl.editContent}
                    setEditContent={ctrl.setEditContent}
                    handleEditSave={ctrl.handleEditSave}
                    setIsEditing={ctrl.setIsEditing}
                    musicData={ctrl.musicData}
                    onLinkClick={ctrl.handleLinkClick}
                    textareaRef={ctrl.textareaRef}
                />

                <PostFooter 
                    ctrl={ctrl} 
                />

                {ctrl.showComments && (
                    <CommentsSection 
                        ctrl={ctrl}
                        highlightCommentId={highlightCommentId}
                    />
                )}
            </div>
        </article>
    );
};

export default memo(PostCard);