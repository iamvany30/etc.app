import React, { useState } from 'react';
import { IconCheck } from '../SettingsIcons';  

const AppearanceSettings = () => {
     
    const [bg, setBg] = useState(localStorage.getItem('nowkie_bg') || 'dim');
    const [accent, setAccent] = useState(localStorage.getItem('nowkie_accent') || '#1d9bf0');
    const [snow, setSnow] = useState(localStorage.getItem('nowkie_snow_enabled') === 'true');

    const colors = ['#1d9bf0', '#794bc4', '#f91880', '#ff7a00', '#00ba7c', '#aab8c2'];

    const updateSetting = (key, value) => {
        localStorage.setItem(key, value);
        window.dispatchEvent(new Event('settingsUpdate'));
    };

    const handleBgChange = (mode) => {
        setBg(mode);
        updateSetting('nowkie_bg', mode);
    };

    const handleAccent = (color) => {
        setAccent(color);
        updateSetting('nowkie_accent', color);
    };

    const handleSnow = () => {
        const next = !snow;
        setSnow(next);
        updateSetting('nowkie_snow_enabled', next);
    };

    return (
        <div className="settings-content">
            { }
            <div className="settings-section-title">Цвет акцента</div>
            <div className="color-picker-grid">
                {colors.map(c => (
                    <div 
                        key={c} 
                        className={`color-swatch ${accent === c ? 'active' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => handleAccent(c)}
                    >
                        {accent === c && <IconCheck />}
                    </div>
                ))}
            </div>

            { }
            <div className="settings-section-title">Фон</div>
            <div style={{ 
                display: 'flex', 
                gap: '12px', 
                padding: '0 24px', 
                marginBottom: '24px' 
            }}>
                { }
                <div 
                    onClick={() => handleBgChange('light')}
                    style={{
                        flex: 1,
                        height: '80px',
                        background: '#ffffff',
                        border: `2px solid ${bg === 'light' ? accent : '#eff3f4'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0f1419',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                        transition: 'transform 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Светлый
                    {bg === 'light' && <div style={{marginLeft: 6, color: accent}}>●</div>}
                </div>

                { }
                <div 
                    onClick={() => handleBgChange('dim')}
                    style={{
                        flex: 1,
                        height: '80px',
                        background: '#15202b',
                        border: `2px solid ${bg === 'dim' ? accent : '#38444d'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#f7f9f9',
                        fontWeight: 'bold',
                        transition: 'transform 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Дим
                    {bg === 'dim' && <div style={{marginLeft: 6, color: accent}}>●</div>}
                </div>

                { }
                <div 
                    onClick={() => handleBgChange('black')}
                    style={{
                        flex: 1,
                        height: '80px',
                        background: '#000000',
                        border: `2px solid ${bg === 'black' ? accent : '#2f3336'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#e7e9ea',
                        fontWeight: 'bold',
                        transition: 'transform 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Темный
                    {bg === 'black' && <div style={{marginLeft: 6, color: accent}}>●</div>}
                </div>
            </div>

            { }
            <div className="settings-section-title">Эффекты</div>
            <div className="settings-option" onClick={handleSnow}>
                <div className="settings-option-left">
                    <div className="settings-icon" style={{backgroundColor: 'var(--color-item-bg)'}}>
                         ❄️
                    </div>
                    <div className="settings-option-info">
                        <span className="settings-option-name">Снегопад</span>
                        <span className="settings-option-desc">Анимация снега на фоне</span>
                    </div>
                </div>
                <button className={`toggle-switch ${snow ? 'active' : ''}`} style={{backgroundColor: snow ? accent : 'var(--color-border)'}}>
                    <span className="toggle-thumb" />
                </button>
            </div>
        </div>
    );
};

export default AppearanceSettings;