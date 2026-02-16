/* @source src/components/CreatePost/VoiceRecorder.jsx */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/client';
import { StopIcon, TrashIcon, SendIcon } from '../icons/CommonIcons';

const VoiceRecorder = ({ onRecordComplete, onCancel }) => {
    const [recordingState, setRecordingState] = useState('recording'); 
    const [audioBlob, setAudioBlob] = useState(null);
    const [waveformData, setWaveformData] = useState(Array(30).fill(0.1));
    const [time, setTime] = useState(0);

    const mediaRecorderRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);
    const timerRef = useRef(null);

    
    const cleanup = useCallback(() => {
        
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            if (mediaRecorderRef.current.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
            }
        }

        
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(err => console.warn("AudioContext close error:", err));
        }

        
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
    }, []);

    useEffect(() => {
        startRecording();
        return cleanup;
    }, []); 

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 64;
            source.connect(analyserRef.current);

            
            mediaRecorderRef.current = new MediaRecorder(stream);
            const chunks = [];
            mediaRecorderRef.current.ondataavailable = e => chunks.push(e.data);
            
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                setRecordingState('preview');
                
                stream.getTracks().forEach(t => t.stop());
            };

            mediaRecorderRef.current.start();
            
            
            const visualize = () => {
                if (!analyserRef.current) return;
                const data = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(data);
                
                
                setWaveformData(Array.from(data).slice(0, 30).map(v => Math.max(0.1, v / 255)));
                animationFrameRef.current = requestAnimationFrame(visualize);
            };
            visualize();

            
            timerRef.current = setInterval(() => setTime(t => t + 1), 1000);

        } catch (e) {
            console.error(e);
            alert("Нет доступа к микрофону");
            onCancel();
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        
        
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        
        
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => {});
        }
    };

    const handleSend = async () => {
        if (!audioBlob) return;
        setRecordingState('sending');
        try {
            
            const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
            const res = await apiClient.uploadFile(file);
            if (res?.data?.id) {
                onRecordComplete(res.data.id);
            }
        } catch (e) {
            alert("Ошибка отправки голосового");
            setRecordingState('preview');
        }
    };

    const formatTime = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="voice-recorder-ui">
            {recordingState === 'recording' ? (
                <button className="voice-btn stop" onClick={stopRecording} title="Остановить">
                    <StopIcon />
                </button>
            ) : (
                <button className="voice-btn delete" onClick={onCancel} title="Удалить">
                    <TrashIcon />
                </button>
            )}

            <div className="voice-waveform">
                {waveformData.map((h, i) => (
                    <div 
                        key={i} 
                        className={`voice-bar ${recordingState}`} 
                        style={{ 
                            height: `${Math.max(10, h * 100)}%`, 
                            opacity: recordingState === 'recording' ? 1 : 0.5 
                        }} 
                    />
                ))}
            </div>

            <div className="voice-time">{formatTime(time)}</div>

            {recordingState === 'preview' && (
                <button className="voice-btn send" onClick={handleSend} title="Отправить">
                    <SendIcon />
                </button>
            )}
            
            {recordingState === 'sending' && (
                <div className="voice-spinner"></div>
            )}
        </div>
    );
};

export default VoiceRecorder;