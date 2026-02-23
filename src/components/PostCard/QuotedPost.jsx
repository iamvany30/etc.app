/* @source src/components/PostCard/QuotedPost.jsx */
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TimeAgo from './TimeAgo';
import MediaGrid from '../MediaGrid';
import { renderTextWithSpans } from '../../utils/markdownUtils';

const QuotedPost = ({ post, onLinkClick }) => {
    const navigate = useNavigate();
    const parsedContent = useMemo(() => {
        return renderTextWithSpans(post.content, post.spans || [], onLinkClick);
    }, [post.content, post.spans, onLinkClick]);

    if (!post) return null;

    return (
        <div className="quote-container" onClick={(e) => {
            e.stopPropagation();
            navigate(`/post/${post.id}`);
        }}>
            <div className="quote-header">
                <div className="avatar" style={{
                    width: 24, height: 24, fontSize: 12, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '50%'
                }}>
                    {post.author?.avatar || "👤"}
                </div>
                <span className="quote-author">{post.author?.displayName}</span>
                <span className="quote-handle">@{post.author?.username}</span>
                <span className="post-dot">·</span>
                <TimeAgo dateStr={post.createdAt} />
            </div>
            
            {post.content && <div className="post-text-content" style={{marginBottom: 8}}>{parsedContent}</div>}
            
            {post.attachments && post.attachments.length > 0 && (
                <div style={{ marginTop: 8, borderRadius: 16, overflow: 'hidden' }}>
                    <MediaGrid attachments={post.attachments.slice(0, 4)} />
                </div>
            )}
        </div>
    );
};

export default QuotedPost;