import React from 'react';
import { useUser } from '../../context/UserContext';
import { useCreatePost } from './useCreatePost';
import Toolbar from './Toolbar';
import Attachments from './Attachments';
import VoiceRecorder from './VoiceRecorder';
import PollCreator from './PollCreator'; 
import MentionSuggestions from './MentionSuggestions';
import LinkPreviewCard from './LinkPreviewCard';
import '../../styles/CreatePost.css';

const CreatePost = ({ onPostCreated }) => {
    const { currentUser } = useUser();
    
    const {
        text, 
        setText, 
        attachments, 
        removeAttachment,
        isSending, 
        isUploading, 
        uploadProgress,
        isRecording, 
        setIsRecording,
        pollData, 
        togglePoll, 
        updatePoll,
        handleFileSelect, 
        handleMusicSelect, 
        handleVoiceSent,
        submitPost,
        insertMarkdown, 
        textareaRef,
        mentionQuery, 
        mentionResults, 
        isMentionLoading, 
        handleMentionSelect,
        linkPreview, 
        isFetchingPreview, 
        removeLinkPreview,
        
        isDragOver,
        dragEvents
    } = useCreatePost(onPostCreated);

    if (!currentUser) return null;

    const handleTextChange = (e) => {
        setText(e); 
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };
    
    const handleKeyDown = (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key.toLowerCase()) {
                case 'b': e.preventDefault(); insertMarkdown('bold'); break;
                case 'i': e.preventDefault(); insertMarkdown('italic'); break;
                case 'u': e.preventDefault(); insertMarkdown('underline'); break;
                default: break;
            }
        }
    };

    const canSubmit = !isFetchingPreview && (
        text.trim().length > 0 || 
        attachments.length > 0 || 
        (pollData && pollData.question?.trim() && pollData.options.filter(o => o.trim()).length >= 2)
    );

    return (
        <div className="create-post-card" {...dragEvents}>
            
            
            {isDragOver && (
                <div className="drag-overlay">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <h3>Отпустите файлы здесь</h3>
                </div>
            )}

            <div className="create-post-inner">
                <div className="avatar" style={{ width: 40, height: 40, fontSize: 20 }}>
                    {currentUser.avatar}
                </div>
                
                <div className="create-post-content">
                    <div style={{ position: 'relative', width: '100%' }}>
                        
                        <MentionSuggestions 
                            users={mentionResults}
                            onSelect={handleMentionSelect}
                            isLoading={isMentionLoading}
                        />

                        {!isRecording ? (
                            <>
                                <textarea 
                                    ref={textareaRef}
                                    className="create-post-textarea" 
                                    placeholder={pollData ? "Добавьте комментарий к опросу..." : "Что происходит?!"}
                                    rows={1} 
                                    value={text} 
                                    onChange={handleTextChange}
                                    onKeyDown={handleKeyDown} 
                                />
                                
                                {pollData && (
                                    <PollCreator 
                                        pollData={pollData}
                                        onChange={updatePoll}
                                        onRemove={togglePoll}
                                    />
                                )}

                                <Attachments 
                                    attachments={attachments} 
                                    onRemove={removeAttachment} 
                                    isUploading={isUploading} 
                                    progress={uploadProgress} 
                                />

                                {linkPreview && (
                                    <LinkPreviewCard 
                                        data={linkPreview} 
                                        onRemove={removeLinkPreview} 
                                    />
                                )}

                                {isFetchingPreview && (
                                    <div className="preview-loading">
                                        Получение данных ссылки...
                                    </div>
                                )}
                            </>
                        ) : (
                            <VoiceRecorder 
                                onRecordComplete={handleVoiceSent} 
                                onCancel={() => setIsRecording(false)} 
                            />
                        )}
                    </div>
                </div>
            </div>

            {!isRecording && (
                <Toolbar 
                    onFileSelect={handleFileSelect}
                    onMusicSelect={handleMusicSelect}
                    onRecordStart={() => setIsRecording(true)}
                    onPollToggle={togglePoll}
                    isPollActive={!!pollData}
                    onSubmit={() => submitPost()}
                    canSubmit={canSubmit}
                    isSending={isSending}
                    isUploading={isUploading}
                    attachmentsCount={attachments.length}
                    onFormat={insertMarkdown}
                />
            )}
        </div>
    );
};

export default CreatePost;