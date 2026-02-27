import React, { useMemo } from 'react';
import { renderTextWithSpans } from '../../utils/markdownUtils';
import MediaGrid from '../MediaGrid';
import MusicPlayer from '../MusicPlayer';
import QuotedPost from './QuotedPost';
import Poll from './Poll';

const PostContent = ({ post, musicData, onLinkClick }) => {

    const parsedContent = useMemo(() => {
        return renderTextWithSpans(post.content, post.spans || [], onLinkClick);
    }, [post.content, post.spans, onLinkClick]);

    if (musicData) {
        return (
            <div className="music-post-container" onClick={e => e.stopPropagation()} style={{marginTop: 8}}>
                <MusicPlayer {...musicData} />
            </div>
        );
    }

    return (
        <div>
            {post.content && <div className="post-text-content">{parsedContent}</div>}
            
            {post.originalPost && (
                <QuotedPost post={post.originalPost} onLinkClick={onLinkClick} />
            )}

            {post.poll && (
                <div style={{marginTop: 8}}>
                    <Poll poll={post.poll} postId={post.id} />
                </div>
            )}

            {post.attachments && post.attachments.length > 0 && (
                <div style={{ marginTop: 10 }}>
                    <MediaGrid attachments={post.attachments} />
                </div>
            )}
        </div>
    );
};

export default PostContent;