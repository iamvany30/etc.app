/* @source src/components/CreatePost/Toolbar.jsx */
import React, { useRef, useState } from 'react';
import { 
    ImageIcon, MicIcon, PollIcon, MusicIcon,
    BoldIcon, ItalicIcon, CodeIcon, SpoilerIcon, EmojiIcon 
} from '../icons/CommonIcons';
import { AddCircle } from "@solar-icons/react";
import EmojiPicker from '../EmojiPicker';

const Toolbar = ({ 
    onFileSelect, onMusicSelect, onRecordStart, onPollToggle, 
    isPollActive, isSending, isUploading, attachmentsCount, onFormat, onDrawOpen, onEmojiSelect 
}) => {
    const fileInputRef = useRef(null);
    const musicInputRef = useRef(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMore, setShowMore] = useState(false);

    const isMediaDisabled = isUploading || attachmentsCount >= 4 || isPollActive;
    const isMusicDisabled = isUploading || attachmentsCount > 0 || isPollActive;
    const isPollDisabled = isUploading || attachmentsCount > 0;

    return (
        <div className="create-post-tools-wrapper">
            <input type="file" ref={fileInputRef} onChange={onFileSelect} style={{display: 'none'}} accept="image/*,video/*" />
            <input type="file" ref={musicInputRef} onChange={onMusicSelect} style={{display: 'none'}} accept="audio/mpeg,audio/mp3" />
            
            {}
            <div className="create-post-tools primary-tools">
                <button className="tool-btn" onClick={() => fileInputRef.current.click()} disabled={isMediaDisabled} title="Медиа">
                    <ImageIcon size={22} />
                </button>
                
                <div style={{ position: 'relative' }}>
                    <button 
                        className={`tool-btn ${showEmojiPicker ? 'active' : ''}`} 
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                        disabled={isSending} 
                        title="Эмодзи"
                    >
                        <EmojiIcon size={22} />
                    </button>

                    {showEmojiPicker && (
                        <EmojiPicker 
                            position="bottom"
                            onSelect={(emoji) => {
                                if (onEmojiSelect) onEmojiSelect(emoji);
                            }} 
                            onClose={() => setShowEmojiPicker(false)} 
                        />
                    )}
                </div>
                
                <button className={`tool-btn ${isPollActive ? 'active' : ''}`} onClick={onPollToggle} disabled={isPollDisabled} title="Опрос">
                    <PollIcon size={22} />
                </button>

                <button className="tool-btn" onClick={onRecordStart} disabled={isPollActive || attachmentsCount > 0} title="Голосовое сообщение">
                    <MicIcon size={22} />
                </button>
                
                <div className="tool-divider" />
                
                <button className={`tool-btn more-btn ${showMore ? 'active' : ''}`} onClick={() => setShowMore(!showMore)} title="Дополнительно">
                    <AddCircle size={22} variant={showMore ? "Bold" : "Linear"} />
                </button>
            </div>

            {}
            <div className={`create-post-tools secondary-tools ${showMore ? 'expanded' : ''}`}>
                <button className="tool-btn" onClick={() => musicInputRef.current.click()} disabled={isMusicDisabled} title="Прикрепить музыку">
                    <MusicIcon size={20} />
                </button>
                
                <button className="tool-btn" onClick={onDrawOpen} title="Нарисовать скетч">
                    <CodeIcon size={20} />
                </button>

                <div className="tool-divider" />

                <button className="tool-btn" onClick={() => onFormat('bold')} title="Жирный текст" disabled={isSending}>
                    <BoldIcon size={20} />
                </button>
                
                <button className="tool-btn" onClick={() => onFormat('italic')} title="Курсив" disabled={isSending}>
                    <ItalicIcon size={20} />
                </button>

                <button className="tool-btn" onClick={() => onFormat('spoiler')} title="Скрыть под спойлер" disabled={isSending}>
                    <SpoilerIcon size={20} />
                </button>
            </div>
        </div>
    );
};

export default Toolbar;