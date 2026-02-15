import { useState, useCallback, useRef, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { request } from '../../api/core'; 
import { useModal } from '../../context/ModalContext';
import { useUser } from '../../context/UserContext';
import PhoneVerificationModal from '../modals/PhoneVerificationModal';
import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js';
import { parseAndCleanForBackend, MARKDOWN_CONFIG } from '../../utils/markdownUtils';

const safeBtoa = (str) => {
    try {
        if (!str) return "";
        return window.btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
        console.error("Encoding error:", e);
        return "";
    }
};

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const processMusicFile = (file) => {
    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            console.warn("Metadata timeout - using filename");
            resolve({
                file,
                coverFile: null,
                meta: {
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    artist: "Неизвестный исполнитель"
                }
            });
        }, 2000);

        try {
            new jsmediatags.Reader(file)
                .setTagsToRead(["title", "artist", "picture"])
                .read({
                    onSuccess: (tag) => {
                        clearTimeout(timer);
                        const tags = tag.tags;
                        const title = tags.title || file.name.replace(/\.[^/.]+$/, "");
                        const artist = tags.artist || "Неизвестный исполнитель";
                        
                        let coverFile = null;
                        if (tags.picture) {
                            try {
                                const { data, type } = tags.picture;
                                const byteArray = new Uint8Array(data);
                                const blob = new Blob([byteArray], { type: type || 'image/jpeg' });
                                coverFile = new File([blob], `cover-${Date.now()}.jpg`, { type: 'image/jpeg' });
                            } catch (e) {
                                console.warn("Cover extract failed", e);
                            }
                        }
                        resolve({ file, coverFile, meta: { title, artist } });
                    },
                    onError: () => {
                        clearTimeout(timer);
                        resolve({
                            file,
                            coverFile: null,
                            meta: {
                                title: file.name.replace(/\.[^/.]+$/, ""),
                                artist: "Неизвестный исполнитель"
                            }
                        });
                    }
                });
        } catch (e) {
            clearTimeout(timer);
            resolve({
                file,
                coverFile: null,
                meta: { title: file.name, artist: "Unknown" }
            });
        }
    });
};

