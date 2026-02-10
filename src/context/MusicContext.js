import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [playlist, setPlaylist] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(new Audio());

    const playTrack = (track, newPlaylist = []) => {
        if (currentTrack?.id === track.id) {
            togglePlay();
            return;
        }

        if (newPlaylist.length > 0) setPlaylist(newPlaylist);
        
        setCurrentTrack(track);
        audioRef.current.src = track.src;
        audioRef.current.play();
        setIsPlaying(true);
    };

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            if (audioRef.current.src) audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const nextTrack = () => {
        const index = playlist.findIndex(t => t.id === currentTrack?.id);
        if (index !== -1 && index < playlist.length - 1) {
            playTrack(playlist[index + 1]);
        }
    };

    const prevTrack = () => {
        const index = playlist.findIndex(t => t.id === currentTrack?.id);
        if (index > 0) {
            playTrack(playlist[index - 1]);
        }
    };

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
    }, [playlist, currentTrack]);

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