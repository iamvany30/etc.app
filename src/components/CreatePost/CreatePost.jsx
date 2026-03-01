/* @source src/components/CreatePost/CreatePost.jsx */
import React, { useCallback } from 'react';
import { useUserStore } from '../../store/userStore';
import { useCreatePost, MAX_POST_LENGTH } from './useCreatePost';
import { useDiscordStore } from '../../store/discordStore'; 

import Toolbar from './Toolbar';
import Attachments from './Attachments';
import VoiceRecorder from './VoiceRecorder';
import PollCreator from './PollCreator'; 
import MentionSuggestions from './MentionSuggestions';
import LinkPreviewCard from './LinkPreviewCard';
import FloatingTextFormat from './FloatingTextFormat';
import RichEditor from './RichEditor'; 
import '../../styles/CreatePost.css';


const CircularProgress = ({ value, max, size = 26, stroke = 2.5 }) => {
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
        <div className={`char-counter ${isOver ? 'limit-exceeded' : ''}`} title={`${value} / ${max} символов`}>
            {isClose && <span className="char-count-text">{max - value}</span>}
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
                <circle 
                    cx={size/2} cy={size/2} r={radius} 
                    fill="none" 
                    stroke="var(--color-border)" 
                    strokeWidth={stroke} 
                    style={{ opacity: 0.3 }} 
                />
                <circle 
                    cx={size/2} cy={size/2} r={radius} 
                    fill="none" 
                    stroke={color} 
                    strokeWidth={stroke}
                    strokeDasharray={circumference}
                    strokeDashoffset={dashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }}
                />
            </svg>
        </div>
    );
};

const CreatePost = ({ onPostCreated, wallId = null, placeholder }) => {
    const currentUser = useUserStore(state => state.currentUser);
    
    
    const setDiscordActivity = useDiscordStore(state => state.setActivity);
    const clearDiscordActivity = useDiscordStore(state => state.clearActivity);

    
    const {
        text, spans, setTextAndSpans, attachments, removeAttachment,
        isSending, isUploading, uploadStatus, openDrawingModal,
        isRecording, setIsRecording,
        pollData, togglePoll, updatePoll,
        handleFileSelect, processFiles, handleVoiceSent,
        submitPost, insertMarkdown, insertEmoji, textareaRef,
        mentionResults, isMentionLoading, handleMentionSelect,
        linkPreview, isFetchingPreview, removeLinkPreview,
        isDragOver, dragEvents
    } = useCreatePost(onPostCreated, wallId);

    
    const handleFocus = useCallback(() => setDiscordActivity('typing'), [setDiscordActivity]);
    const handleBlur = useCallback(() => clearDiscordActivity(), [clearDiscordActivity]);

    
    const handleContainerClick = (e) => {
        if (e.target.closest('.input-block') && !e.target.closest('button') && !e.target.closest('input')) {
            textareaRef.current?.focus();
        }
    };

    if (!currentUser) return null;

    const charsLeft = MAX_POST_LENGTH - text.length;
    const isOverLimit = charsLeft < 0;

    
    const canSubmit = !isFetchingPreview && !isOverLimit && (
        text.trim().length > 0 || 
        attachments.length > 0 || 
        (pollData && pollData.question?.trim())
    );

    return (
        <div 
            className={`create-post-card ${isDragOver ? 'drag-active' : ''}`} 
            {...dragEvents}
            onClick={handleContainerClick}
        >
            {}
            <FloatingTextFormat textareaRef={textareaRef} onFormat={insertMarkdown} />

            {}
            {isDragOver && (
                <div className="drag-overlay">
                    <div className="drag-content">
                        <div className="drag-icon-circle">
                            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="17 8 12 3 7 8"/>
                                <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                        </div>
                        <h3>Отпустите файлы здесь</h3>
                        <p style={{ margin: '8px 0 0', fontSize: '13px', opacity: 0.8, fontWeight: 500 }}>
                            До 4 медиафайлов (Изображения, GIF, Видео)
                        </p>
                    </div>
                </div>
            )}

            <div className="create-post-inner">
                {}
                <div className="create-post-avatar">
                    <div className="avatar" style={{ width: 44, height: 44, fontSize: 20 }}>
                        {currentUser.avatar && currentUser.avatar.length > 5 
                            ? <img src={currentUser.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> 
                            : (currentUser.avatar || "👤")
                        }
                    </div>
                </div>
                
                {}
                <div className="create-post-right-col" onFocusCapture={handleFocus} onBlurCapture={handleBlur}>
                    <div className="input-block">
                        <MentionSuggestions users={mentionResults} onSelect={handleMentionSelect} isLoading={isMentionLoading} />
                        
                        {!isRecording ? (
                            <>
                                <RichEditor
                                    ref={textareaRef}
                                    value={text}
                                    spans={spans}
                                    onChange={setTextAndSpans}
                                    placeholder={placeholder || "Что нового?"}
                                    onImagePaste={processFiles}
                                    onSubmit={() => {
                                        if (canSubmit && !isSending && !isUploading) submitPost();
                                    }}
                                />
                                
                                {linkPreview && <LinkPreviewCard data={linkPreview} onRemove={removeLinkPreview} />}
                                
                                <Attachments attachments={attachments} onRemove={removeAttachment} isUploading={isUploading} uploadStatus={uploadStatus} />
                                
                                {pollData && <PollCreator pollData={pollData} onChange={updatePoll} onRemove={togglePoll} />}
                            </>
                        ) : (
                            <VoiceRecorder onRecordComplete={handleVoiceSent} onCancel={() => setIsRecording(false)} />
                        )}
                    </div>

                    {!isRecording && (
                        <div className="create-post-footer">
                            <Toolbar 
                                onFileSelect={handleFileSelect}
                                onRecordStart={() => setIsRecording(true)}
                                onPollToggle={togglePoll}
                                onDrawOpen={openDrawingModal}
                                isPollActive={!!pollData}
                                isSending={isSending}
                                isUploading={isUploading}
                                attachmentsCount={attachments.length}
                                onFormat={insertMarkdown}
                                onEmojiSelect={insertEmoji}
                            />
                            
                            <div className="create-post-actions">
                                {text.length > 0 && (
                                    <div className="counter-wrapper">
                                        <CircularProgress value={text.length} max={MAX_POST_LENGTH} />
                                    </div>
                                )}
                                
                                <button 
                                    className="create-post-submit-btn" 
                                    onClick={() => submitPost()} 
                                    disabled={!canSubmit || isSending || isUploading}
                                >
                                    {isSending ? (
                                        <div className="spinner-dots" />
                                    ) : isUploading ? (
                                        'Загрузка...'
                                    ) : (
                                        'Опубликовать'
                                    )}
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