export const useCreatePost = (onPostCreated) => {
    const { currentUser } = useUser();
    const { openModal } = useModal();
    const textareaRef = useRef(null);

    const [text, setTextState] = useState("");
    const [attachments, setAttachments] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(""); 
    const [isRecording, setIsRecording] = useState(false); 
    const [pollData, setPollData] = useState(null);
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
                const users = res?.data?.users || res?.users || [];
                setMentionResults(users);
            } catch (e) {
                console.error("Mention search error:", e);
            } finally {
                setIsMentionLoading(false);
            }
        };
        searchUsers();
    }, [debouncedMentionQuery]);

    const handleMentionSelect = (username) => {
        if (!username || mentionCursorPos === null || !textareaRef.current) return;
        const currentText = text;
        const afterCursor = currentText.slice(mentionCursorPos); 
        const endOfWordMatch = afterCursor.match(/[\s\n]/);
        const endOfWordIndex = endOfWordMatch ? endOfWordMatch.index : -1;
        const replaceEnd = endOfWordIndex === -1 ? currentText.length : mentionCursorPos + endOfWordIndex;
        const newText = currentText.substring(0, mentionCursorPos - 1) + `@${username} ` + currentText.substring(replaceEnd);
        setTextState(newText);
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

    const detectAndFetchLink = async (inputText) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const match = inputText.match(urlRegex);
        if (match && match[0] && !linkPreview && !checkedLinksRef.current.has(match[0])) {
            const url = match[0];
            checkedLinksRef.current.add(url);
            setIsFetchingPreview(true);
            try {
                let previewData = null;
                if (window.api && window.api.invoke) {
                    const res = await request('/utils/link-preview', 'POST', { url });
                    if (res && !res.error && res.data) {
                        previewData = res.data;
                    }
                }
                if (previewData && (previewData.title || previewData.image)) {
                    setLinkPreview({
                        url: url,
                        title: previewData.title,
                        description: previewData.description,
                        image: previewData.image,
                        siteName: previewData.siteName
                    });
                }
            } catch (e) {
                console.warn("Link preview failed:", e);
            } finally {
                setIsFetchingPreview(false);
            }
        }
    };

    const removeLinkPreview = () => setLinkPreview(null);

    const setText = (e) => {
        const val = e.target ? e.target.value : e;
        setTextState(val);
        detectAndFetchLink(val);
        const cursor = e.target ? e.target.selectionStart : 0;
        if (!cursor) return;
        const textBeforeCursor = val.slice(0, cursor);
        const words = textBeforeCursor.split(/[\s\n]+/);
        const currentWord = words[words.length - 1];
        if (currentWord.startsWith('@') && currentWord.length > 1) {
            setMentionQuery(currentWord.slice(1));
            setMentionCursorPos(cursor - currentWord.length + 1); 
        } else {
            setMentionQuery(null);
            setMentionCursorPos(null);
        }
    };

    const processFiles = async (files) => {
        if (!files || files.length === 0) return;
        const audioFiles = files.filter(f => f.type.startsWith('audio/'));
        if (audioFiles.length > 0) {
            alert("Для загрузки музыки используйте кнопку 🎵 в меню.");
            return;
        }
        const mediaFiles = files.filter(f => {
            const type = f.type.toLowerCase();
            const name = f.name.toLowerCase();
            return type.startsWith('image/') || type.startsWith('video/') || name.endsWith('.gif') || name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp');
        });
        if (mediaFiles.length === 0) return;
        if (attachments.length + mediaFiles.length > 4) {
            alert("Максимум 4 вложения.");
            return;
        }
        setIsUploading(true);
        try {
            const uploadedResults = [];
            for (const file of mediaFiles) {
                setUploadStatus(`Анализ ${file.name}...`);
                const result = await apiClient.uploadFile(file, (statusText) => {
                    setUploadStatus(statusText);
                });
                if (result && result.data && result.data.id) {
                    uploadedResults.push(result.data);
                } else if (result.error) {
                    throw new Error(result.error.message || "Ошибка сервера");
                }
            }
            setAttachments((prev) => [...prev, ...uploadedResults]);
        } catch (err) {
            console.error(err);
            alert("Ошибка загрузки: " + err.message);
        } finally {
            setIsUploading(false);
            setUploadStatus("");
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        processFiles(files);
        e.target.value = '';
    };

    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setIsDragOver(false);
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    }, [attachments]); 

    const handleMusicSelect = async (e) => {
        if (attachments.length > 0 || pollData) {
            alert("Музыку нельзя совмещать с другими вложениями.");
            e.target.value = '';
            return;
        }
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        setUploadStatus("Обработка аудио...");
        try {
            const result = await processMusicFile(file);
            setUploadStatus("Загрузка аудиофайла...");
            const audioRes = await apiClient.uploadFile(result.file);
            if (!audioRes?.data?.id) throw new Error("Audio upload error");
            let coverRes = null;
            if (result.coverFile) {
                setUploadStatus("Загрузка обложки...");
                coverRes = await apiClient.uploadFile(result.coverFile);
            }
            const artistEnc = safeBtoa(result.meta.artist);
            const titleEnc = safeBtoa(result.meta.title);
            const musicContent = `[artist:${artistEnc}] [title:${titleEnc}] #nowkie_music_track`;
            const ids = [audioRes.data.id];
            if (coverRes?.data?.id) ids.push(coverRes.data.id);
            await submitPost(musicContent, ids);
        } catch (err) {
            console.error(err);
            alert("Не удалось загрузить трек: " + err.message);
        } finally {
            setIsUploading(false);
            setUploadStatus("");
            e.target.value = '';
        }
    };

    const removeAttachment = (id) => setAttachments((prev) => prev.filter(a => a.id !== id));
    const togglePoll = () => setPollData(pollData ? null : { question: '', options: ['', ''], multiple: false });
    const updatePoll = (newData) => setPollData(newData);

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
        setTextState(newText);
        setTimeout(() => {
            textarea.focus();
            const newCursorStart = start + config.start.length;
            const newCursorEnd = newCursorStart + selectedText.length;
            textarea.setSelectionRange(newCursorStart, newCursorEnd);
        }, 0);
    }, []);

    const submitPost = async (contentOverride = null, attachmentIdsOverride = null) => {
        const rawContent = (contentOverride !== null ? contentOverride : text);
        const ids = attachmentIdsOverride ?? attachments.map(a => a.id);
        let pollPayload = null;
        if (pollData && !attachmentIdsOverride) {
            const validOptions = pollData.options.filter(o => o.trim().length > 0);
            if (!pollData.question?.trim()) return alert("Введите вопрос.");
            if (validOptions.length < 2) return alert("Минимум 2 варианта ответа.");
            pollPayload = {
                question: pollData.question.trim(),
                options: validOptions.map(t => ({ text: t })),
                multipleChoice: pollData.multiple
            };
        }
        let cleanText = rawContent;
        let spans = [];
        if (contentOverride === null) {
            try {
                const parsed = parseAndCleanForBackend(rawContent);
                cleanText = parsed.cleanText;
                spans = (parsed.spans || []).filter(s => s.type !== 'mention');
            } catch (e) {
                console.error("Markdown parse error", e);
                cleanText = rawContent;
                spans = [];
            }
        }
        if (!cleanText.trim() && ids.length === 0 && !pollPayload) return;
        setIsSending(true);
        try {
            const res = await apiClient.createPost(cleanText, ids, pollPayload, spans);
            if (res && !res.error) {
                setTextState("");
                setAttachments([]);
                setPollData(null);
                setLinkPreview(null);
                checkedLinksRef.current.clear();
                if (onPostCreated) onPostCreated(res.data || res);
            } else {
                if (res?.error?.code === 'PHONE_VERIFICATION_REQUIRED') {
                    openModal(<PhoneVerificationModal user={currentUser} />);
                } else {
                    alert("Ошибка: " + (res?.error?.message || "Не удалось отправить"));
                }
            }
        } catch (e) {
            console.error("Submit error:", e);
            alert("Ошибка сети.");
        } finally {
            setIsSending(false);
        }
    };

    const handleVoiceSent = async (fileId) => {
        setIsRecording(false); 
        await submitPost("", [fileId]);
    };

    return {
        text, setText, insertMarkdown, textareaRef,
        attachments, removeAttachment, handleFileSelect, handleMusicSelect,
        isSending, isUploading, uploadStatus,
        isRecording, setIsRecording, 
        pollData, togglePoll, updatePoll,
        submitPost, mentionResults, isMentionLoading, handleMentionSelect,
        linkPreview, isFetchingPreview, removeLinkPreview,
        isDragOver,
        dragEvents: {
            onDragEnter: handleDragEnter,
            onDragLeave: handleDragLeave,
            onDragOver: handleDragOver,
            onDrop: handleDrop
        }
    };
};