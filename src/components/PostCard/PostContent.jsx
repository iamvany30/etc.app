import React, { useMemo } from 'react';
import { renderTextWithSpans } from '../../utils/markdownUtils';
import MediaGrid from '../MediaGrid';
import MusicPlayer from '../MusicPlayer';
import QuotedPost from './QuotedPost';

const PostContent = ({ 
    post, 
    isEditing, 
    editContent, 
    setEditContent, 
    handleEditSave, 
    setIsEditing,
    musicData, 
    onLinkClick,
    textareaRef 
}) => {

    const parsedContent = useMemo(() => {
        return renderTextWithSpans(post.content, post.spans || [], onLinkClick);
    }, [post.content, post.spans, onLinkClick]);

    
    if (isEditing) {
        return (
            <div className="post-main-content">
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
                        rows={1} 
                    />
                    <div className="edit-actions">
                        <button className="cancel-btn" onClick={() => setIsEditing(false)}>Отмена</button>
                        <button className="save-btn" onClick={handleEditSave}>Сохранить</button>
                    </div>
                </div>
            </div>
        );
    }

    const isMusicPost = !!musicData;

    return (
        <div className="post-main-content">
            
            {isMusicPost ? (
                <div className="music-post-container" onClick={e => e.stopPropagation()}>
                    <MusicPlayer 
                        id={musicData.id}
                        src={musicData.src}
                        artist={musicData.artist}
                        title={musicData.title}
                        cover={musicData.cover}
                    />
                </div>
            ) : (
                <div>
                    
                    {post.content && <div className="post-content">{parsedContent}</div>}
                    
                    
                    {post.originalPost && (
                        <QuotedPost post={post.originalPost} onLinkClick={onLinkClick} />
                    )}

                    
                    {post.poll && (
                        <div className="post-poll">
                            <div className="poll-question">{post.poll.question}</div>
                            
                        </div>
                    )}

                    
                    {post.attachments && post.attachments.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                            <MediaGrid attachments={post.attachments} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PostContent;