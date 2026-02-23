import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import TimeAgo from './TimeAgo';
import PostMenu from './PostMenu';
import PostHistoryModal from '../modals/PostHistoryModal';
import { MoreIcon } from '../icons/MenuIcons';

const PostHeader = ({ post, ctrl, isPinned }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuAnchorRef = useRef(null);

    return (
        <div className="post-header-row">
            <div className="post-header-info">
                <Link to={`/profile/${post.author?.username}`} className="post-author" onClick={e => e.stopPropagation()}>
                    {post.author?.displayName}
                </Link>
                <span className="post-handle">@{post.author?.username}</span>
                <span className="post-dot">·</span>
                <TimeAgo dateStr={post.createdAt} />
                {post.isEdited && (
                    <>
                        <span className="post-dot">·</span>
                        <span 
                            onClick={(e) => { e.stopPropagation(); ctrl.openModal(<PostHistoryModal postId={post.id} />); }}
                            style={{ 
                                fontSize: '12px', color: 'var(--color-text-secondary)', 
                                cursor: 'pointer', textDecoration: 'underline', 
                                textDecorationColor: 'transparent', transition: 'text-decoration-color 0.2s' 
                            }}
                            onMouseOver={e => e.target.style.textDecorationColor = 'currentColor'}
                            onMouseOut={e => e.target.style.textDecorationColor = 'transparent'}
                            title="Посмотреть историю изменений"
                        >
                            изменено
                        </span>
                    </>
                )}
            </div>

            <div ref={menuAnchorRef} onClick={e => e.stopPropagation()}>
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
        </div>
    );
};

export default PostHeader;