import React, { useState, useEffect, useCallback } from 'react';

const CustomBackground = () => {
    const [settings, setSettings] = useState({
        url: localStorage.getItem('itd_bg_custom_url') || '',
        blur: localStorage.getItem('itd_bg_custom_blur') || '0',
        opacity: localStorage.getItem('itd_bg_custom_opacity') || '100',
        brightness: localStorage.getItem('itd_bg_custom_brightness') || '100',
    });

    const update = useCallback(() => {
        const url = localStorage.getItem('itd_bg_custom_url') || '';
        setSettings({
            url,
            blur: localStorage.getItem('itd_bg_custom_blur') || '0',
            opacity: localStorage.getItem('itd_bg_custom_opacity') || '100',
            brightness: localStorage.getItem('itd_bg_custom_brightness') || '100',
        });
        
        
        if (url) {
            document.documentElement.setAttribute('data-has-custom-bg', 'true');
        } else {
            document.documentElement.removeAttribute('data-has-custom-bg');
        }
    }, []);

    useEffect(() => {
        update();
        window.addEventListener('settingsUpdate', update);
        return () => window.removeEventListener('settingsUpdate', update);
    }, [update]);

    if (!settings.url) return null;

    return (
        <div className="global-custom-bg">
            <div 
                className="bg-image-layer"
                style={{
                    backgroundImage: `url(${settings.url})`,
                    filter: `blur(${settings.blur}px) brightness(${settings.brightness}%)`,
                    opacity: settings.opacity / 100
                }}
            />
        </div>
    );
};

export default CustomBackground;