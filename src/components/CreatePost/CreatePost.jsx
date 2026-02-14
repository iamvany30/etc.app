import React from 'react';
import { useUser } from '../../context/UserContext';
import { useCreatePost } from './useCreatePost';
import Toolbar from './Toolbar';
import Attachments from './Attachments';
import VoiceRecorder from './VoiceRecorder';
import '../../styles/CreatePost.css';

const CreatePost = ({ onPostCreated }) => {
    const { currentUser } = useUser();
    
    // Используем наш новый хук
    const {
        text, setText,
        attachments, removeAttachment,
        isSending, isUploading, uploadProgress,
        isRecording, setIsRecording,
        handleFileSelect, handleMusicSelect, handleVoiceSent,
        submitPost
    } = useCreatePost(onPostCreated);

    if (!currentUser) return null;

    // Авто-высота textarea
    const handleTextChange = (e) => {
        setText(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };

    return (
        <div className="create-post-card">
            <div className="create-post-inner">
                <div className="avatar" style={{width: 40, height: 40, fontSize: 20}}>
                    {currentUser.avatar}
                </div>
                
                <div className="create-post-content">
                    {!isRecording ? (
                        <>
                            <textarea 
                                className="create-post-textarea" 
                                placeholder="Что происходит?!" 
                                rows={1} 
                                value={text} 
                                onChange={handleTextChange} 
                            />
                            
                            <Attachments 
                                attachments={attachments} 
                                onRemove={removeAttachment} 
                                isUploading={isUploading} 
                                progress={uploadProgress} 
                            />
                        </>
                    ) : (
                        <VoiceRecorder 
                            onRecordComplete={handleVoiceSent} 
                            onCancel={() => setIsRecording(false)} 
                        />
                    )}
                </div>
            </div>

            {!isRecording && (
                <Toolbar 
                    onFileSelect={handleFileSelect}
                    onMusicSelect={handleMusicSelect}
                    onRecordStart={() => setIsRecording(true)}
                    onSubmit={() => submitPost()}
                    canSubmit={text.trim().length > 0 || attachments.length > 0}
                    isSending={isSending}
                    isUploading={isUploading}
                    attachmentsCount={attachments.length}
                />
            )}
        </div>
    );
};

export default CreatePost;