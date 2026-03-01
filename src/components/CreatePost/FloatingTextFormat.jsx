/* @source src/components/CreatePost/FloatingTextFormat.jsx */
import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { TextBold, TextItalic, Code, EyeClosed, LinkCircle } from '@solar-icons/react';
import { TextUnderline, TextStrikethrough } from '@phosphor-icons/react';
import '../../styles/FloatingTextFormat.css';

const FloatingTextFormat = ({ textareaRef, onFormat }) => {
    const [pos, setPos] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    
    const [isLinkMode, setIsLinkMode] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [savedRange, setSavedRange] = useState(null);

    const updatePosition = useCallback(() => {
        if (isLinkMode) return;

        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
            setIsVisible(false);
            return;
        }

        const editorNode = textareaRef.current?.getElement?.() || null;

        if (editorNode && editorNode.contains(selection.anchorNode)) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            if (rect.width > 0 && rect.height > 0) {
                setPos({ x: rect.left + (rect.width / 2), y: rect.top });
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        } else {
            setIsVisible(false);
        }
    }, [textareaRef, isLinkMode]);

    useEffect(() => {
        document.addEventListener('selectionchange', updatePosition);
        window.addEventListener('scroll', updatePosition, { capture: true });
        window.addEventListener('resize', updatePosition);

        const el = textareaRef.current?.getElement?.() || null;
        if (el) el.addEventListener('scroll', updatePosition);

        return () => {
            document.removeEventListener('selectionchange', updatePosition);
            window.removeEventListener('scroll', updatePosition, { capture: true });
            window.removeEventListener('resize', updatePosition);
            if (el) el.removeEventListener('scroll', updatePosition);
        };
    }, [updatePosition, textareaRef]);

    const handleFormatClick = (type) => {
        onFormat(type);
        setIsVisible(false);
    };

    const openLinkMode = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            setSavedRange(selection.getRangeAt(0).cloneRange());
        }
        setIsLinkMode(true);
    };

    const submitLink = (e) => {
        e.preventDefault();
        
        if (savedRange) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(savedRange);
        }

        if (linkUrl.trim()) {
            let finalUrl = linkUrl.trim();
            if (!/^https?:\/\//i.test(finalUrl)) finalUrl = 'https://' + finalUrl;
            
            onFormat('link', finalUrl);
        }
        
        setIsLinkMode(false);
        setLinkUrl('');
        setIsVisible(false);
    };

    if (!isVisible || !pos) return null;

    return ReactDOM.createPortal(
        <div 
            className="floating-text-toolbar"
            style={{ left: pos.x, top: pos.y }}
            onMouseDown={(e) => {
                if (!isLinkMode) e.preventDefault();
            }}
        >
            {isLinkMode ? (
                <form onSubmit={submitLink} className="float-link-form">
                    <input 
                        type="text"
                        autoFocus
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://..."
                    />
                    <button type="submit" disabled={!linkUrl.trim()}>OK</button>
                    <button type="button" className="cancel-btn" onClick={() => setIsLinkMode(false)}>✕</button>
                </form>
            ) : (
                <>
                    <button onClick={() => handleFormatClick('bold')} title="Жирный (Ctrl+B)"><TextBold size={18} /></button>
                    <button onClick={() => handleFormatClick('italic')} title="Курсив (Ctrl+I)"><TextItalic size={18} /></button>
                    <button onClick={() => handleFormatClick('underline')} title="Подчёркнутый (Ctrl+U)"><TextUnderline size={18} /></button>
                    <button onClick={() => handleFormatClick('strike')} title="Зачёркнутый"><TextStrikethrough size={18} /></button>
                    
                    <div className="float-divider" />
                    
                    {}
                    <button onClick={() => handleFormatClick('code')} title="Код"><Code size={18} /></button>
                    <button onClick={() => handleFormatClick('spoiler')} title="Спойлер"><EyeClosed size={18} /></button>
                    <button onClick={openLinkMode} title="Ссылка"><LinkCircle size={18} /></button>
                </>
            )}
        </div>,
        document.body
    );
};

export default FloatingTextFormat;