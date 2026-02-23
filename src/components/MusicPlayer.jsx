/* @source src/components/MusicPlayer.jsx */
import React, { useMemo } from 'react';
import { useMusicStore } from '../store/musicStore';       
import { useDownloadStore } from '../store/downloadStore'; 
import { PlayIcon, PauseIcon } from './icons/MediaIcons';
import { MusicDownloadIcon, MusicCheckIcon } from './icons/CustomIcons';
import '../styles/MusicPlayer.css';

const CircularProgress = ({ progress, size = 20, strokeWidth = 2 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            <circle stroke="rgba(255, 255, 255, 0.2)" fill="transparent" strokeWidth={strokeWidth} r={radius} cx={size / 2} cy={size / 2} />
            <circle stroke="currentColor" fill="transparent" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" r={radius} cx={size / 2} cy={size / 2} />
        </svg>
    );
};

const Visualizer = () => (
    <div className="music-visualizer"><div className="bar"></div><div className="bar"></div><div className="bar"></div><div className="bar"></div></div>
);

const MusicPlayer = ({ id, src, artist, title, cover }) => {
    
    const currentTrack = useMusicStore(state => state.currentTrack);
    const isPlaying = useMusicStore(state => state.isPlaying);
    const progress = useMusicStore(state => state.progress);
    const duration = useMusicStore(state => state.duration);
    const playTrack = useMusicStore(state => state.playTrack);
    const togglePlay = useMusicStore(state => state.togglePlay);
    const seek = useMusicStore(state => state.seek);

    
    const downloads = useDownloadStore(state => state.downloads);
    const startDownload = useDownloadStore(state => state.startDownload);

    const isCurrent = currentTrack?.id === id;
    const isActive = isCurrent && isPlaying;

    const downloadState = downloads[src];
    const isDownloading = downloadState && downloadState.status !== 'completed' && downloadState.status !== 'failed';
    const isCompleted = downloadState && downloadState.status === 'completed';

    const formatTime = (t) => {
        if (!t && t !== 0) return '0:00';
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handlePlay = (e) => {
        e.stopPropagation();
        if (isCurrent) {
            togglePlay();
        } else {
            playTrack({ id, src, artist, title, cover }, [{ id, src, artist, title, cover }]);
        }
    };

    const handleSeek = (e) => {
        e.stopPropagation();
        if (!isCurrent || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        seek(percent * duration);
    };

    const handleDownload = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDownloading || isCompleted) return;
        startDownload(src);
    };

    return (
        <div className={`music-card-premium ${isActive ? 'playing' : ''}`}>
            <div className="music-card-bg" style={{ backgroundImage: `url(${cover || ''})` }} />
            
            <div className="music-card-content" onClick={(e) => e.stopPropagation()}>
                <div className="music-cover-wrapper" onClick={handlePlay}>
                    {cover ? (
                        <img src={cover} alt={title} className="music-cover-img" />
                    ) : (
                        <div className="music-cover-placeholder"><span>♪</span></div>
                    )}
                    <div className="music-play-overlay">
                        {isActive ? <PauseIcon width="24" height="24"/> : <PlayIcon width="24" height="24"/>}
                    </div>
                </div>

                <div className="music-info">
                    <div className="music-text-row">
                        <span className="music-title" title={title}>{title || 'Без названия'}</span>
                        {isActive && <Visualizer />}
                    </div>
                    <span className="music-artist" title={artist}>{artist || 'Неизвестный'}</span>
                    
                    {isCurrent && (
                        <div className="music-mini-progress">
                            <span className="time-curr">{formatTime(progress)}</span>
                            <div className="progress-track" onClick={handleSeek}>
                                <div className="progress-fill" style={{ width: `${(progress / duration) * 100}%` }} />
                            </div>
                            <span className="time-dur">{formatTime(duration || 0)}</span>
                        </div>
                    )}
                </div>

                <button 
                    className={`music-action-btn download ${isCompleted ? 'completed' : ''}`}
                    onClick={handleDownload} 
                    title={isCompleted ? "Загружено" : "Скачать"} 
                    disabled={isDownloading || isCompleted}
                >
                    {isDownloading ? <CircularProgress progress={downloadState.percent} /> : isCompleted ? <MusicCheckIcon /> : <MusicDownloadIcon />}
                </button>
            </div>
        </div>
    );
};

export default MusicPlayer;