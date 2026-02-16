
import React, { useRef } from 'react';
import { 
    ImageIcon, MicIcon, PollIcon, MusicIcon,
    BoldIcon, ItalicIcon, CodeIcon, SpoilerIcon
} from '../icons/CommonIcons';

const Toolbar = ({ 
    onFileSelect, onMusicSelect, onRecordStart, onPollToggle, 
    isPollActive, isSending, isUploading, attachmentsCount, onFormat, onDrawOpen
}) => {
    const fileInputRef = useRef(null);
    const musicInputRef = useRef(null);

    const isMediaDisabled = isUploading || attachmentsCount >= 4 || isPollActive;
    const isMusicDisabled = isUploading || attachmentsCount > 0 || isPollActive;
    const isPollDisabled = isUploading || attachmentsCount > 0;

    return (
        <div className="create-post-tools">
            <input type="file" ref={fileInputRef} onChange={onFileSelect} style={{display: 'none'}} accept="image/*,video/*" />
            <input type="file" ref={musicInputRef} onChange={onMusicSelect} style={{display: 'none'}} accept="audio/mpeg,audio/mp3" />
            
            <button className="tool-btn" onClick={() => fileInputRef.current.click()} disabled={isMediaDisabled} title="Медиа">
                <ImageIcon />
            </button>
            
            <button className={`tool-btn ${isPollActive ? 'active' : ''}`} onClick={onPollToggle} disabled={isPollDisabled} title="Опрос">
                <PollIcon />
            </button>

            <button className="tool-btn" onClick={onRecordStart} disabled={isPollActive || attachmentsCount > 0} title="Голосовое">
                <MicIcon />
            </button>

            <button className="tool-btn" onClick={() => musicInputRef.current.click()} disabled={isMusicDisabled} title="Музыка">
                <MusicIcon />
            </button>
            

            <button className="tool-btn" onClick={onDrawOpen} title="Нарисовать">
                <CodeIcon />
            </button>

            {}
            <div className="tool-divider" />

            {}
            <button className="tool-btn" onClick={() => onFormat('bold')} title="Жирный" disabled={isSending}>
                <BoldIcon size={18} />
            </button>
            
            <button className="tool-btn" onClick={() => onFormat('italic')} title="Курсив" disabled={isSending}>
                <ItalicIcon size={18} />
            </button>

            <button className="tool-btn" onClick={() => onFormat('spoiler')} title="Спойлер" disabled={isSending}>
                <SpoilerIcon size={18} />
            </button>
        </div>
    );
};

export default Toolbar;