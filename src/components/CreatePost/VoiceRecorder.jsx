import React, { useState, useRef, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/client';

// Иконки (можно вынести отдельно, но оставим здесь для компактности)
const StopIcon = () => (<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>);
const TrashIcon = () => ( <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
const SendIcon = () => (<svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>);

const VoiceRecorder = ({ onRecordComplete, onCancel }) => {
    const [recordingState, setRecordingState] = useState('recording'); // recording, preview, sending
    const [audioBlob, setAudioBlob] = useState(null);
    const [waveformData, setWaveformData] = useState(Array(30).fill(0.1));
    const [time, setTime] = useState(0);

    const mediaRecorderRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);
    const timerRef = useRef(null);

    // Очистка ресурсов
    const cleanup = useCallback(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
            mediaRecorderRef.current.stop();
        }
        if (audioContextRef.current) audioContextRef.current.close();
        cancelAnimationFrame(animationFrameRef.current);
        clearInterval(timerRef.current);
    }, []);

    useEffect(() => {
        startRecording();
        return cleanup;
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Настройка анализатора звука
            audioContextRef.current = new AudioContext();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 64;
            source.connect(analyserRef.current);

            // Настройка рекордера
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
            
            // Визуализация
            const visualize = () => {
                if (!analyserRef.current) return;
                const data = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(data);
                setWaveformData(Array.from(data).slice(0, 30).map(v => Math.max(0.1, v / 255)));
                animationFrameRef.current = requestAnimationFrame(visualize);
            };
            visualize();

            // Таймер
            timerRef.current = setInterval(() => setTime(t => t + 1), 1000);

        } catch (e) {
            console.error(e);
            alert("Нет доступа к микрофону");
            onCancel();
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
        cleanup(); // Останавливаем анализ и таймер, но не удаляем blob
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
                <button className="voice-btn stop" onClick={stopRecording}>
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
                        style={{ height: `${h * 100}%`, transform: `scaleY(${h})` }} 
                    />
                ))}
            </div>

            <div className="voice-time">{formatTime(time)}</div>

            {recordingState === 'preview' && (
                <button className="voice-btn send" onClick={handleSend}>
                    <SendIcon />
                </button>
            )}
        </div>
    );
};

export default VoiceRecorder;