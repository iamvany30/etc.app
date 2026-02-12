import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { apiClient } from '../api/client';
import './../styles/CreatePost.css';

import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js';

 
const ImageIcon = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0z"></path></svg>);
const MusicIcon = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>);
const PollIcon = () => (<svg viewBox="0 0 24 24" width="20"><path fill="currentColor" d="M6 9h12v2H6V9zm8 5H6v-2h8v2zm-8-6h12V6H6v2zM3.5 5.5c0-1.1.9-2 2-2h13c1.1 0 2 .9 2 2v13c0 1.1-.9 2-2 2h-13c-1.1 0-2-.9-2-2v-13z"></path></svg>);
const CloseIcon = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"></path></svg>);
const MicIcon = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"></path></svg>);
const StopIcon = () => (<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>);
const SendIcon = () => (<svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>);
const PlayIcon = (props) => ( <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...props}><path d="M8 5v14l11-7z" /></svg> );
const PauseIcon = (props) => ( <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...props}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> );
const TrashIcon = (props) => ( <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" {...props}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);

const CreatePost = ({ onPostCreated }) => {
    const { currentUser } = useUser();
    const [text, setText] = useState("");
    const [attachments, setAttachments] = useState([]);
    const [isSending, setIsSending] = useState(false);
    
     
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    
    const fileInputRef = useRef(null);
    const musicInputRef = useRef(null);

     
    const [recordingState, setRecordingState] = useState('idle');
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [waveformData, setWaveformData] = useState(Array(30).fill(0));
    const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);
    const timerIntervalRef = useRef(null);
    const audioPreviewRef = useRef(null);

    const cleanupRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            try { mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop()); mediaRecorderRef.current.stop(); } catch (e) {}
        }
        if (audioContextRef.current) audioContextRef.current.close();
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        mediaRecorderRef.current = null; audioContextRef.current = null;
    }, [audioUrl]);

    useEffect(() => { return () => cleanupRecording(); }, [cleanupRecording]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setRecordingState('recording');
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                setRecordingState('preview');
                clearInterval(timerIntervalRef.current);
                cancelAnimationFrame(animationFrameRef.current);
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorderRef.current.start();
            setRecordingTime(0);
            timerIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
            audioContextRef.current = new AudioContext();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 64;
            source.connect(analyserRef.current);
            visualizeWaveform();
        } catch (err) { alert("Нет доступа к микрофону."); cancelRecording(); }
    };
    
    const visualizeWaveform = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        setWaveformData(Array.from(dataArray).map(v => Math.max(0.05, v / 255)));
        animationFrameRef.current = requestAnimationFrame(visualizeWaveform);
    };
    
    const stopRecording = () => mediaRecorderRef.current?.stop();
    const cancelRecording = () => { cleanupRecording(); setRecordingState('idle'); setAudioBlob(null); setAudioUrl(null); };

     
    const startSimulatedProgress = () => {
        setUploadProgress(0);
        return setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 95) return 95;
                return prev + 5;
            });
        }, 300);
    };

    const sendVoiceMessage = async () => {
        if (!audioBlob || isSending) return;
        setIsSending(true);
        try {
            const voiceFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
            const uploaded = await apiClient.uploadFile(voiceFile);
            if (uploaded?.id) {
                const newPost = await apiClient.createPost("", [uploaded.id]);
                if (newPost && !newPost.error) { onPostCreated && onPostCreated(newPost); cancelRecording(); }
            }
        } catch (err) { console.error(err); } finally { setIsSending(false); }
    };
    const togglePreview = () => { if (audioPreviewRef.current) isPreviewPlaying ? audioPreviewRef.current.pause() : audioPreviewRef.current.play(); setIsPreviewPlaying(!isPreviewPlaying); };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const progressInterval = startSimulatedProgress();

        try {
            console.log(`[CreatePost] Начинаем загрузку: ${file.name}, Размер: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
            const uploaded = await apiClient.uploadFile(file);
            console.log("[CreatePost] Ответ сервера:", uploaded);

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (uploaded && uploaded.id) {
                setAttachments(prev => [...prev, uploaded]);
            } else if (uploaded.error) {
                const errorMsg = uploaded.error.message || uploaded.error;
                if (uploaded.status === 413 || errorMsg.includes('413')) {
                    alert(`⚠️ ОШИБКА: Файл слишком большой!\nРазмер: ${(file.size / 1024 / 1024).toFixed(2)} MB\nСервер не может принять такой объем.`);
                } else {
                    alert(`Ошибка загрузки: ${errorMsg}`);
                }
            } else {
                alert("Неизвестная ошибка загрузки. Проверьте консоль разработчика (F12).");
            }
        } catch (err) {
            console.error("[CreatePost] Exception:", err);
            alert("Ошибка сети при загрузке: " + err.message);
        } finally {
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }, 500);
        }
    };

    const handleMusicSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        const progressInterval = startSimulatedProgress();

        new jsmediatags.Reader(file)
            .setTagsToRead(["title", "artist", "picture"])
            .read({
                onSuccess: async (tag) => {
                    const tags = tag.tags;
                    const title = tags.title || prompt("Название трека:", file.name.replace(/\.[^/.]+$/, ""));
                    const artist = tags.artist || prompt("Исполнитель:", "Неизвестный исполнитель");

                    if (!title || !artist) { setIsUploading(false); clearInterval(progressInterval); return; }

                    try {
                        const audioUpload = await apiClient.uploadFile(file);
                        let coverUpload = null;
                        if (tags.picture) {
                            const { data } = tags.picture; 
                            const byteArray = new Uint8Array(data);
                            const blob = new Blob([byteArray], { type: 'image/jpeg' });
                            const coverFile = new File([blob], `cover-${Date.now()}.jpg`, { type: 'image/jpeg' });
                            coverUpload = await apiClient.uploadFile(coverFile);
                        }

                        if (audioUpload && audioUpload.id) {
                            const artistEncoded = btoa(unescape(encodeURIComponent(artist)));
                            const titleEncoded = btoa(unescape(encodeURIComponent(title)));
                            const postContent = `[artist:${artistEncoded}] [title:${titleEncoded}] #nowkie_music_track`;
                            
                            const ids = [audioUpload.id];
                            if (coverUpload && coverUpload.id) ids.push(coverUpload.id);

                            const newPost = await apiClient.createPost(postContent, ids);
                            if (newPost && !newPost.error) { if (onPostCreated) onPostCreated(newPost); } 
                        } else {
                            alert("Не удалось загрузить аудио-файл.");
                        }
                    } catch (err) {
                        console.error(err);
                    } finally {
                        clearInterval(progressInterval);
                        setIsUploading(false);
                        setUploadProgress(0);
                    }
                },
                onError: () => { alert("Ошибка чтения тегов"); setIsUploading(false); clearInterval(progressInterval); }
            });
        musicInputRef.current.value = '';
    };

    const removeAttachment = (id) => setAttachments(prev => prev.filter(att => att.id !== id));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if ((!text.trim() && attachments.length === 0) || isSending || isUploading) return;
        setIsSending(true);
        try {
            const attachmentIds = attachments.map(att => att.id);
            const newPost = await apiClient.createPost(text, attachmentIds);
            if (newPost && !newPost.error) { setText(""); setAttachments([]); if (onPostCreated) onPostCreated(newPost); }
        } catch (e) { console.error(e); } finally { setIsSending(false); }
    };

    if (!currentUser) return null;

    return (
        <div className="create-post-card">
            <div className="create-post-inner">
                <div className="avatar" style={{width: 40, height: 40, fontSize: 20}}>{currentUser.avatar}</div>
                <div className="create-post-content">
                    {recordingState === 'idle' ? (
                        <textarea className="create-post-textarea" placeholder="Что происходит?!" rows={1} value={text} onChange={(e) => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} />
                    ) : renderVoiceRecorder()}
                    
                    {attachments.length > 0 && (
                        <div className="attachments-preview">
                            {attachments.map(att => {
                                const mime = att.mimeType || att.type || '';
                                const isVid = mime.startsWith('video/') || att.url.toLowerCase().endsWith('.mp4');

                                return (
                                    <div key={att.id} className="attachment-item">
                                        {isVid ? (
                                            <video src={att.url} className="create-post-media-preview" controls muted playsInline />
                                        ) : (
                                            <img src={att.url} alt="media" />
                                        )}
                                        <button className="remove-att-btn" onClick={() => removeAttachment(att.id)}><CloseIcon /></button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {isUploading && (
                        <div className="upload-progress-container">
                            <div className="upload-progress-info">
                                <span>Загрузка файла...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="upload-progress-track">
                                <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {recordingState === 'idle' && (
                 <div className="create-post-footer">
                    <div className="create-post-tools">
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{display: 'none'}} accept="image/*,video/*" />
                        <input type="file" ref={musicInputRef} onChange={handleMusicSelect} style={{display: 'none'}} accept="audio/mpeg,audio/mp3" />
                        <button className="tool-btn" onClick={() => fileInputRef.current.click()} disabled={isUploading || attachments.length >= 4} title="Прикрепить фото или видео"><ImageIcon /></button>
                        <button className="tool-btn" onClick={() => musicInputRef.current.click()} disabled={isUploading || attachments.length > 0} title="Прикрепить музыку"><MusicIcon /></button>
                        <button className="tool-btn" title="Создать опрос"><PollIcon/></button>
                    </div>
                    {text.trim() || attachments.length > 0 ? (
                        <button className="create-post-submit" onClick={handleSubmit} disabled={isSending || isUploading}>{isSending ? '...' : 'Опубликовать'}</button>
                    ) : (
                        <button className="tool-btn mic" onClick={startRecording} title="Записать голос"><MicIcon /></button>
                    )}
                </div>
            )}
        </div>
    );
};

const renderVoiceRecorder = () => {};  

export default CreatePost;