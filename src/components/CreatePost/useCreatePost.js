import { useState } from 'react';
import { apiClient } from '../../api/client';
import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js';

// --- Переносим логику обработки музыки прямо сюда ---
const processMusicFile = (file) => {
    return new Promise((resolve, reject) => {
        new jsmediatags.Reader(file)
            .setTagsToRead(["title", "artist", "picture"])
            .read({
                onSuccess: async (tag) => {
                    const tags = tag.tags;
                    const title = tags.title || prompt("Название трека:", file.name.replace(/\.[^/.]+$/, ""));
                    const artist = tags.artist || prompt("Исполнитель:", "Неизвестный исполнитель");

                    if (!title || !artist) return resolve(null);

                    try {
                        const audioUpload = await apiClient.uploadFile(file);
                        let coverUpload = null;
                        if (tags.picture) {
                            const { data, type } = tags.picture;
                            const byteArray = new Uint8Array(data);
                            const blob = new Blob([byteArray], { type: type || 'image/jpeg' });
                            const coverFile = new File([blob], `cover-${Date.now()}.jpg`, { type: 'image/jpeg' });
                            coverUpload = await apiClient.uploadFile(coverFile);
                        }
                        resolve({ audio: audioUpload?.data, cover: coverUpload?.data, meta: { artist, title } });
                    } catch (e) { reject(e); }
                },
                onError: (error) => {
                    console.error(error);
                    resolve(null);
                }
            });
    });
};
// ----------------------------------------------------

export const useCreatePost = (onPostCreated) => {
    const [text, setText] = useState("");
    const [attachments, setAttachments] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isRecording, setIsRecording] = useState(false);

    const simulateProgress = () => {
        setUploadProgress(0);
        const interval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);
        return () => clearInterval(interval);
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const stopProgress = simulateProgress();

        try {
            const res = await apiClient.uploadFile(file);
            stopProgress();
            setUploadProgress(100);

            if (res?.data?.id) {
                setAttachments(prev => [...prev, res.data]);
            } else {
                alert("Ошибка загрузки файла: " + (res?.error?.message || "Unknown error"));
            }
        } catch (err) {
            alert("Ошибка сети: " + err.message);
        } finally {
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
                e.target.value = '';
            }, 300);
        }
    };

    const handleMusicSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const stopProgress = simulateProgress();

        try {
            const result = await processMusicFile(file);
            stopProgress();
            
            if (result && result.audio) {
                const artistEnc = btoa(unescape(encodeURIComponent(result.meta.artist)));
                const titleEnc = btoa(unescape(encodeURIComponent(result.meta.title)));
                const musicContent = `[artist:${artistEnc}] [title:${titleEnc}] #nowkie_music_track`;
                
                const ids = [result.audio.id];
                if (result.cover) ids.push(result.cover.id);

                await submitPost(musicContent, ids);
            }
        } catch (err) {
            console.error(err);
            alert("Ошибка обработки музыки");
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            e.target.value = '';
        }
    };

    const removeAttachment = (id) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const submitPost = async (contentOverride = null, attachmentIdsOverride = null) => {
        setIsSending(true);
        try {
            const content = contentOverride ?? text;
            const ids = attachmentIdsOverride ?? attachments.map(a => a.id);

            const newPost = await apiClient.createPost(content, ids);
            
            if (newPost && !newPost.error) {
                setText("");
                setAttachments([]);
                if (onPostCreated) onPostCreated(newPost);
            } else {
                alert("Ошибка публикации");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSending(false);
        }
    };

    const handleVoiceSent = async (fileId) => {
        setIsRecording(false);
        await submitPost("", [fileId]);
    };

    return {
        text, setText,
        attachments, removeAttachment,
        isSending, isUploading, uploadProgress,
        isRecording, setIsRecording,
        handleFileSelect, handleMusicSelect, handleVoiceSent,
        submitPost
    };
};