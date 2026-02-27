/* @source src/store/musicStore.js */
import { create } from 'zustand';

const audio = new Audio();

export const useMusicStore = create((set, get) => ({
    currentTrack: null,
    playlist: [],
    isPlaying: false,
    progress: 0,
    duration: 0,

    togglePlay: () => {
        const { isPlaying } = get();
        if (!audio.src) return;
        
        if (isPlaying) {
            audio.pause();
            set({ isPlaying: false });
        } else {
            
            audio.play().then(() => {
                set({ isPlaying: true });
            }).catch(e => {
                console.error("Play error:", e);
                set({ isPlaying: false });
            });
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
        
        set({ currentTrack: track, isPlaying: true, progress: 0 });
        audio.src = track.src;
        
        audio.play().catch(e => {
            console.error("Play error (new track):", e);
            set({ isPlaying: false });
        });
    },

    nextTrack: () => {
        const { playlist, currentTrack, playTrack } = get();
        const index = playlist.findIndex(t => t.id === currentTrack?.id);
        if (index !== -1 && index < playlist.length - 1) {
            playTrack(playlist[index + 1], playlist);
        }
    },

    prevTrack: () => {
        const { playlist, currentTrack, playTrack } = get();
        const index = playlist.findIndex(t => t.id === currentTrack?.id);
        if (index > 0) {
            playTrack(playlist[index - 1], playlist);
        }
    },

    seek: (val) => {
        if (isFinite(val)) {
            audio.currentTime = val;
        }
    }
}));


audio.addEventListener('timeupdate', () => useMusicStore.setState({ progress: audio.currentTime }));
audio.addEventListener('loadedmetadata', () => useMusicStore.setState({ duration: audio.duration }));
audio.addEventListener('ended', () => useMusicStore.getState().nextTrack());


audio.addEventListener('error', (e) => {
    console.error("Audio network/loading error:", audio.error);
    useMusicStore.setState({ isPlaying: false });
    
    
    if (window.ItdApp?.hooks?.useIsland) {
        const { showIslandAlert } = window.ItdApp.hooks.useIsland();
        showIslandAlert('error', 'Ошибка загрузки трека (Сеть)', '🚫');
    }
});