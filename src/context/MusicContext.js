import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [playlist, setPlaylist] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(new Audio());

    const togglePlay = useCallback(() => {
        if (!audioRef.current.src) return; 
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.error("Play error:", e));
        }
        setIsPlaying(!isPlaying);
    }, [isPlaying]);

    const playTrack = useCallback((track, newPlaylist = []) => {
        if (currentTrack?.id === track.id) {
            togglePlay();
            return;
        }

        if (newPlaylist.length > 0) setPlaylist(newPlaylist);
        
        setCurrentTrack(track);
        audioRef.current.src = track.src;
        audioRef.current.play().catch(e => console.error("Play error:", e));
        setIsPlaying(true);
    }, [currentTrack, togglePlay]);

    const nextTrack = useCallback(() => {
        const index = playlist.findIndex(t => t.id === currentTrack?.id);
        if (index !== -1 && index < playlist.length - 1) {
            playTrack(playlist[index + 1], playlist);
        }
    }, [playlist, currentTrack, playTrack]);

    const prevTrack = useCallback(() => {
        const index = playlist.findIndex(t => t.id === currentTrack?.id);
        if (index > 0) {
            playTrack(playlist[index - 1], playlist);
        }
    }, [playlist, currentTrack, playTrack]);

    useEffect(() => {
        const audio = audioRef.current;
        const updateProgress = () => setProgress(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnd = () => nextTrack();

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnd);

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnd);
        };
    }, [nextTrack]);

    
    useEffect(() => {
        if (!window.api?.on) return;

        const unsubscribe = window.api.on('media-control', (command) => {
            console.log(`Media command received: ${command}`);
            switch (command) {
                case 'play-pause':
                    togglePlay();
                    break;
                case 'next':
                    nextTrack();
                    break;
                case 'prev':
                    prevTrack();
                    break;
                default:
                    break;
            }
        });
        
        return () => unsubscribe();
    }, [togglePlay, nextTrack, prevTrack]);
    

    return (
        <MusicContext.Provider value={{
            currentTrack, isPlaying, progress, duration, 
            playTrack, togglePlay, nextTrack, prevTrack,
            seek: (val) => audioRef.current.currentTime = val
        }}>
            {children}
        </MusicContext.Provider>
    );
};

export const useMusic = () => useContext(MusicContext);