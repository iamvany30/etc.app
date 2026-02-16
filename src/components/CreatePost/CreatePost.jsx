/* @source src/components/CreatePost/CreatePost.jsx */
import React from 'react';
import { useUser } from '../../context/UserContext';
import { useCreatePost, MAX_POST_LENGTH } from './useCreatePost';
import Toolbar from './Toolbar';
import Attachments from './Attachments';
import VoiceRecorder from './VoiceRecorder';
import PollCreator from './PollCreator'; 
import MentionSuggestions from './MentionSuggestions';
import LinkPreviewCard from './LinkPreviewCard';
import '../../styles/CreatePost.css';


const CircularProgress = ({ value, max, size = 20, stroke = 2 }) => {
    const radius = (size - stroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = Math.min(value, max);
    const dashoffset = circumference - (progress / max) * circumference;
    const isClose = max - value <= 20;
    const isOver = value > max;
    
    let color = "var(--color-primary)";
    if (isOver) color = "#f4212e";
    else if (isClose) color = "#ffad1f";

    return (
        <div className={`char-counter ${isOver ? 'limit-exceeded' : ''}`}>
            {isClose && <span style={{marginRight: 6, fontSize: 11}}>{max - value}</span>}
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform: 'rotate(-90deg)'}}>
                <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
                <circle 
                    cx={size/2} cy={size/2} r={radius} 
                    fill="none" 
                    stroke={color} 
                    strokeWidth={stroke}
                    strokeDasharray={circumference}
                    strokeDashoffset={dashoffset}
                    strokeLinecap="round"
                />
            </svg>
        </div>
    );
};

const CreatePost = ({ onPostCreated }) => {
    const { currentUser } = useUser();
    const {
        text, setText, attachments, removeAttachment,
        isSending, isUploading, uploadStatus, openDrawingModal,
        isRecording, setIsRecording,
        pollData, togglePoll, updatePoll,
        handleFileSelect, handleMusicSelect, handleVoiceSent,
        submitPost, insertMarkdown, textareaRef,
        mentionResults, isMentionLoading, handleMentionSelect,
        linkPreview, isFetchingPreview, removeLinkPreview,
        isDragOver, dragEvents,
        handlePaste 
    } = useCreatePost(onPostCreated);

    if (!currentUser) return null;

    const charsLeft = MAX_POST_LENGTH - text.length;
    const isOverLimit = charsLeft < 0;

    const handleTextChange = (e) => {
        setText(e); 
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };

    const canSubmit = !isFetchingPreview && !isOverLimit && (
        text.trim().length > 0 || 
        attachments.length > 0 || 
        (pollData && pollData.question?.trim())
    );

    return (
        <div className="create-post-card" {...dragEvents}>
            {isDragOver && (
                <div className="drag-overlay">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <h3>Отпустите файлы здесь</h3>
                </div>
            )}

            <div className="create-post-inner">
                {}
                <div className="create-post-avatar">
                    <div className="avatar" style={{ width: 40, height: 40, fontSize: 18 }}>
                        {currentUser.avatar}
                    </div>
                </div>

                {}
                <div className="create-post-right-col">
                    <div style={{ position: 'relative', width: '100%' }}>
                        
                        {}
                        <MentionSuggestions users={mentionResults} onSelect={handleMentionSelect} isLoading={isMentionLoading} />

                        {}
                        {!isRecording ? (
                            <>
                                <textarea 
                                    ref={textareaRef}
                                    className="create-post-textarea" 
                                    placeholder="Что происходит?!"
                                    rows={1} 
                                    value={text} 
                                    onChange={handleTextChange}
                                    onPaste={handlePaste} 
                                />
                                
                                {}
                                {linkPreview && <LinkPreviewCard data={linkPreview} onRemove={removeLinkPreview} />}
                                <Attachments attachments={attachments} onRemove={removeAttachment} isUploading={isUploading} uploadStatus={uploadStatus} />
                                {pollData && <PollCreator pollData={pollData} onChange={updatePoll} onRemove={togglePoll} />}
                            </>
                        ) : (
                            <VoiceRecorder onRecordComplete={handleVoiceSent} onCancel={() => setIsRecording(false)} />
                        )}
                    </div>

                    {}
                    {!isRecording && (
                        <div className="create-post-footer">
                            <Toolbar 
                                onFileSelect={handleFileSelect}
                                onMusicSelect={handleMusicSelect}
                                onRecordStart={() => setIsRecording(true)}
                                onPollToggle={togglePoll}
                                onDrawOpen={openDrawingModal}
                                isPollActive={!!pollData}
                                isSending={isSending}
                                isUploading={isUploading}
                                attachmentsCount={attachments.length}
                                onFormat={insertMarkdown}
                            />
                            
                            <div className="create-post-actions">
                                {}
                                {text.length > 0 && (
                                    <CircularProgress value={text.length} max={MAX_POST_LENGTH} />
                                )}
                                
                                <button 
                                    className="create-post-submit-btn" 
                                    onClick={() => submitPost()} 
                                    disabled={!canSubmit || isSending || isUploading}
                                >
                                    {isSending ? '...' : 'Опубликовать'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreatePost;