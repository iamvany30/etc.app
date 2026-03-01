/* @source src/components/CreatePost/Toolbar.jsx */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { 
    ImageIcon, MicIcon, PollIcon, MusicIcon,
    EmojiIcon 
} from '../icons/CommonIcons';
import { AddCircle, PaintRoller } from "@solar-icons/react";
import EmojiPicker from '../EmojiPicker';

const Toolbar = ({ 
    onFileSelect, onMusicSelect, onRecordStart, onPollToggle, 
    isPollActive, isSending, isUploading, attachmentsCount, onFormat, onDrawOpen, onEmojiSelect 
}) => {
    const fileInputRef = useRef(null);
    const musicInputRef = useRef(null);
    
    
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);
    
    
    const emojiTriggerRef = useRef(null);
    const emojiContainerRef = useRef(null);

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMore, setShowMore] = useState(false);
    
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const [emojiPos, setEmojiPos] = useState({ top: 0, left: 0 });

    
    
    
    const isMediaDisabled = isUploading || attachmentsCount >= 4;
    
    
    const isPollDisabled = isUploading;

    
    const isMusicDisabled = isUploading || attachmentsCount > 0 || isPollActive;
    
    
    const isRecordDisabled = isPollActive || attachmentsCount > 0;

    const updatePosition = useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setMenuPos({
                top: rect.bottom + 8,
                left: rect.left
            });
        }
    }, []);

    const updateEmojiPosition = useCallback(() => {
        if (emojiTriggerRef.current) {
            const rect = emojiTriggerRef.current.getBoundingClientRect();
            setEmojiPos({
                top: rect.bottom, 
                left: rect.left
            });
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                showMore && 
                dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                triggerRef.current && !triggerRef.current.contains(event.target)
            ) {
                setShowMore(false);
            }
            if (
                showEmojiPicker && 
                emojiContainerRef.current && !emojiContainerRef.current.contains(event.target) &&
                emojiTriggerRef.current && !emojiTriggerRef.current.contains(event.target)
            ) {
                setShowEmojiPicker(false);
            }
        };

        const handleScroll = () => {
            if (showMore) updatePosition();
            if (showEmojiPicker) updateEmojiPosition();
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
        window.addEventListener('resize', handleScroll);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, { capture: true });
            window.removeEventListener('resize', handleScroll);
        };
    }, [showMore, showEmojiPicker, updatePosition, updateEmojiPosition]);

    const handleToggleMore = (e) => {
        e.preventDefault();
        if (!showMore) {
            updatePosition();
            setShowMore(true);
        } else {
            setShowMore(false);
        }
    };

    const handleToggleEmoji = (e) => {
        e.preventDefault();
        if (!showEmojiPicker) {
            updateEmojiPosition();
            setShowEmojiPicker(true);
        } else {
            setShowEmojiPicker(false);
        }
    };

    return (
        <div className="create-post-tools-wrapper">
            <input type="file" ref={fileInputRef} onChange={onFileSelect} style={{display: 'none'}} accept="image/*,video/*" />
            <input type="file" ref={musicInputRef} onChange={onMusicSelect} style={{display: 'none'}} accept="audio/mpeg,audio/mp3" />
            
            <div className="tools-primary">
                <button className="tool-btn" onClick={() => fileInputRef.current.click()} disabled={isMediaDisabled} title="Фото/Видео">
                    <ImageIcon size={20} />
                </button>
                
                {/* КОНТЕЙНЕР КНОПКИ ЭМОДЗИ */}
                <div>
                    <button 
                        ref={emojiTriggerRef}
                        className={`tool-btn ${showEmojiPicker ? 'active' : ''}`} 
                        onClick={handleToggleEmoji} 
                        disabled={isSending} 
                        title="Эмодзи"
                    >
                        <EmojiIcon size={20} />
                    </button>

                    {showEmojiPicker && ReactDOM.createPortal(
                        <div 
                            ref={emojiContainerRef}
                            style={{
                                position: 'fixed',
                                top: emojiPos.top,
                                left: emojiPos.left,
                                zIndex: 99995 
                            }}
                        >
                            <EmojiPicker 
                                position="bottom-start"
                                onSelect={(emoji) => {
                                    if (onEmojiSelect) onEmojiSelect(emoji);
                                }} 
                                onClose={() => setShowEmojiPicker(false)} 
                            />
                        </div>,
                        document.body
                    )}
                </div>
                
                <button className={`tool-btn ${isPollActive ? 'active' : ''}`} onClick={onPollToggle} disabled={isPollDisabled} title="Опрос">
                    <PollIcon size={20} />
                </button>

                <button className="tool-btn" onClick={onRecordStart} disabled={isRecordDisabled} title="Голосовое">
                    <MicIcon size={20} />
                </button>
            </div>

            <div className="tools-more-container">
                <button 
                    ref={triggerRef}
                    className={`tool-btn more-trigger ${showMore ? 'active' : ''}`} 
                    onClick={handleToggleMore} 
                    title="Дополнительно"
                >
                    <AddCircle size={22} variant={showMore ? "Bold" : "Linear"} />
                </button>

                {showMore && ReactDOM.createPortal(
                    <div 
                        ref={dropdownRef}
                        className="tools-dropdown"
                        style={{ top: menuPos.top, left: menuPos.left }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="dropdown-section">
                            <span className="dropdown-label">Вложения</span>
                            <div className="dropdown-grid">
                                <button className="dropdown-item" onClick={() => { musicInputRef.current.click(); setShowMore(false); }} disabled={isMusicDisabled}>
                                    <div className="dd-icon music"><MusicIcon size={18} /></div>
                                    <span>Музыка</span>
                                </button>
                                <button className="dropdown-item" onClick={() => { onDrawOpen(); setShowMore(false); }} disabled={isMediaDisabled}>
                                    <div className="dd-icon draw"><PaintRoller size={18} /></div>
                                    <span>Скетч</span>
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
};

export default Toolbar;