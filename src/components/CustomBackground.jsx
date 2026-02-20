import React, { useState, useEffect, useCallback, useRef } from 'react';

const CustomBackground = () => {
    const videoRef = useRef(null);
    const [settings, setSettings] = useState({
        type: 'none',
        url: '',
        blur: '0',
        opacity: '100',
        brightness: '100',
        vignette: '20', 
        grain: false,   
        pauseWhenUnfocused: true 
    });
    const [isLoaded, setIsLoaded] = useState(false);

    const updateSettings = useCallback(() => {
        const newSettings = {
            type: localStorage.getItem('itd_bg_type') || 'none',
            url: localStorage.getItem('itd_bg_url') || '',
            blur: localStorage.getItem('itd_bg_blur') || '0',
            opacity: localStorage.getItem('itd_bg_opacity') || '100',
            brightness: localStorage.getItem('itd_bg_brightness') || '100',
            vignette: localStorage.getItem('itd_bg_vignette') || '20',
            grain: localStorage.getItem('itd_bg_grain') === 'true',
            pauseWhenUnfocused: localStorage.getItem('itd_bg_video_pause') !== 'false'
        };
        
        
        if (newSettings.url !== settings.url) {
            setIsLoaded(false);
        }
        setSettings(newSettings);

        document.documentElement.setAttribute('data-has-custom-bg', newSettings.type !== 'none' && newSettings.url ? 'true' : 'false');
    }, [settings.url]);

    useEffect(() => {
        updateSettings();
        window.addEventListener('settingsUpdate', updateSettings);
        return () => window.removeEventListener('settingsUpdate', updateSettings);
    }, [updateSettings]);

    
    useEffect(() => {
        const handleFocus = ({ isFocused }) => {
            if (videoRef.current && settings.type === 'video' && settings.pauseWhenUnfocused) {
                isFocused ? videoRef.current.play().catch(()=>{}) : videoRef.current.pause();
            }
        };

        if (window.api?.on) {
            const unsubscribe = window.api.on('window-focus-state', handleFocus);
            return () => unsubscribe();
        }
    }, [settings.type, settings.pauseWhenUnfocused]);

    if (settings.type === 'none' || !settings.url) {
        return null;
    }

    const isVideo = settings.type === 'video';

    return (
        <div className="global-custom-bg">
            <div
                className={`bg-media-layer ${isLoaded ? 'loaded' : ''}`}
                style={{
                    filter: `blur(${settings.blur}px) brightness(${settings.brightness}%)`,
                    opacity: settings.opacity / 100
                }}
            >
                {isVideo ? (
                    <video
                        ref={videoRef}
                        key={settings.url}
                        src={settings.url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        onCanPlay={() => setIsLoaded(true)}
                        onError={() => setIsLoaded(false)}
                    />
                ) : (
                    <img
                        key={settings.url}
                        src={settings.url}
                        alt=""
                        onLoad={() => setIsLoaded(true)}
                        onError={() => setIsLoaded(false)}
                    />
                )}
            </div>
            <div className="bg-vignette-layer" style={{ opacity: settings.vignette / 100 }} />
            {settings.grain && <div className="bg-grain-layer" />}
        </div>
    );
};

export default CustomBackground;