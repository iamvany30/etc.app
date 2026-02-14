import React from 'react';
import { LikeIcon, CommentIcon, RepostIcon, ViewIcon } from '../icons/InteractionsIcons';

const PostFooter = ({ ctrl }) => {
    return (
        <footer className="post-actions">
            <button 
                className={`action-btn comment ${ctrl.showComments ? 'active' : ''}`} 
                onClick={(e) => { e.stopPropagation(); ctrl.setShowComments(!ctrl.showComments); }}
            >
                <span className="icon-wrapper"><CommentIcon /></span>
                <span>{ctrl.commentsCount}</span>
            </button>
            
            <button 
                className={`action-btn repost ${ctrl.isReposted ? 'active' : ''}`} 
                onClick={ctrl.handleRepost}
            >
                <span className="icon-wrapper"><RepostIcon /></span>
                <span>{ctrl.repostsCount}</span>
            </button>
            
            <button 
                className={`action-btn like ${ctrl.liked ? 'active' : ''}`} 
                onClick={ctrl.handleLike}
            >
                <span className="icon-wrapper"><LikeIcon active={ctrl.liked} /></span>
                <span>{ctrl.likesCount}</span>
            </button>
            
            <button className="action-btn view" onClick={e => e.stopPropagation()}>
                <span className="icon-wrapper"><ViewIcon /></span>
                <span>{ctrl.localPost.viewsCount || 0}</span>
            </button>
        </footer>
    );
};

export default PostFooter;