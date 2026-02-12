import React, { useState, useRef, useEffect, useMemo } from 'react';
import { PlayIcon, PauseIcon } from './icons/MediaIcons';  
import '../styles/VoicePlayer.css';

const VoicePlayer = ({ src, duration = 0 }) => {
    const audioRef = useRef(null);
    const progressRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

     
    const waveformData = useMemo(() => {
        let seed = 0;
        for (let i = 0; i < src.length; i++) {
            seed = (seed + src.charCodeAt(i)) % 1000;
        }
        return Array.from({ length: 45 }, () => {
            seed = (seed * 9301 + 49297) % 233280;
            return 0.2 + (seed / 233280) * 0.8;
        });
    }, [src]);

    const togglePlay = (e) => {
        e.stopPropagation();
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
             
            document.querySelectorAll('audio').forEach(audio => audio.pause());
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };
    
     
    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

     
    const handleProgressClick = (e) => {
        e.stopPropagation();
        if (!progressRef.current || !audioRef.current || duration === 0) return;
        
        const rect = progressRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        
        audioRef.current.currentTime = duration * percentage;
    };

    useEffect(() => {
        const audio = audioRef.current;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleEnded = () => setIsPlaying(false);
        const handlePause = () => setIsPlaying(false);
        const handlePlay = () => setIsPlaying(true);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('play', handlePlay);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('play', handlePlay);
        };
    }, []);

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="voice-message" onClick={e => e.stopPropagation()}>
            <audio ref={audioRef} src={src} preload="metadata" style={{ display: 'none' }} />
            
            <button className="voice-play-btn" onClick={togglePlay}>
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            
            <div className="voice-content">
                <div className="voice-waveform" ref={progressRef} onClick={handleProgressClick}>
                    <div className="waveform-progress" style={{ width: `${progressPercentage}%` }}></div>
                    {waveformData.map((h, i) => (
                        <div key={i} className="waveform-bar" style={{ height: `${h * 100}%` }}></div>
                    ))}
                </div>
                <div className="voice-time">
                    {formatTime(isPlaying ? currentTime : duration)}
                </div>
            </div>
        </div>
    );
};

export default VoicePlayer;