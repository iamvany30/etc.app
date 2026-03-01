
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import TimeAgo from './TimeAgo';
import PostMenu from './PostMenu';
import PostHistoryModal from '../modals/PostHistoryModal';
import { MoreIcon } from '../icons/MenuIcons';

import { useItdPlusStore } from '../../store/itdPlusStore';
import VerifiedBadgeWithTooltip from '../VerifiedBadgeWithTooltip';
import PinBadge from '../PinBadge';

const GOLD_VERIFIED_IDS = ['48f4cd67-58a2-4c0d-b1be-235fc4bb91a4'];

const PostHeader = ({ post, ctrl, isPinned }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuAnchorRef = useRef(null);

    
    const verifiedUsersSet = useItdPlusStore(state => state.verifiedUsers);
    const isGreenVerified = verifiedUsersSet.has(post.author?.id) || verifiedUsersSet.has(post.author?.username);
    
    const hasBlue = post.author?.verified || post.author?.isVerified;
    const hasGold = post.author ? GOLD_VERIFIED_IDS.includes(post.author.id) : false;

    return (
        <div className="post-header-row">
            <div className="post-header-info">
                <Link to={`/profile/${post.author?.username}`} className="post-author" onClick={e => e.stopPropagation()}>
                    {post.author?.displayName}
                </Link>
                
                {}
                {hasBlue ? (
                    <VerifiedBadgeWithTooltip type="blue" size={16} />
                ) : hasGold ? (
                    <VerifiedBadgeWithTooltip type="gold" size={16} />
                ) : isGreenVerified ? (
                    <VerifiedBadgeWithTooltip type="green" size={16} />
                ) : null}

                {}
                <PinBadge pin={post.author?.pin || post.author?.activePin} size={16} />

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