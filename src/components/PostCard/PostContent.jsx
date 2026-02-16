import React, { useMemo } from 'react';
import { renderTextWithSpans } from '../../utils/markdownUtils';
import MediaGrid from '../MediaGrid';
import MusicPlayer from '../MusicPlayer';
import QuotedPost from './QuotedPost';
import Poll from './Poll';

const PostContent = ({ 
    post, isEditing, editContent, setEditContent, 
    handleEditSave, setIsEditing, musicData, onLinkClick, textareaRef 
}) => {

    const parsedContent = useMemo(() => {
        return renderTextWithSpans(post.content, post.spans || [], onLinkClick);
    }, [post.content, post.spans, onLinkClick]);

    if (isEditing) {
        return (
            <div className="edit-mode-wrapper" onClick={e => e.stopPropagation()}>
                <textarea 
                    ref={textareaRef} 
                    className="edit-post-textarea" 
                    value={editContent} 
                    onChange={e => { 
                        setEditContent(e.target.value); 
                        e.target.style.height = 'auto'; 
                        e.target.style.height = e.target.scrollHeight + 'px'; 
                    }} 
                    rows={2}
                />
                <div className="edit-actions">
                    <button className="cancel-btn" onClick={() => setIsEditing(false)}>Отмена</button>
                    <button className="save-btn" onClick={handleEditSave}>Сохранить</button>
                </div>
            </div>
        );
    }

    
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