/* @source src/components/PostCard/QuotedPost.jsx */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import TimeAgo from './TimeAgo';
import MediaGrid from '../MediaGrid';
import { RichText } from '../RichText';


import { useItdPlusStore } from '../../store/itdPlusStore';
import VerifiedBadgeWithTooltip from '../VerifiedBadgeWithTooltip';
import PinBadge from '../PinBadge';

const GOLD_VERIFIED_IDS = ['48f4cd67-58a2-4c0d-b1be-235fc4bb91a4'];


const MAX_DEPTH = 2; 

const QuotedPost = ({ post, onLinkClick, depth = 0 }) => {
    const navigate = useNavigate();

    
    const authorId = post?.author?.id;
    const verifiedUsersSet = useItdPlusStore(state => state.verifiedUsers);
    const isGreenVerified = post?.author ? (verifiedUsersSet.has(authorId) || verifiedUsersSet.has(post.author.username)) : false;

    if (!post) return null;

    const hasBlue = post.author?.verified || post.author?.isVerified;
    const hasGold = post.author ? GOLD_VERIFIED_IDS.includes(post.author.id) : false;

    const handleNavigate = (e) => {
        e.stopPropagation();
        navigate(`/post/${post.id}`);
    };

    
    if (depth >= MAX_DEPTH) {
        return (
            <div 
                className="quote-container-stub" 
                onClick={handleNavigate}
                style={{
                    marginTop: 8, 
                    padding: '10px 14px', 
                    borderRadius: 14,
                    background: 'var(--color-input-bg)', 
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-primary)', 
                    fontSize: 13, 
                    fontWeight: 600,
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    transition: 'background-color 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-item-bg)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--color-input-bg)'}
            >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Смотреть вложенный пост...</span>
            </div>
        );
    }

    return (
        <div 
            className={`quote-container depth-${depth}`} 
            onClick={handleNavigate}
            style={{
                marginTop: 8,
                border: '1px solid var(--color-border)',
                borderRadius: 16,
                padding: depth > 0 ? '10px 12px' : '12px 16px', 
                cursor: 'pointer',
                backgroundColor: depth > 0 ? 'var(--color-input-bg)' : 'transparent', 
                transition: 'background-color 0.2s ease, border-color 0.2s ease',
                overflow: 'hidden'
            }}
        >
            <div className="quote-header" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 14 }}>
                <div className="avatar" style={{
                    width: 22, height: 22, fontSize: 11, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    background: 'var(--color-item-bg)', border: '1px solid var(--color-border)', borderRadius: '50%',
                    flexShrink: 0, overflow: 'hidden'
                }}>
                    {post.author?.avatar && post.author.avatar.length > 5 ? (
                        <img src={post.author.avatar} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    ) : (
                        post.author?.avatar || "👤"
                    )}
                </div>
                
                <span className="quote-author" style={{ fontWeight: 800, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {post.author?.displayName}
                </span>

                {}
                {hasBlue ? (
                    <VerifiedBadgeWithTooltip type="blue" size={14} />
                ) : hasGold ? (
                    <VerifiedBadgeWithTooltip type="gold" size={14} />
                ) : isGreenVerified ? (
                    <VerifiedBadgeWithTooltip type="green" size={14} />
                ) : null}

                {}
                <PinBadge pin={post.author?.pin || post.author?.activePin} size={14} />

                <span className="quote-handle" style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    @{post.author?.username}
                </span>
                
                <span className="post-dot" style={{ color: 'var(--color-text-secondary)', fontSize: 12, marginLeft: 'auto', marginRight: 4 }}>·</span>
                <TimeAgo dateStr={post.createdAt} />
            </div>
            
            {post.content && (
                <div className="post-text-content" style={{ marginBottom: (post.attachments?.length > 0 || post.originalPost) ? 8 : 0, fontSize: depth > 0 ? 14 : 15 }}>
                    <RichText 
                        text={post.content} 
                        spans={post.spans} 
                        onLinkClick={onLinkClick} 
                    />
                </div>
            )}
            
            {post.attachments && post.attachments.length > 0 && (
                <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: post.originalPost ? 8 : 0 }}>
                    <MediaGrid attachments={post.attachments.slice(0, 4)} />
                </div>
            )}

            {}
            {post.originalPost && (
                <QuotedPost 
                    post={post.originalPost} 
                    onLinkClick={onLinkClick} 
                    depth={depth + 1} 
                />
            )}
        </div>
    );
};

export default QuotedPost;