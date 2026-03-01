/* @source src/components/CreatePost/useCreatePost.js */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { request } from '../../api/core'; 
import { useModalStore } from '../../store/modalStore';
import { useUserStore } from '../../store/userStore';
import { useIslandStore } from '../../store/islandStore';
import PhoneVerificationModal from '../modals/PhoneVerificationModal';
import DrawingBoard from '../DrawingBoard';
import { storage } from '../../utils/storage';

export const MAX_POST_LENGTH = 5000; 

const DRAFT_TEXT_KEY = 'itd_post_draft_text';
const DRAFT_SPANS_KEY = 'itd_post_draft_spans';
const DRAFT_POLL_KEY = 'itd_post_draft_poll';
const DRAFT_MEDIA_KEY = 'itd_post_draft_media'; 

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

export const useCreatePost = (onPostCreated, wallId = null) => {
    const currentUser = useUserStore(state => state.currentUser);
    const openModal = useModalStore(state => state.openModal);
    const closeModal = useModalStore(state => state.closeModal);
    const showIslandAlert = useIslandStore(state => state.showIslandAlert);
    
    const textareaRef = useRef(null);

    const [text, setTextState] = useState("");
    const [spans, setSpansState] = useState([]); 
    const [pollData, setPollData] = useState(null);
    const [attachments, setAttachments] = useState([]);

    
    useEffect(() => {
        let isMounted = true;
        const loadDrafts = async () => {
            try {
                const [savedText, savedSpans, savedPoll, savedMedia] = await Promise.all([
                    storage.get(DRAFT_TEXT_KEY),
                    storage.get(DRAFT_SPANS_KEY),
                    storage.get(DRAFT_POLL_KEY),
                    storage.get(DRAFT_MEDIA_KEY)
                ]);
                
                if (isMounted) {
                    if (savedText && !text) setTextState(savedText);
                    if (savedSpans && spans.length === 0) setSpansState(savedSpans);
                    if (savedPoll && !pollData) setPollData(savedPoll); 
                    
                    if (savedMedia && Array.isArray(savedMedia) && savedMedia.length > 0) {
                        const rehydratedAttachments = savedMedia.map(att => {
                            let previewUrl = att.previewUrl;
                            if (att.file instanceof Blob || att.file instanceof File) {
                                try { previewUrl = URL.createObjectURL(att.file); } catch(e) {}
                            } else if (att.serverData?.url) {
                                previewUrl = att.serverData.url;
                            } else if (att.url) {
                                previewUrl = att.url;
                            }
                            const status = att.status === 'pending' || att.status === 'uploading' ? 'error' : att.status;
                            return { ...att, previewUrl, status };
                        });
                        setAttachments(rehydratedAttachments);
                    }
                }
            } catch (e) { console.error(e); }
        };
        loadDrafts();
        return () => { isMounted = false; };
    }, []);

    
    useEffect(() => { storage.set(DRAFT_TEXT_KEY, text).catch(e => console.error(e)); }, [text]);
    useEffect(() => { storage.set(DRAFT_SPANS_KEY, spans).catch(e => console.error(e)); }, [spans]);
    useEffect(() => {
        if (pollData) storage.set(DRAFT_POLL_KEY, pollData).catch(e => console.error(e));
        else storage.remove(DRAFT_POLL_KEY).catch(e => console.error(e));
    }, [pollData]);
    useEffect(() => {
        const saveMediaDraft = async () => {
            if (attachments.length > 0) {
                const mediaToSave = attachments.map(att => ({
                    localId: att.localId, 
                    id: att.id, 
                    status: att.status,
                    file: att.file, 
                    serverData: att.serverData,
                    url: att.url,
                    type: att.type
                }));
                await storage.set(DRAFT_MEDIA_KEY, mediaToSave);
            } else {
                await storage.remove(DRAFT_MEDIA_KEY);
            }
        };
        saveMediaDraft();
    }, [attachments]);


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
            } catch (e) { console.error(e); } 
            finally { setIsMentionLoading(false); }
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
            file: file,
            type: file.type
        }));
        setAttachments(prev => [...prev, ...pendingAttachments]);

        const uploadPromises = pendingAttachments.map(async (pending) => {
            try {
                const result = await apiClient.uploadFile(pending.file);
                if (result?.data?.id) return { localId: pending.localId, serverData: result.data };
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
                    if (res.serverData) {
                        nextState[index] = { 
                            ...nextState[index], 
                            status: 'complete', 
                            id: res.serverData.id, 
                            serverData: res.serverData,
                            url: res.serverData.url, 
                            type: res.serverData.mimeType || res.serverData.type || nextState[index].type
                        }; 
                    } else {
                        nextState[index] = { ...nextState[index], status: 'error' };
                    }
                }
            });
            return nextState;
        });
    }, [attachments.length, showIslandAlert]);

    const setTextAndSpans = useCallback((newText, newSpans) => {
        setTextState(newText);
        setSpansState(newSpans);
        detectAndFetchLink(newText);
        
        const currentWordMatch = newText.match(/(?:^|\s)(@[a-zA-Z0-9_]*)$/);
        if (currentWordMatch) {
            const word = currentWordMatch[1];
            if (word.length > 1) {
                setMentionQuery(word.slice(1));
                setMentionCursorPos(newText.length - word.length + 1);
            } else {
                setMentionQuery(null);
            }
        } else {
            setMentionQuery(null);
        }
    }, []);
    
    const handleMentionSelect = useCallback((username) => {
        if (!username || !textareaRef.current) return;
        textareaRef.current.insertEmoji(`@${username} `); 
        setMentionQuery(null);
        setMentionResults([]);
        setMentionCursorPos(null);
    }, []);

    const insertMarkdown = useCallback((type, url = null) => {
        if (textareaRef.current) textareaRef.current.format(type, url);
    }, []);

    const insertEmoji = useCallback((emoji) => {
        if (textareaRef.current) textareaRef.current.insertEmoji(emoji);
    }, []);


    
    const submitPost = async (contentOverride = null, attachmentIdsOverride = null) => {
        let rawContent = contentOverride !== null ? contentOverride : text;
        let finalSpans = contentOverride === null ? spans : [];
        
        const hasContent = rawContent.trim().length > 0;
        const hasAttachments = (attachmentIdsOverride || attachments.filter(a => a.status === 'complete').map(a => a.id)).length > 0;
        const hasPoll = pollData && pollData.question?.trim();

        if (!hasContent && !hasAttachments && !hasPoll) return;

        if (rawContent.length > MAX_POST_LENGTH && contentOverride === null) {
            showIslandAlert('error', 'Слишком длинный текст', '📝');
            return;
        }

        const pendingUploads = attachments.filter(a => a.status === 'pending');
        if (pendingUploads.length > 0) {
            showIslandAlert('warning', 'Дождитесь загрузки файлов', '⏳');
            return;
        }

        setIsSending(true);
        try {
            
            rawContent = rawContent.replace(/[\s\n]+$/, ''); 
            
            finalSpans = finalSpans
                .filter(s => s.offset < rawContent.length && s.length > 0)
                .map(s => {
                    const safeSpan = { ...s };
                    
                    if (safeSpan.offset + safeSpan.length > rawContent.length) {
                        safeSpan.length = rawContent.length - safeSpan.offset;
                    }
                    return safeSpan;
                });

            const ids = attachmentIdsOverride ?? attachments.map(a => a.id || a.serverData?.id).filter(Boolean);

            let pollPayload = null;
            if (pollData && !attachmentIdsOverride) {
                const validOptions = pollData.options.filter(o => o.trim().length > 0);
                pollPayload = { 
                    question: pollData.question.trim(), 
                    options: validOptions.map(t => ({ text: t })), 
                    multipleChoice: pollData.multiple 
                };
            }

            const res = await apiClient.createPost(rawContent, ids, pollPayload, finalSpans, wallId);

            if (res && !res.error) {
                storage.remove(DRAFT_TEXT_KEY);
                storage.remove(DRAFT_SPANS_KEY);
                storage.remove(DRAFT_POLL_KEY);
                storage.remove(DRAFT_MEDIA_KEY);
                
                setTextState("");
                setSpansState([]);
                if (textareaRef.current?.getElement) {
                    textareaRef.current.getElement().innerHTML = '';
                }
                setAttachments([]);
                setPollData(null);
                setLinkPreview(null);
                checkedLinksRef.current.clear();
                
                if (onPostCreated) onPostCreated(res.data || res);
                showIslandAlert('success', 'Пост опубликован!', '✨');
            } else if (res?.error?.code === 'PHONE_VERIFICATION_REQUIRED') {
                openModal(<PhoneVerificationModal user={currentUser} />);
            } else {
                const msg = res?.error?.code === 'ACCESS_DENIED' 
                    ? 'Доступ к стене ограничен автором' 
                    : (res?.error?.message || 'Ошибка публикации');
                showIslandAlert('error', msg, '❌');
            }
        } catch (e) {
            console.error(e);
            showIslandAlert('error', 'Сбой при отправке', '📡');
        } finally { 
            setIsSending(false); 
        }
    };
    
    const openDrawingModal = () => {
        openModal(
            <div className="drawing-modal-wrapper">
                <div className="drawing-modal-header">
                    <h2>Создать рисунок</h2>
                </div>
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
    const isUploading = attachments.some(a => a.status === 'pending');

    return {
        text, spans, setTextAndSpans, textareaRef, insertMarkdown, insertEmoji,
        attachments, removeAttachment, handleFileSelect, processFiles,
        isSending, isUploading,
        isRecording, setIsRecording, handleVoiceSent,
        pollData, togglePoll, updatePoll, openDrawingModal, submitPost, 
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