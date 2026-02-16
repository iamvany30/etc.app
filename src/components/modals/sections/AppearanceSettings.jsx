
import React, { useState, useRef } from 'react';
import { IconCheck } from '../../icons/SettingsIcons';
import { TrashBinTrash } from "@solar-icons/react"; 

const AppearanceSettings = () => {
    
    const [bg, setBg] = useState(localStorage.getItem('nowkie_bg') || 'dim');
    const [accent, setAccent] = useState(localStorage.getItem('nowkie_accent') || '#1d9bf0');
    const [snow, setSnow] = useState(localStorage.getItem('nowkie_snow_enabled') === 'true');
    const [perf, setPerf] = useState(localStorage.getItem('nowkie_perf_mode') || 'high');

    
    const [customBg, setCustomBg] = useState(localStorage.getItem('itd_bg_custom_url') || '');
    const [blur, setBlur] = useState(localStorage.getItem('itd_bg_custom_blur') || '0');
    const [opacity, setOpacity] = useState(localStorage.getItem('itd_bg_custom_opacity') || '100');
    const [brightness, setBrightness] = useState(localStorage.getItem('itd_bg_custom_brightness') || '100');

    const fileInputRef = useRef(null);
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

    const handlePerf = () => {
        const next = perf === 'high' ? 'low' : 'high';
        setPerf(next);
        updateSetting('nowkie_perf_mode', next);
    };

    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("Файл слишком большой. Максимум 5MB для стабильной работы.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const url = ev.target.result;
            setCustomBg(url);
            updateSetting('itd_bg_custom_url', url);
        };
        reader.readAsDataURL(file);
    };

    const clearCustomBg = () => {
        setCustomBg('');
        localStorage.removeItem('itd_bg_custom_url');
        window.dispatchEvent(new Event('settingsUpdate'));
    };

    return (
        <div className="settings-content">
            {}
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

            {}
            <div className="settings-section-title">Тема приложения</div>
            <div className="theme-selector-container">
                <div onClick={() => handleBgChange('light')} className={`theme-bg-pills ${bg === 'light' ? 'active' : ''}`} style={{ background: '#ffffff', color: '#000' }}>
                    Светлая {bg === 'light' && <IconCheck size={14} />}
                </div>
                <div onClick={() => handleBgChange('dim')} className={`theme-bg-pills ${bg === 'dim' ? 'active' : ''}`} style={{ background: '#15202b', color: '#fff' }}>
                    Дим {bg === 'dim' && <IconCheck size={14} />}
                </div>
                <div onClick={() => handleBgChange('black')} className={`theme-bg-pills ${bg === 'black' ? 'active' : ''}`} style={{ background: '#000000', color: '#fff' }}>
                    Черная {bg === 'black' && <IconCheck size={14} />}
                </div>
            </div>

            {}
            <div className="settings-section-title">Обои интерфейса</div>
            <div className="custom-bg-section">
                {!customBg ? (
                    <button className="settings-save-btn" onClick={() => fileInputRef.current.click()}>
                        Установить своё изображение
                    </button>
                ) : (
                    <div className="custom-bg-editor">
                        <div className="bg-preview-box" style={{ backgroundImage: `url(${customBg})` }}>
                            <button className="bg-delete-overlay" onClick={clearCustomBg} title="Удалить фон">
                                {}
                                <TrashBinTrash variant="outline" size={20} />
                            </button>
                        </div>
                        
                        <div className="slider-group">
                            <div className="slider-header">
                                <span>Размытие</span>
                                <span>{blur}px</span>
                            </div>
                            <input type="range" min="0" max="60" value={blur} onChange={(e) => { setBlur(e.target.value); updateSetting('itd_bg_custom_blur', e.target.value); }} />
                        </div>

                        <div className="slider-group">
                            <div className="slider-header">
                                <span>Яркость</span>
                                <span>{brightness}%</span>
                            </div>
                            <input type="range" min="20" max="150" value={brightness} onChange={(e) => { setBrightness(e.target.value); updateSetting('itd_bg_custom_brightness', e.target.value); }} />
                        </div>

                        <div className="slider-group">
                            <div className="slider-header">
                                <span>Прозрачность фона</span>
                                <span>{opacity}%</span>
                            </div>
                            <input type="range" min="10" max="100" value={opacity} onChange={(e) => { setOpacity(e.target.value); updateSetting('itd_bg_custom_opacity', e.target.value); }} />
                        </div>
                    </div>
                )}
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
            </div>

            {}
            <div className="settings-section-title">Графика и эффекты</div>

            <div className="settings-option" onClick={handlePerf}>
                <div className="settings-option-left">
                    <div className="settings-icon">✨</div>
                    <div className="settings-option-info">
                        <span className="settings-option-name">Стеклянный интерфейс</span>
                        <span className="settings-option-desc">Эффекты размытия панелей (Blur)</span>
                    </div>
                </div>
                <button className={`toggle-switch ${perf === 'high' ? 'active' : ''}`} style={{backgroundColor: perf === 'high' ? accent : 'var(--color-border)'}}>
                    <span className="toggle-thumb" />
                </button>
            </div>

            <div className="settings-option" onClick={handleSnow}>
                <div className="settings-option-left">
                    <div className="settings-icon">❄️</div>
                    <div className="settings-option-info">
                        <span className="settings-option-name">Снегопад</span>
                        <span className="settings-option-desc">Анимированные частицы на фоне</span>
                    </div>
                </div>
                <button className={`toggle-switch ${snow ? 'active' : ''}`} style={{backgroundColor: snow ? accent : 'var(--color-border)'}}>
                    <span className="toggle-thumb" />
                </button>
            </div>

            <style>{`
                .theme-selector-container {
                    display: flex;
                    gap: 10px;
                    padding: 0 24px 16px;
                }
                .theme-bg-pills {
                    flex: 1;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                    border: 2px solid transparent;
                    gap: 6px;
                    transition: all 0.2s;
                }
                .theme-bg-pills.active {
                    border-color: var(--color-primary);
                    transform: scale(1.02);
                }
                
                .custom-bg-section {
                    padding: 0 24px 24px;
                }
                .custom-bg-editor {
                    background: var(--color-input-bg);
                    border: 1px solid var(--color-border);
                    border-radius: 20px;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .bg-preview-box {
                    width: 100%;
                    height: 120px;
                    border-radius: 14px;
                    background-size: cover;
                    background-position: center;
                    position: relative;
                    border: 1px solid var(--color-border);
                }
                .bg-delete-overlay {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: rgba(244, 33, 46, 0.9);
                    color: white;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s;
                }
                .bg-delete-overlay:hover { transform: scale(1.1); }
                
                .slider-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .slider-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    font-weight: 700;
                    color: var(--color-text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .slider-group input[type="range"] {
                    width: 100%;
                    accent-color: var(--color-primary);
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};

export default AppearanceSettings;