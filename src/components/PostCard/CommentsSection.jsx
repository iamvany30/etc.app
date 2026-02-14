import React from 'react';
import CreateComment from '../CreateComment';
import Comment from '../Comment';

const CommentsSection = ({ ctrl, highlightCommentId }) => {
    return (
        <div className="comments-section" onClick={e => e.stopPropagation()}>
            <CreateComment 
                postId={ctrl.localPost.id} 
                onCommentCreated={(newC) => { 
                    ctrl.setComments(p => [newC, ...p]); 
                    ctrl.setCommentsCount(p => p + 1); 
                }} 
                replyTo={ctrl.replyTo}
                onCancelReply={() => ctrl.setReplyTo(null)}
            />
            
            <div className="comments-list">
                {ctrl.comments.map(c => (
                    <Comment 
                        key={c.id} 
                        comment={c} 
                        postId={ctrl.localPost.id} 
                        highlightCommentId={highlightCommentId} 
                        onReply={(commentObj) => ctrl.setReplyTo(commentObj)} 
                    />
                ))}
            </div>
            
            {ctrl.hasMoreComments && (
                <button className="show-more-comments-btn" onClick={() => ctrl.loadComments(true)}>
                    {ctrl.loadingComments ? '...' : 'Показать ещё'}
                </button>
            )}
        </div>
    );
};

export default CommentsSection;