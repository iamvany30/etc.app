import React, { useRef } from 'react';


const ImageIcon = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0z"></path></svg>);
const MusicIcon = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>);
const MicIcon = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"></path></svg>);
const PollIcon = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 9h12v2H6V9zm8 5H6v-2h8v2zm-8-6h12V6H6v2zM3.5 5.5c0-1.1.9-2 2-2h13c1.1 0 2 .9 2 2v13c0 1.1-.9 2-2 2h-13c-1.1 0-2-.9-2-2v-13z"></path></svg>);


const BoldIcon = () => <span style={{ fontWeight: 800, fontSize: '15px' }}>B</span>;
const ItalicIcon = () => <span style={{ fontStyle: 'italic', fontSize: '15px', fontFamily: 'serif' }}>I</span>;
const CodeIcon = () => <span style={{ fontSize: '13px', fontFamily: 'monospace' }}>&lt;/&gt;</span>;
const SpoilerIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
        <line x1="3" y1="21" x2="21" y2="3"></line>
    </svg>
);

const Toolbar = ({ 
    onFileSelect, 
    onMusicSelect, 
    onRecordStart, 
    onPollToggle, 
    isPollActive,
    onSubmit, 
    canSubmit, 
    isSending, 
    isUploading, 
    attachmentsCount,
    onFormat 
}) => {
    const fileInputRef = useRef(null);
    const musicInputRef = useRef(null);

    
    
    
    
    
    
    const isMediaDisabled = isUploading || attachmentsCount >= 4 || isPollActive;

    
    
    
    
    const isMusicDisabled = isUploading || attachmentsCount > 0 || isPollActive;

    
    
    
    const isPollDisabled = isUploading || attachmentsCount > 0;

    return (
        <div className="create-post-footer">
            <div className="create-post-tools">
                <input type="file" ref={fileInputRef} onChange={onFileSelect} style={{display: 'none'}} accept="image/*,video/*" />
                <input type="file" ref={musicInputRef} onChange={onMusicSelect} style={{display: 'none'}} accept="audio/mpeg,audio/mp3" />
                
                <button className="tool-btn" onClick={() => fileInputRef.current.click()} disabled={isMediaDisabled} title="Прикрепить медиа">
                    <ImageIcon />
                </button>
                
                <button className="tool-btn" onClick={() => musicInputRef.current.click()} disabled={isMusicDisabled} title="Музыка">
                    <MusicIcon />
                </button>

                <button className={`tool-btn ${isPollActive ? 'active' : ''}`} onClick={onPollToggle} disabled={isPollDisabled} title="Опрос">
                    <PollIcon />
                </button>

                <div style={{ width: '1px', height: '24px', background: 'var(--color-border)', margin: '0 4px' }} />

                
                <button className="tool-btn" onClick={() => onFormat('bold')} title="Жирный" disabled={isSending}>
                    <BoldIcon />
                </button>
                
                <button className="tool-btn" onClick={() => onFormat('italic')} title="Курсив" disabled={isSending}>
                    <ItalicIcon />
                </button>

                <button className="tool-btn" onClick={() => onFormat('code')} title="Код" disabled={isSending}>
                    <CodeIcon />
                </button>

                <button className="tool-btn" onClick={() => onFormat('spoiler')} title="Спойлер" disabled={isSending}>
                    <SpoilerIcon />
                </button>
            </div>

            <div className="create-post-actions">
                {canSubmit ? (
                    <button className="create-post-submit-btn" onClick={onSubmit} disabled={isSending || isUploading}>
                        {isSending ? '...' : 'Опубликовать'}
                    </button>
                ) : (
                    <button className="tool-btn-accent" onClick={onRecordStart} title="Записать голосовое" disabled={isPollActive || attachmentsCount > 0 || isUploading}>
                        <MicIcon />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Toolbar;