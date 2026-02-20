const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'; 

class SoundEngine {
    constructor() {
        this.audio = new Audio(NOTIFICATION_SOUND_URL);
        this.audio.volume = 0.5;
        this.lastPlayTime = 0;
    }

    playNotification() {
        
        const now = Date.now();
        if (now - this.lastPlayTime < 1000) return;
        
        this.audio.currentTime = 0;
        this.audio.play().catch(e => console.warn("Звук заблокирован браузером", e));
        this.lastPlayTime = now;
    }
}

export const soundEngine = new SoundEngine();