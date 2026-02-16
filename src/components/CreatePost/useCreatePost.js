
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { request } from '../../api/core'; 
import { useModal } from '../../context/ModalContext';
import { useUser } from '../../context/UserContext';
import { useIsland } from '../../context/IslandContext';
import PhoneVerificationModal from '../modals/PhoneVerificationModal';
import DrawingBoard from '../DrawingBoard';
import { parseAndCleanForBackend, MARKDOWN_CONFIG } from '../../utils/markdownUtils';

export const MAX_POST_LENGTH = 400;

const DRAFT_TEXT_KEY = 'itd_post_draft_text';
const DRAFT_POLL_KEY = 'itd_post_draft_poll';


const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

export const useCreatePost = (onPostCreated) => {
    const { currentUser } = useUser();
    const { openModal, closeModal } = useModal();
    const { showIslandAlert } = useIsland();
    const textareaRef = useRef(null);

    
    const [text, setTextState] = useState(() => localStorage.getItem(DRAFT_TEXT_KEY) || "");
    const [pollData, setPollData] = useState(() => {
        try {
            const saved = localStorage.getItem(DRAFT_POLL_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch (e) { return null; }
    });

    
    useEffect(() => {
        localStorage.setItem(DRAFT_TEXT_KEY, text);
    }, [text]);

    useEffect(() => {
        if (pollData) {
            localStorage.setItem(DRAFT_POLL_KEY, JSON.stringify(pollData));
        } else {
            localStorage.removeItem(DRAFT_POLL_KEY);
        }
    }, [pollData]);

    
    const [attachments, setAttachments] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [isRecording, setIsRecording] = useState(false); 
    const [isDragOver, setIsDragOver] = useState(false); 

    
    const [mentionQuery, setMentionQuery] = useState(null);
    const [mentionResults, setMentionResults] = useState([]);
    const [isMentionLoading, setIsMentionLoading] = useState(false);
    const [mentionCursorPos, setMentionCursorPos] = useState(null);
    const debouncedMentionQuery = useDebounce(mentionQuery, 300);

    
    const [linkPreview, setLinkPreview] = useState(null);
    const [isFetchingPreview, setIsFetchingPreview] = useState(false);
    const checkedLinksRef = useRef(new Set());

    

    
    useEffect(() => {
        const searchUsers = async () => {
            if (!debouncedMentionQuery) {
                setMentionResults([]);
                return;
            }
            setIsMentionLoading(true);
            try {
                const res = await apiClient.search(debouncedMentionQuery);
                setMentionResults(res?.data?.users || res?.users || []);
            } catch (e) {
                console.error(e);
            } finally {
                setIsMentionLoading(false);
            }
        };
        searchUsers();
    }, [debouncedMentionQuery]);

    
    const detectAndFetchLink = async (inputText) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const match = inputText.match(urlRegex);
        if (match && match[0] && !linkPreview && !checkedLinksRef.current.has(match[0])) {
            const url = match[0];
            checkedLinksRef.current.add(url);
            setIsFetchingPreview(true);
            try {
                let previewData = null;
                const res = await request('/utils/link-preview', 'POST', { url });
                if (res && !res.error && res.data) previewData = res.data;
                if (previewData && (previewData.title || previewData.image)) {
                    setLinkPreview({ url, title: previewData.title, description: previewData.description, image: previewData.image, siteName: previewData.siteName });
                }
            } catch (e) {} finally { setIsFetchingPreview(false); }
        }
    };
    
    
    const processFiles = useCallback(async (files) => {
        if (!files || files.length === 0) return;
        
        const mediaFiles = Array.from(files).filter(f => {
            const type = f.type.toLowerCase();
            return type.startsWith('image/') || type.startsWith('video/') || f.name.toLowerCase().endsWith('.gif');
        });
        
        if (mediaFiles.length === 0) return;

        if (attachments.length + mediaFiles.length > 4) {
            showIslandAlert('error', 'Максимум 4 вложения', '🚫');
            return;
        }
        
        const pendingAttachments = mediaFiles.map(file => ({
            localId: `pending_${Date.now()}_${Math.random()}`, 
            previewUrl: URL.createObjectURL(file), 
            status: 'pending', 
            file: file 
        }));

        setAttachments(prev => [...prev, ...pendingAttachments]);

        const uploadPromises = pendingAttachments.map(async (pending) => {
            try {
                const result = await apiClient.uploadFile(pending.file);
                if (result?.data?.id) {
                    return { localId: pending.localId, serverData: result.data };
                }
                throw new Error(result?.error?.message || 'Server upload failed');
            } catch (error) {
                return { localId: pending.localId, error };
            }
        });

        const results = await Promise.all(uploadPromises);

        setAttachments(prev => {
            const nextState = [...prev];
            results.forEach(res => {
                const index = nextState.findIndex(att => att.localId === res.localId);
                if (index !== -1) {
                    URL.revokeObjectURL(nextState[index].previewUrl); 
                    if (res.serverData) {
                        nextState[index] = res.serverData; 
                    } else {
                        nextState.splice(index, 1); 
                    }
                }
            });
            return nextState;
        });

        const successfulCount = results.filter(r => r.serverData).length;
        if (successfulCount < results.length) {
            showIslandAlert('error', `Ошибка загрузки ${results.length - successfulCount} файлов`, '⚠️');
        }

    }, [attachments.length, showIslandAlert]);

    
    const handlePaste = useCallback((e) => {
        if (e.clipboardData && e.clipboardData.files.length > 0) {
            e.preventDefault();
            processFiles(e.clipboardData.files);
        }
    }, [processFiles]);

    
    const setText = useCallback((valOrEvent) => {
        const value = valOrEvent?.target?.value ?? valOrEvent;
        setTextState(value);
        detectAndFetchLink(value);
        
        const cursor = valOrEvent?.target?.selectionStart;
        if (cursor !== null && cursor !== undefined) {
            const textBeforeCursor = value.slice(0, cursor);
            const currentWord = textBeforeCursor.split(/[\s\n]+/).pop();
            if (currentWord.startsWith('@') && currentWord.length > 1) {
                setMentionQuery(currentWord.slice(1));
                setMentionCursorPos(cursor - currentWord.length + 1);
            } else {
                setMentionQuery(null);
            }
        }
    }, []);
    
    
    const handleMentionSelect = (username) => {
        if (!username || mentionCursorPos === null || !textareaRef.current) return;
        const currentText = text;
        const afterCursor = currentText.slice(mentionCursorPos); 
        const endOfWordMatch = afterCursor.match(/[\s\n]/);
        const endOfWordIndex = endOfWordMatch ? endOfWordMatch.index : -1;
        const replaceEnd = endOfWordIndex === -1 ? currentText.length : mentionCursorPos + endOfWordIndex;
        
        const newText = currentText.substring(0, mentionCursorPos - 1) + `@${username} ` + currentText.substring(replaceEnd);
        setText(newText);
        setMentionQuery(null);
        setMentionResults([]);
        setMentionCursorPos(null);
        
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newCursor = (mentionCursorPos - 1) + 1 + username.length + 1;
                textareaRef.current.setSelectionRange(newCursor, newCursor);
            }
        }, 0);
    };

    
    const insertMarkdown = useCallback((type) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const config = MARKDOWN_CONFIG[type];
        if (!config) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = textarea.value;
        const selectedText = currentText.substring(start, end);
        const newText = currentText.substring(0, start) + config.start + selectedText + (config.end || config.start) + currentText.substring(end);
        setText(newText);
    }, [text, setText]);

    
    const submitPost = async (contentOverride = null, attachmentIdsOverride = null) => {
        const rawContent = contentOverride !== null ? contentOverride : text;
        if (!rawContent.trim() && !pollData && (attachmentIdsOverride || attachments.filter(a => !a.status)).length === 0) return;
        if (rawContent.length > MAX_POST_LENGTH && contentOverride === null) {
            showIslandAlert('error', 'Слишком длинный текст', '📝');
            return;
        }

        setIsSending(true);
        try {
            const ids = attachmentIdsOverride ?? attachments.map(a => a.id).filter(Boolean);
            let pollPayload = null;
            if (pollData && !attachmentIdsOverride) {
                const validOptions = pollData.options.filter(o => o.trim().length > 0);
                pollPayload = { 
                    question: pollData.question.trim(), 
                    options: validOptions.map(t => ({ text: t })), 
                    multipleChoice: pollData.multiple 
                };
            }

            const { cleanText, spans } = contentOverride === null 
                ? parseAndCleanForBackend(rawContent) 
                : { cleanText: rawContent, spans: [] };
            
            const res = await apiClient.createPost(cleanText, ids, pollPayload, spans);

            if (res && !res.error) {
                
                localStorage.removeItem(DRAFT_TEXT_KEY);
                localStorage.removeItem(DRAFT_POLL_KEY);
                setTextState("");
                setAttachments([]);
                setPollData(null);
                setLinkPreview(null);
                checkedLinksRef.current.clear();
                
                if (onPostCreated) onPostCreated(res.data || res);
                showIslandAlert('success', 'Пост опубликован!', '✨');
            } else if (res?.error?.code === 'PHONE_VERIFICATION_REQUIRED') {
                openModal(<PhoneVerificationModal user={currentUser} />);
            } else {
                showIslandAlert('error', res?.error?.message || 'Ошибка публикации', '❌');
            }
        } catch (e) {
            showIslandAlert('error', 'Сбой при отправке', '📡');
        } finally { 
            setIsSending(false); 
        }
    };
    
    
    const openDrawingModal = () => {
        openModal(
            <div style={{ padding: '20px', background: '#0f0f0f', borderRadius: '16px', width: '100%', maxWidth: '800px' }}>
                <h2 style={{ marginBottom: '16px', color: 'white', fontSize: '18px', fontWeight: '800' }}>Создать рисунок</h2>
                <DrawingBoard 
                    aspectRatio={1.77}
                    onSave={async (blob) => {
                        const file = new File([blob], `draw_${Date.now()}.png`, { type: 'image/png' });
                        await processFiles([file]); 
                        closeModal();
                    }} 
                />
            </div>
        );
    };

    
    const handleFileSelect = (e) => { processFiles(e.target.files); e.target.value = ''; };
    const removeAttachment = (id) => setAttachments(prev => prev.filter(a => (a.id || a.localId) !== id));
    const handleVoiceSent = (attachmentId) => { setIsRecording(false); submitPost("#voice_message", [attachmentId]); };
    const removeLinkPreview = () => setLinkPreview(null);
    const togglePoll = () => setPollData(p => p ? null : { question: '', options: ['', ''], multiple: false });
    const updatePoll = (newData) => setPollData(newData);
    
    
    return {
        text, setText, textareaRef, insertMarkdown, handlePaste,
        attachments, removeAttachment, handleFileSelect,
        isSending,
        isRecording, setIsRecording, handleVoiceSent,
        pollData, togglePoll, updatePoll,
        openDrawingModal,
        submitPost, 
        mentionResults, isMentionLoading, handleMentionSelect,
        linkPreview, isFetchingPreview, removeLinkPreview,
        isDragOver, setIsDragOver,
        dragEvents: {
            onDragEnter: (e) => { e.preventDefault(); setIsDragOver(true); },
            onDragLeave: (e) => { e.preventDefault(); setIsDragOver(false); },
            onDragOver: (e) => e.preventDefault(),
            onDrop: (e) => { e.preventDefault(); setIsDragOver(false); processFiles(e.dataTransfer.files); }
        }
    };
};