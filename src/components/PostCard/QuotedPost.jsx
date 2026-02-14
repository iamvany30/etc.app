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
                <div className="avatar" style={{width: 18, height: 18, fontSize: 10}}>
                    {post.author?.avatar || "👤"}
                </div>
                <span className="quote-author">{post.author?.displayName}</span>
                <span className="quote-handle">@{post.author?.username}</span>
                <span className="post-handle">·</span>
                <TimeAgo dateStr={post.createdAt} />
            </div>
            <div className="quote-content">
                {parsedContent}
            </div>
            {post.attachments && post.attachments.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                    <MediaGrid attachments={post.attachments.slice(0, 1)} />
                </div>
            )}
        </div>
    );
};

export default QuotedPost;