import React from 'react';
import { useMusic } from '../context/MusicContext';
import { PlayIcon, PauseIcon } from './icons/MediaIcons';
import '../styles/MusicPlayer.css';

const DownloadIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

const MusicPlayer = ({ id, src, artist, title, cover }) => {
    const { currentTrack, isPlaying, playTrack, togglePlay } = useMusic();
    const isThisTrackCurrent = currentTrack?.id === id;

    const handleDownload = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.api && window.api.downloadFile) window.api.downloadFile(src);
    };

    const handleToggle = (e) => {
        e.stopPropagation();
        if (isThisTrackCurrent) {
            togglePlay();
        } else {
            
            playTrack({ id, src, artist, title, cover }, [{ id, src, artist, title, cover }]);
        }
    };

    return (
        <div className="music-player" onClick={(e) => e.stopPropagation()}>
            <div style={{position: 'relative', width: 44, height: 44, marginRight: 12, flexShrink: 0}}>
                {cover ? (
                    <img src={cover} alt="art" style={{width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover'}} />
                ) : (
                    <div style={{width: '100%', height: '100%', borderRadius: 8, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                         
                         <span style={{color: 'white', fontWeight: 'bold'}}>{artist?.[0] || '♪'}</span>
                    </div>
                )}
                
                
                <button 
                    onClick={handleToggle}
                    className={`music-play-overlay ${isThisTrackCurrent && isPlaying ? 'playing' : ''}`}
                    style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', 
                        border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', cursor: 'pointer', transition: 'background 0.2s'
                    }}
                >
                    {isThisTrackCurrent && isPlaying ? <PauseIcon width="20" height="20" /> : <PlayIcon width="20" height="20" />}
                </button>
            </div>
            
            <div className="music-track-info">
                <span className="music-title">{title || 'Без названия'}</span>
                <span className="music-artist">{artist || 'Неизвестный'}</span>
            </div>

            <button className="music-download-btn" onClick={handleDownload} title="Скачать трек">
                <DownloadIcon />
            </button>
        </div>
    );
};

export default MusicPlayer;