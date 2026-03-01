/* @source src/store/musicStore.js */
import { create } from 'zustand';
import { useIslandStore } from './islandStore';


const audio = new Audio();


const getCleanUrl = (url) => {
    if (!url) return '';
    if (typeof url !== 'string') return '';
    
    if (url.startsWith('file:') || url.startsWith('data:') || url.startsWith('blob:')) {
        return url;
    }

    if (url.startsWith('asset://')) {
        try {
            const urlObj = new URL(url);
            const originalUrlParam = urlObj.searchParams.get('url');
            if (originalUrlParam) {
                return decodeURIComponent(originalUrlParam);
            }
        } catch (e) {
            console.error("[MusicStore] URL parse error:", e);
        }
    }

    return url;
};


const updateSystemMediaSession = (track, isPlaying) => {
    if ('mediaSession' in navigator && track) {
        
        navigator.mediaSession.metadata = new window.MediaMetadata({
            title: track.title || 'Неизвестный трек',
            artist: track.artist || 'Неизвестный исполнитель',
            album: track.album || 'итд.app',
            artwork: track.cover ? [
                { src: track.cover, sizes: '96x96', type: 'image/png' },
                { src: track.cover, sizes: '128x128', type: 'image/png' },
                { src: track.cover, sizes: '256x256', type: 'image/png' },
                { src: track.cover, sizes: '512x512', type: 'image/png' },
            ] : []
        });

        
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
};

export const useMusicStore = create((set, get) => ({
    currentTrack: null,
    playlist: [],
    isPlaying: false,
    progress: 0,
    duration: 0,
    isBuffering: false,

    togglePlay: () => {
        const { isPlaying, currentTrack } = get();
        if (!audio.src) return;
        
        if (isPlaying) {
            audio.pause();
            set({ isPlaying: false });
            updateSystemMediaSession(currentTrack, false);
        } else {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        set({ isPlaying: true });
                        updateSystemMediaSession(currentTrack, true);
                    })
                    .catch(e => {
                        console.warn("[MusicStore] Play toggle error:", e);
                        set({ isPlaying: false });
                    });
            }
        }
    },

    playTrack: (track, newPlaylist = []) => {
        const state = get();
        
        
        if (state.currentTrack?.id === track.id) {
            state.togglePlay();
            return;
        }

        if (newPlaylist.length > 0) {
            set({ playlist: newPlaylist });
        }
        
        set({ 
            currentTrack: track, 
            isPlaying: false, 
            progress: 0, 
            duration: 0,
            isBuffering: true 
        });

        const cleanSrc = getCleanUrl(track.src);
        console.log(`[MusicStore] Playing: ${track.title} -> ${cleanSrc}`);

        audio.crossOrigin = "anonymous"; 
        audio.src = cleanSrc;
        audio.load();

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    set({ isPlaying: true, isBuffering: false });
                    updateSystemMediaSession(track, true);
                })
                .catch(e => {
                    if (e.name !== 'AbortError') {
                        console.error("[MusicStore] Initial play failed:", e);
                    }
                });
        }
    },

    nextTrack: () => {
        const { playlist, currentTrack, playTrack } = get();
        if (!currentTrack || playlist.length === 0) return;
        
        const index = playlist.findIndex(t => t.id === currentTrack.id);
        if (index !== -1 && index < playlist.length - 1) {
            playTrack(playlist[index + 1], playlist);
        }
    },

    prevTrack: () => {
        const { playlist, currentTrack, playTrack } = get();
        if (!currentTrack || playlist.length === 0) return;

        const index = playlist.findIndex(t => t.id === currentTrack.id);
        if (index > 0) {
            playTrack(playlist[index - 1], playlist);
        }
    },

    seek: (val) => {
        if (isFinite(val) && audio.duration) {
            audio.currentTime = val;
            set({ progress: val });
        }
    }
}));


if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => useMusicStore.getState().togglePlay());
    navigator.mediaSession.setActionHandler('pause', () => useMusicStore.getState().togglePlay());
    navigator.mediaSession.setActionHandler('previoustrack', () => useMusicStore.getState().prevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => useMusicStore.getState().nextTrack());
}


audio.addEventListener('timeupdate', () => {
    useMusicStore.setState({ progress: audio.currentTime });
});

audio.addEventListener('loadedmetadata', () => {
    useMusicStore.setState({ 
        duration: audio.duration || 0,
        isBuffering: false
    });
});

audio.addEventListener('waiting', () => {
    useMusicStore.setState({ isBuffering: true });
});

audio.addEventListener('canplay', () => {
    useMusicStore.setState({ isBuffering: false });
});

audio.addEventListener('ended', () => {
    useMusicStore.getState().nextTrack();
});


audio.addEventListener('error', (e) => {
    const error = audio.error;
    const src = audio.src;
    
    console.warn(`[MusicStore] Error ${error?.code}: ${error?.message}`);

    if (audio.crossOrigin === "anonymous") {
        console.log("[MusicStore] 🔄 Retrying without CORS...");
        
        const savedTime = audio.currentTime;
        audio.crossOrigin = null; 
        audio.removeAttribute('crossorigin');
        audio.src = src; 
        audio.load();
        audio.currentTime = savedTime;
        
        audio.play()
            .then(() => useMusicStore.setState({ isPlaying: true, isBuffering: false }))
            .catch(err => {
                console.error("[MusicStore] Retry failed:", err);
                useMusicStore.setState({ isPlaying: false, isBuffering: false });
                useIslandStore.getState().showIslandAlert('error', 'Не удалось воспроизвести трек', '🚫');
            });
            
        return; 
    }

    useMusicStore.setState({ isPlaying: false, isBuffering: false });
    
    if (error?.code === 4) {
        useIslandStore.getState().showIslandAlert('error', 'Неподдерживаемый формат аудио', '⚠️');
    } else {
        useIslandStore.getState().showIslandAlert('error', 'Ошибка сети при загрузке', '📡');
    }
});