/* @source GlobalPlayer.jsx */
import React, { useState, useEffect, useMemo } from 'react';
import { useMusic } from '../context/MusicContext';
import { PlayIcon, PauseIcon } from './icons/MediaIcons';
import '../styles/GlobalPlayer.css';

const GlobalPlayer = () => {
    const { currentTrack, isPlaying, togglePlay, nextTrack, prevTrack, progress, duration, seek } = useMusic();
    
    
    const [colors, setColors] = useState(['#15202b', '#1e2732', '#15202b', '#1e2732', '#101214']);

    useEffect(() => {
        if (!currentTrack?.cover) {
            setColors(['#15202b', '#1e2732', '#15202b', '#1e2732', '#101214']);
            return;
        }

        const img = new Image();
        
        img.crossOrigin = "anonymous"; 
        img.src = currentTrack.cover;
        
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                canvas.width = 10; 
                canvas.height = 10;
                ctx.drawImage(img, 0, 0, 10, 10);

                const data = ctx.getImageData(0, 0, 10, 10).data;
                const newColors = [];
                
                for (let i = 0; i < 5; i++) {
                    const idx = i * 20 * 4;
                    newColors.push(`rgb(${data[idx]}, ${data[idx+1]}, ${data[idx+2]})`);
                }
                setColors(newColors);
            } catch (e) {
                console.warn("CORS error: using theme colors", e);
                
                const primary = getComputedStyle(document.documentElement).getPropertyValue('--color-primary');
                setColors([primary, '#15202b', primary, '#101214', '#15202b']);
            }
        };
    }, [currentTrack?.cover]);

    const formatTime = (t) => {
        if (!t) return "0:00";
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (!currentTrack) return null;

    return (
        <div 
            className={`gp-widget ${isPlaying ? 'playing' : ''}`}
            style={{
                '--c1': colors[0], '--c2': colors[1], 
                '--c3': colors[2], '--c4': colors[3], '--c5': colors[4]
            }}
        >
            {}
            <div className="gp-background">
                <div className="gp-blob b1"></div>
                <div className="gp-blob b2"></div>
                <div className="gp-blob b3"></div>
            </div>

            <div className="gp-inner">
                {}
                <div className="gp-info-side">
                    <div className="gp-cover">
                        {currentTrack.cover ? <img src={currentTrack.cover} alt="" /> : <span>♪</span>}
                    </div>
                    <div className="gp-text">
                        <span className="gp-name">{currentTrack.title}</span>
                        <span className="gp-author">{currentTrack.artist}</span>
                    </div>
                </div>

                {}
                <div className="gp-controls">
                    <button onClick={prevTrack} className="gp-btn-small">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                    </button>
                    <button onClick={togglePlay} className="gp-btn-main">
                        {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} style={{marginLeft: 2}} />}
                    </button>
                    <button onClick={nextTrack} className="gp-btn-small">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                    </button>
                </div>
            </div>

            {}
            <div className="gp-progress-area">
                <span className="gp-time">{formatTime(progress)}</span>
                <div className="gp-track" onClick={(e) => seek((e.nativeEvent.offsetX / e.currentTarget.offsetWidth) * duration)}>
                    <div className="gp-fill" style={{ width: `${(progress / duration) * 100}%` }} />
                </div>
                <span className="gp-time">{formatTime(duration)}</span>
            </div>
        </div>
    );
};

export default GlobalPlayer;