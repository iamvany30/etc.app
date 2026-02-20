import React from 'react';
import { LikeIcon, CommentIcon, RepostIcon, ViewIcon, BookmarkIcon  } from '../icons/InteractionsIcons';

const PostFooter = ({ ctrl }) => {
    return (
        <div className="post-footer-actions">
            <button 
                className={`action-group comment ${ctrl.showComments ? 'active' : ''}`} 
                onClick={(e) => { e.stopPropagation(); ctrl.setShowComments(!ctrl.showComments); }}
                title="Комментировать"
            >
                <div className="action-icon-wrapper">
                    <CommentIcon />
                </div>
                <span>{ctrl.commentsCount > 0 ? ctrl.commentsCount : ''}</span>
            </button>
            
            <button 
                className={`action-group repost ${ctrl.isReposted ? 'active' : ''}`} 
                onClick={ctrl.handleRepost}
                title="Репост"
            >
                <div className="action-icon-wrapper">
                    <RepostIcon />
                </div>
                <span>{ctrl.repostsCount > 0 ? ctrl.repostsCount : ''}</span>
            </button>
            
            <button 
                className={`action-group like ${ctrl.liked ? 'active' : ''}`} 
                onClick={ctrl.handleLike}
                title="Нравится"
            >
                <div className="action-icon-wrapper">
                    <LikeIcon active={ctrl.liked} />
                </div>
                <span>{ctrl.likesCount > 0 ? ctrl.likesCount : ''}</span>
            </button>

            <button 
                className={`action-group bookmark ${ctrl.isSaved ? 'active' : ''}`} 
                onClick={ctrl.handleSave}
                title={ctrl.isSaved ? "Удалить из закладок" : "Сохранить"}
            >
                <div className="action-icon-wrapper">
                    <BookmarkIcon active={ctrl.isSaved} />
                </div>
            </button>
            
            <button className="action-group view" onClick={e => e.stopPropagation()} title="Просмотры">
                <div className="action-icon-wrapper">
                    <ViewIcon />
                </div>
                <span>{ctrl.localPost.viewsCount || 0}</span>
            </button>
        </div>
    );
};

export default PostFooter;