/* @source src/components/GlobalPlayer.jsx */
import React, { useState, useEffect } from 'react';
import { useMusicStore } from '../store/musicStore';
import { PlayIcon, PauseIcon, PrevIcon, NextIcon } from './icons/MediaIcons';
import '../styles/GlobalPlayer.css';

const GlobalPlayer = () => {
    
    const currentTrack = useMusicStore(state => state.currentTrack);
    const isPlaying = useMusicStore(state => state.isPlaying);
    const progress = useMusicStore(state => state.progress);
    const duration = useMusicStore(state => state.duration);
    
    
    const togglePlay = useMusicStore(state => state.togglePlay);
    const nextTrack = useMusicStore(state => state.nextTrack);
    const prevTrack = useMusicStore(state => state.prevTrack);
    const seek = useMusicStore(state => state.seek);

    const [isDragging, setIsDragging] = useState(false);
    const [localProgress, setLocalProgress] = useState(0);

    
    useEffect(() => {
        if (!isDragging) setLocalProgress(progress);
    }, [progress, isDragging]);

    const formatTime = (t) => {
        if (!t) return "0:00";
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleSeekStart = () => setIsDragging(true);
    
    const handleSeekMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
        setLocalProgress(percent * duration);
    };

    const handleSeekEnd = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
        seek(percent * duration);
        setIsDragging(false);
    };

    if (!currentTrack) return null;

    const coverUrl = currentTrack.cover || ''; 

    return (
        <div 
            className={`gp-glass-card ${isPlaying ? 'playing' : ''}`}
            style={{ 
                '--cover-url': coverUrl ? `url(${coverUrl})` : 'none',
                '--fallback-gradient': 'linear-gradient(135deg, #1d9bf0, #794bc4)'
            }}
        >
            {}
            <div className="gp-glass-bg" />
            
            <div className="gp-glass-content">
                {}
                <div className="gp-main-row">
                    <div className="gp-track-info">
                        <div className="gp-cover-wrap">
                            {currentTrack.cover ? (
                                <img src={currentTrack.cover} alt="" className="gp-cover-img" />
                            ) : (
                                <div className="gp-cover-placeholder">♪</div>
                            )}
                            {}
                            {isPlaying && (
                                <div className="gp-mini-visualizer">
                                    <div className="bar"></div>
                                    <div className="bar"></div>
                                    <div className="bar"></div>
                                </div>
                            )}
                        </div>
                        <div className="gp-text-col">
                            <span className="gp-title">{currentTrack.title}</span>
                            <span className="gp-artist">{currentTrack.artist}</span>
                        </div>
                    </div>

                    <div className="gp-controls-row">
                        <button onClick={prevTrack} className="gp-ctrl-btn small">
                            <PrevIcon />
                        </button>
                        <button onClick={togglePlay} className="gp-ctrl-btn main">
                            {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} style={{marginLeft: 2}} />}
                        </button>
                        <button onClick={nextTrack} className="gp-ctrl-btn small">
                            <NextIcon />
                        </button>
                    </div>
                </div>

                {}
                <div className="gp-progress-container">
                    <span className="gp-time-text">{formatTime(localProgress)}</span>
                    <div 
                        className="gp-slider-track" 
                        onMouseDown={handleSeekStart}
                        onClick={handleSeekEnd}
                        onMouseMove={isDragging ? handleSeekMove : undefined}
                        onMouseUp={isDragging ? handleSeekEnd : undefined}
                        onMouseLeave={() => isDragging && setIsDragging(false)}
                    >
                        <div 
                            className="gp-slider-fill" 
                            style={{ width: `${duration ? (localProgress / duration) * 100 : 0}%` }} 
                        />
                        <div 
                            className="gp-slider-thumb"
                            style={{ left: `${duration ? (localProgress / duration) * 100 : 0}%` }} 
                        />
                    </div>
                    <span className="gp-time-text">{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    );
};

export default GlobalPlayer;