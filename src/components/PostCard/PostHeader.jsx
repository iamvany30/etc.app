import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import TimeAgo from './TimeAgo';
import PostMenu from './PostMenu';
import { MoreIcon } from '../icons/MenuIcons';
import { PinIcon } from '../icons/MenuIcons'; 
import { RepostIcon as RepostIndicatorIcon } from '../icons/InteractionsIcons';

const PostHeader = ({ post, isPinned, ctrl }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuAnchorRef = useRef(null);

    return (
        <>
            
            {isPinned && (
                <div className="post-pinned-label">
                    <PinIcon pinned={true} style={{ width: 14, height: 14 }} />
                    <span>Закреплённый пост</span>
                </div>
            )}

            
            {!post.content && post.originalPost && (
                <div className="repost-indicator">
                    <RepostIndicatorIcon width="14" height="14" />
                    <span>{post.author?.displayName} репостнул(а)</span>
                </div>
            )}

            <header className="post-header">
                
                <Link to={`/profile/${post.author?.username}`} className="post-header-avatar-link" onClick={e => e.stopPropagation()}>
                    <div className="avatar-wrapper-post">
                        
                        {post.author?.online && <div className="online-indicator-post" />}
                        
                        <div className="avatar post-avatar-small">
                            {post.author?.avatar || "👤"}
                        </div>
                    </div>
                </Link>

                <div className="post-header-info">
                    <Link to={`/profile/${post.author?.username}`} className="post-author" onClick={e => e.stopPropagation()}>
                        {post.author?.displayName}
                    </Link>
                    <span className="post-handle">
                        @{post.author?.username} · <TimeAgo dateStr={post.createdAt} />
                    </span>
                </div>

                <div className="post-menu-wrapper" ref={menuAnchorRef} onClick={e => e.stopPropagation()}>
                    <button className="post-menu-btn" onClick={() => setShowMenu(!showMenu)}>
                        <MoreIcon />
                    </button>
                    
                    {showMenu && (
                        <PostMenu 
                            post={post} 
                            isOwner={ctrl.isOwner} 
                            isPinned={isPinned}
                            ctrl={ctrl}
                            onClose={() => setShowMenu(false)}
                            anchorRef={menuAnchorRef}
                        />
                    )}
                </div>
            </header>
        </>
    );
};

export default PostHeader;