import React from 'react';
import { useMusic } from '../context/MusicContext';
import { PlayIcon, PauseIcon } from './icons/MediaIcons';
import '../styles/GlobalPlayer.css';

const GlobalPlayer = () => {
    const { currentTrack, isPlaying, togglePlay, nextTrack, prevTrack, progress, duration, seek } = useMusic();

    if (!currentTrack) return null;

    const formatTime = (time) => {
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <div className="global-player">
            <div className="gp-progress-container" onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                seek(pos * duration);
            }}>
                <div className="gp-progress-bar" style={{ width: `${(progress / duration) * 100}%` }} />
            </div>

            <div className="gp-inner">
                <div className="gp-info">
                    <div className="gp-avatar">
                        {currentTrack.cover ? (
                            <img src={currentTrack.cover} alt="art" className="gp-cover-img" />
                        ) : (
                            <span style={{fontSize: 18, fontWeight: 'bold', color: 'var(--color-text)'}}>
                                {currentTrack.artist[0]}
                            </span>
                        )}
                    </div>
                    <div className="gp-text">
                        <span className="gp-title">{currentTrack.title}</span>
                        <span className="gp-artist">{currentTrack.artist}</span>
                    </div>
                </div>

                <div className="gp-controls">
                    <button onClick={prevTrack} className="gp-btn">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                    </button>
                    <button onClick={togglePlay} className="gp-play-btn">
                        {isPlaying ? <PauseIcon width="20" height="20" /> : <PlayIcon width="20" height="20" />}
                    </button>
                    <button onClick={nextTrack} className="gp-btn">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                    </button>
                </div>

                <div className="gp-time">
                    {formatTime(progress)} / {formatTime(duration)}
                </div>
            </div>
        </div>
    );
};

export default GlobalPlayer;