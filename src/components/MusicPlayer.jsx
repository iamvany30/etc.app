/* @source src/components/MusicPlayer.jsx */
import React, { useCallback } from 'react';
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


const TrackProgressBar = ({ isCurrent }) => {
    const progress = useMusicStore(state => state.progress);
    const duration = useMusicStore(state => state.duration);
    const seek = useMusicStore(state => state.seek);

    if (!isCurrent) return null;

    const handleSeek = (e) => {
        e.stopPropagation();
        if (!duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        seek(percent * duration);
    };

    const formatTime = (t) => {
        if (!t && t !== 0) return '0:00';
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="music-mini-progress">
            <span className="time-curr">{formatTime(progress)}</span>
            <div className="progress-track" onClick={handleSeek}>
                <div className="progress-fill" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
            </div>
            <span className="time-dur">{formatTime(duration || 0)}</span>
        </div>
    );
};


const TrackDownloadButton = ({ src }) => {
    
    const downloadState = useDownloadStore(useCallback(state => state.downloads[src], [src]));
    const startDownload = useDownloadStore(state => state.startDownload);

    const isDownloading = downloadState && downloadState.status !== 'completed' && downloadState.status !== 'failed';
    const isCompleted = downloadState && downloadState.status === 'completed';

    const handleDownload = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDownloading || isCompleted) return;
        startDownload(src);
    };

    return (
        <button 
            className={`music-action-btn download ${isCompleted ? 'completed' : ''}`}
            onClick={handleDownload} 
            title={isCompleted ? "Загружено" : "Скачать"} 
            disabled={isDownloading || isCompleted}
        >
            {isDownloading ? <CircularProgress progress={downloadState.percent} /> : isCompleted ? <MusicCheckIcon /> : <MusicDownloadIcon />}
        </button>
    );
};

const MusicPlayer = ({ id, src, artist, title, cover }) => {
    
    const currentTrackId = useMusicStore(state => state.currentTrack?.id);
    const isPlaying = useMusicStore(state => state.isPlaying);
    const playTrack = useMusicStore(state => state.playTrack);
    const togglePlay = useMusicStore(state => state.togglePlay);

    const isCurrent = currentTrackId === id;
    const isActive = isCurrent && isPlaying;

    const handlePlay = (e) => {
        e.stopPropagation();
        if (isCurrent) {
            togglePlay();
        } else {
            playTrack({ id, src, artist, title, cover }, [{ id, src, artist, title, cover }]);
        }
    };

    return (
        <div className={`music-card-premium ${isActive ? 'playing' : ''}`}>
            <div className="music-card-bg" style={{ backgroundImage: `url(${cover || ''})` }} />
            
            <div className="music-card-content" onClick={(e) => e.stopPropagation()}>
                <div className="music-cover-wrapper" onClick={handlePlay}>
                    {cover ? (
                        <img 
                            src={cover} 
                            alt={title} 
                            className="music-cover-img" 
                            loading="lazy" 
                            decoding="async"
                        />
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
                    
                    <TrackProgressBar isCurrent={isCurrent} />
                </div>

                <TrackDownloadButton src={src} />
            </div>
        </div>
    );
};

export default MusicPlayer;