/* @source src/components/CreatePost/RichEditor.jsx */
import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { extractTextAndSpansFromDOM, textAndSpansToHtml, FORMAT_CLASSES } from '../../utils/richTextUtils';

const RichEditor = forwardRef(({ 
    value, spans, onChange, placeholder, minHeight = 40, maxHeight = 400, onSubmit, onImagePaste 
}, ref) => {
    const editorRef = useRef(null);
    const isUpdatingFromState = useRef(false);

    useImperativeHandle(ref, () => ({
        focus: () => editorRef.current?.focus(),
        format: (type, url = null) => applyFormat(type, url),
        insertEmoji: (emoji) => insertTextAtCursor(emoji),
        getElement: () => editorRef.current
    }));

    useEffect(() => {
        if (!editorRef.current) return;
        if (isUpdatingFromState.current) {
            isUpdatingFromState.current = false;
            return;
        }
        
        const currentHtml = editorRef.current.innerHTML;
        const targetHtml = textAndSpansToHtml(value, spans);
        
        if (currentHtml !== targetHtml && currentHtml !== `${targetHtml}<br>`) {
            editorRef.current.innerHTML = targetHtml;
        }
    }, [value, spans]);

    const handleInput = useCallback(() => {
        const el = editorRef.current;
        if (!el) return;

        isUpdatingFromState.current = true;
        const { text, spans: newSpans } = extractTextAndSpansFromDOM(el);
        
        if (text === '' && newSpans.length === 0 && (el.innerHTML === '<br>' || el.innerHTML === '<div><br></div>')) {
            el.innerHTML = '';
        }

        onChange(text, newSpans);
    }, [onChange]);

    const applyFormat = (type, url = null) => {
        const el = editorRef.current;
        if (!el) return;

        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        const range = selection.getRangeAt(0);
        const className = FORMAT_CLASSES[type];

        if (!className) return;

        let parentNode = range.commonAncestorContainer;
        if (parentNode.nodeType === Node.TEXT_NODE) parentNode = parentNode.parentNode;
        
        const existingFormatNode = parentNode.closest(`.${className}`);

        if (existingFormatNode && el.contains(existingFormatNode)) {
            const textContent = existingFormatNode.textContent;
            const textNode = document.createTextNode(textContent);
            existingFormatNode.parentNode.replaceChild(textNode, existingFormatNode);
            
            const newRange = document.createRange();
            newRange.selectNodeContents(textNode);
            selection.removeAllRanges();
            selection.addRange(newRange);
        } else {
            const span = document.createElement("span");
            span.className = className;
            if (type === 'link' && url) span.dataset.url = url;

            try {
                range.surroundContents(span);
            } catch (e) {
                const extracted = range.extractContents();
                span.appendChild(extracted);
                range.insertNode(span);
            }
        }

        handleInput();
        el.focus();
    };

    const insertTextAtCursor = (textToInsert) => {
        const el = editorRef.current;
        if (!el) return;
        el.focus();
        document.execCommand("insertText", false, textToInsert);
        handleInput();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (!e.shiftKey && onSubmit) {
                e.preventDefault();
                onSubmit();
                return;
            }
            e.preventDefault();
            document.execCommand('insertLineBreak');
            handleInput();
        }

        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'b': e.preventDefault(); applyFormat('bold'); break;
                case 'i': e.preventDefault(); applyFormat('italic'); break;
                case 'u': e.preventDefault(); applyFormat('underline'); break;
                case 's': e.preventDefault(); applyFormat('strike'); break;
                default: break;
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        
        if (onImagePaste && e.clipboardData?.files?.length > 0) {
            const imageFiles = Array.from(e.clipboardData.files).filter(f => f.type.startsWith('image/'));
            if (imageFiles.length > 0) {
                onImagePaste(imageFiles);
                return;
            }
        }

        const text = e.clipboardData.getData('text/plain');
        document.execCommand("insertText", false, text);
        handleInput();
    };

    return (
        <>
            {}
            <style>{`
                .md-bold { font-weight: 700; }
                .md-italic { font-style: italic; }
                .md-underline { text-decoration: underline; text-underline-offset: 3px; }
                .md-strike { text-decoration: line-through; opacity: 0.8; }
                .md-code { font-family: 'JetBrains Mono', monospace; background: var(--color-input-bg); padding: 2px 6px; border-radius: 6px; border: 1px solid var(--color-border); color: var(--color-primary); }
                .md-spoiler { background: var(--color-text); color: transparent; border-radius: 6px; padding: 0 4px; }
                .md-link { color: var(--color-primary); text-decoration: underline; }
            `}</style>
            <div 
                ref={editorRef}
                contentEditable={true}
                className="create-post-textarea"
                style={{ minHeight, maxHeight, overflowY: 'auto' }}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                data-placeholder={placeholder}
                suppressContentEditableWarning={true}
            />
        </>
    );
});

export default RichEditor;