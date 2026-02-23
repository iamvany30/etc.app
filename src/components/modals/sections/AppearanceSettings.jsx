/* @source src/components/modals/sections/AppearanceSettings.jsx */
import React, { useState, useEffect } from 'react';
import { useAppearanceStore } from '../../../store/appearanceStore'; 
import { FontLoader } from '../../../core/FontLoader';
import { IconCheck, IconInfo } from '../../icons/SettingsIcons';
import { IconDownload, IconTrash, IconPalette } from '../../icons/ThemeIcons';
import { TrashBinTrash, Folder } from "@solar-icons/react";
import { SettingsSkeleton } from '../../Skeletons';
import ConfirmActionModal from '../ConfirmActionModal';
import { useModalStore } from '../../../store/modalStore';
import '../../../styles/settings/Appearance.css';

const AppearanceSettings = ({ setStatus, reopenModal }) => {
    
    const {
        iconStyle, setIconStyle,
        fontFamily, setFontFamily,
        emojiFamily, setEmojiFamily
    } = useAppearanceStore();

    const openModal = useModalStore(state => state.openModal);

    const [loadingConfigs, setLoadingConfigs] = useState(true);

    const [bg, setBg] = useState('dim');
    const [accent, setAccent] = useState('#1d9bf0');
    const [snow, setSnow] = useState(false);
    const [perf, setPerf] = useState('high');

    const [availableFonts, setAvailableFonts] = useState([]);
    const [localFiles, setLocalFiles] = useState([]);
    const [loadingFonts, setLoadingFonts] = useState(true);
    const [processingFontId, setProcessingFontId] = useState(null);

    const [bgSettings, setBgSettings] = useState({
        type: 'none', url: '', blur: '0', opacity: '100', 
        brightness: '100', vignette: '20', grain: false, pauseWhenUnfocused: true
    });

    const accentColors = ['#1d9bf0', '#794bc4', '#f91880', '#ff7a00', '#00ba7c', '#aab8c2'];

    useEffect(() => {
        setBg(localStorage.getItem('nowkie_bg') || 'dim');
        setAccent(localStorage.getItem('nowkie_accent') || '#1d9bf0');
        setSnow(localStorage.getItem('nowkie_snow_enabled') === 'true');
        setPerf(localStorage.getItem('nowkie_perf_mode') || 'high');

        setBgSettings({
            type: localStorage.getItem('itd_bg_type') || 'none',
            url: localStorage.getItem('itd_bg_url') || '',
            blur: localStorage.getItem('itd_bg_blur') || '0',
            opacity: localStorage.getItem('itd_bg_opacity') || '100',
            brightness: localStorage.getItem('itd_bg_brightness') || '100',
            vignette: localStorage.getItem('itd_bg_vignette') || '20',
            grain: localStorage.getItem('itd_bg_grain') === 'true',
            pauseWhenUnfocused: localStorage.getItem('itd_bg_video_pause') !== 'false'
        });

        setLoadingConfigs(false);
    }, []);

    const updateSetting = (key, value) => {
        localStorage.setItem(key, String(value));
        window.dispatchEvent(new Event('settingsUpdate'));
    };

    const updateBgSetting = (key, value) => {
        setBgSettings(prev => ({ ...prev, [key]: value }));
        localStorage.setItem(`itd_bg_${key}`, String(value));
        window.dispatchEvent(new Event('settingsUpdate'));
    };

    const handleBgTypeChange = (type) => {
        if (type === 'none') updateBgSetting('url', '');
        updateBgSetting('type', type);
    };

    const clearCustomBg = () => {
        updateBgSetting('url', '');
        updateBgSetting('type', 'none');
    };

    const handleUploadWallpaper = async () => {
        if (window.api?.invoke) {
            const result = await window.api.invoke('app:upload-wallpaper');
            if (result.success) {
                updateBgSetting('type', result.type);
                updateBgSetting('url', result.url);
            } else if (result.reason !== 'cancelled') {
                alert(`Ошибка загрузки файла: ${result.error}`);
            }
        }
    };

    useEffect(() => {
        const loadFonts = async () => {
            setLoadingFonts(true);
            try {
                if (window.api) {
                    const remote = await window.api.invoke('fonts:get-remote');
                    const local = await window.api.invoke('fonts:get-local');
                    setAvailableFonts(Array.isArray(remote) ? remote : []);
                    setLocalFiles(Array.isArray(local) ? local : []);
                }
            } catch (e) { console.error("Failed to load font lists:", e); }
            finally { setLoadingFonts(false); }
        };
        loadFonts();
    }, []);

    const isDownloaded = (font) => localFiles.some(f => f.startsWith(`${font.id}.`));

    const handleFontAction = async (id, actionFn, onCompleteFn) => {
        setProcessingFontId(id);
        try {
            const res = await actionFn();
            if (res && (res.success || res.success === undefined && !res.error)) {
                const newLocalFiles = await window.api.invoke('fonts:get-local');
                setLocalFiles(newLocalFiles);
                if (onCompleteFn) await onCompleteFn();
            } else { alert(`Ошибка шрифта: ${res?.error || "Неизвестная ошибка"}`); }
        } catch (err) { console.error(err); }
        finally { setProcessingFontId(null); }
    };
    
    const handleFontSelect = async (fontId, type) => {
        if (type === 'text') setFontFamily(fontId);
        else if (type === 'emoji') setEmojiFamily(fontId);
        
        await FontLoader.init();
    };

    const handleDownloadFont = (e, font) => { 
        e.stopPropagation(); 
        handleFontAction(font.id, () => window.api.invoke('fonts:download', font), () => handleFontSelect(font.id, font.type)); 
    };

    const handleDeleteFont = (e, font) => { 
        e.stopPropagation(); 
        openModal(
            <ConfirmActionModal 
                title={`Удалить шрифт "${font.name}"?`}
                message="Файл шрифта будет удален с устройства. В любой момент его можно будет скачать заново."
                confirmText="Удалить"
                onConfirm={() => {
                    reopenModal();
                    handleFontAction(font.id, () => window.api.invoke('fonts:delete', { id: font.id }), () => { 
                        const current = font.type === 'text' ? fontFamily : emojiFamily; 
                        if (current === font.id) handleFontSelect('system', font.type); 
                    });
                }}
                onCancel={reopenModal}
            />
        );
    };
    
    const handleBgChange = (mode) => { setBg(mode); updateSetting('nowkie_bg', mode); };
    const handleAccentChange = (color) => { setAccent(color); updateSetting('nowkie_accent', color); };
    const handleSnowToggle = () => { const next = !snow; setSnow(next); updateSetting('nowkie_snow_enabled', next); };
    const handlePerfToggle = () => { const next = perf === 'high' ? 'low' : 'high'; setPerf(next); updateSetting('nowkie_perf_mode', next); };
    
    const renderFontCard = (font, type) => {
        const currentSelection = type === 'text' ? fontFamily : emojiFamily;
        const downloaded = isDownloaded(font);
        const isActive = currentSelection === font.id;
        const isProcessing = processingFontId === font.id;
        return (
            <div key={font.id} className={`font-card ${isActive ? 'active' : ''}`} onClick={() => downloaded && handleFontSelect(font.id, type)} style={{ opacity: downloaded ? 1 : 0.8 }}>
                <div className="font-card-header">
                    <span className="font-card-name">{font.name}</span>
                    <div className="font-actions">
                        {isProcessing ? <span className="spinner-mini"></span> : !downloaded ? (
                            <button className="mini-btn download" onClick={(e) => handleDownloadFont(e, font)} title="Скачать"><IconDownload size={16} /></button>
                        ) : (
                            <>
                                {isActive && <span className="active-check"><IconCheck /></span>}
                                <button className="mini-btn delete" onClick={(e) => handleDeleteFont(e, font)} title="Удалить"><IconTrash size={14} /></button>
                            </>
                        )}
                    </div>
                </div>
                <div className="font-card-preview" style={font.type === 'emoji' ? {fontFamily: 'var(--font-emoji)', letterSpacing: '2px'} : {}}>
                    {font.type === 'emoji' ? (font.previewText || "😀🚀🔥👍") : (font.previewText || "Aa Bb Cc")}
                </div>
            </div>
        );
    };

    if (loadingConfigs) return <SettingsSkeleton count={5} />;

    return (
        <div className="settings-content">
            <div className="settings-section-title">Шрифт интерфейса</div>
            <div className="font-list-grid">
                <div className={`font-card ${fontFamily === 'system' ? 'active' : ''}`} onClick={() => handleFontSelect('system', 'text')}>
                    <div className="font-card-header">
                        <span className="font-card-name">Системный</span>
                        {fontFamily === 'system' && <span className="active-check"><IconCheck /></span>}
                    </div>
                    <div className="font-card-preview" style={{fontFamily: 'sans-serif'}}>Aa Bb Cc</div>
                </div>
                {loadingFonts ? <div>Загрузка...</div> : availableFonts.filter(f => f.type === 'text').map(font => renderFontCard(font, 'text'))}
            </div>
            
            <div className="settings-section-title">Шрифт смайликов</div>
            <div className="font-list-grid">
                <div className={`font-card ${emojiFamily === 'system' ? 'active' : ''}`} onClick={() => handleFontSelect('system', 'emoji')}>
                    <div className="font-card-header">
                        <span className="font-card-name">Системные</span>
                        {emojiFamily === 'system' && <span className="active-check"><IconCheck /></span>}
                    </div>
                    <div className="font-card-preview" style={{letterSpacing: '2px'}}>👍🎉🚀</div>
                </div>
                {loadingFonts ? <div>Загрузка...</div> : availableFonts.filter(f => f.type === 'emoji').map(font => renderFontCard(font, 'emoji'))}
            </div>
            
            <div className="settings-section-title">Стиль иконок</div>
            <div className="icon-style-selector">
                {[{ id: 'linear', label: 'Тонкие' }, { id: 'bold', label: 'Жирные' }, { id: 'broken', label: 'Штрих' }, { id: 'bulk', label: 'Двутон' }, { id: 'outline', label: 'Контур' }].map(style => (
                    <button key={style.id} className={`icon-style-btn ${iconStyle === style.id ? 'active' : ''}`} onClick={() => setIconStyle(style.id)}>
                        <div style={{ marginBottom: 6, pointerEvents: 'none', display: 'flex', justifyContent: 'center' }}>
                            <IconPalette variant={style.id} size={24} />
                        </div>
                        {style.label}
                    </button>
                ))}
            </div>
            
            <div className="settings-section-title">Цвет акцента</div>
            <div className="color-picker-grid">
                {accentColors.map(c => (
                    <div key={c} className={`color-swatch ${accent === c ? 'active' : ''}`} style={{ backgroundColor: c }} onClick={() => handleAccentChange(c)}>
                        {accent === c && <IconCheck />}
                    </div>
                ))}
            </div>
            
            <div className="settings-section-title">Тема</div>
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

            <div className="settings-section-title">Обои</div>
            <div className="custom-bg-section">
                <div className="bg-type-selector">
                    <button className={bgSettings.type === 'none' ? 'active' : ''} onClick={() => handleBgTypeChange('none')}>Нет</button>
                    <button className={bgSettings.type === 'image' ? 'active' : ''} onClick={() => handleBgTypeChange('image')}>Изображение</button>
                    <button className={bgSettings.type === 'video' ? 'active' : ''} onClick={() => handleBgTypeChange('video')}>Видео</button>
                </div>

                {bgSettings.type !== 'none' && (
                    <div className="bg-settings-panel">
                        <div className="bg-preview-box" style={bgSettings.url && bgSettings.type === 'image' ? {backgroundImage: `url("${bgSettings.url}")`} : {}}>
                            {bgSettings.url && bgSettings.type === 'video' && <video key={bgSettings.url} src={bgSettings.url} autoPlay muted loop playsInline style={{width: '100%', height: '100%', objectFit: 'cover'}}/>}
                            {!bgSettings.url && <span>Нет фона</span>}
                            {bgSettings.url && <button className="bg-delete-overlay" onClick={clearCustomBg} title="Удалить фон"><TrashBinTrash variant="outline" size={20} /></button>}
                        </div>
                        
                        <div className="bg-input-group">
                            <input 
                                className="form-input" 
                                type="text" 
                                placeholder={bgSettings.type === 'image' ? "URL изображения..." : "URL видео (mp4, webm)..."} 
                                value={bgSettings.url.startsWith('file:') ? 'Локальный файл' : bgSettings.url} 
                                onChange={e => updateBgSetting('url', e.target.value)}
                                readOnly={bgSettings.url.startsWith('file:')}
                            />
                            <button className="upload-pc-btn" onClick={handleUploadWallpaper} title="Загрузить с компьютера">
                                <Folder size={20} />
                            </button>
                        </div>
                        
                        <div className="slider-group"><div className="slider-header"><span>Размытие</span><span>{bgSettings.blur}px</span></div><input type="range" min="0" max="60" value={bgSettings.blur} onChange={e => updateBgSetting('blur', e.target.value)} /></div>
                        <div className="slider-group"><div className="slider-header"><span>Прозрачность</span><span>{bgSettings.opacity}%</span></div><input type="range" min="10" max="100" value={bgSettings.opacity} onChange={e => updateBgSetting('opacity', e.target.value)} /></div>
                        <div className="slider-group"><div className="slider-header"><span>Яркость</span><span>{bgSettings.brightness}%</span></div><input type="range" min="20" max="150" value={bgSettings.brightness} onChange={e => updateBgSetting('brightness', e.target.value)} /></div>
                        <div className="slider-group"><div className="slider-header"><span>Виньетка</span><span>{bgSettings.vignette}%</span></div><input type="range" min="0" max="80" value={bgSettings.vignette} onChange={e => updateBgSetting('vignette', e.target.value)} /></div>
                        
                        <div className="settings-option compact" onClick={() => updateBgSetting('grain', !bgSettings.grain)}>
                            <div className="settings-option-info">
                                <span className="settings-option-name">Эффект зерна</span>
                            </div>
                            <button className={`toggle-switch ${bgSettings.grain ? 'active' : ''}`}><span className="toggle-thumb" /></button>
                        </div>
                        
                        {bgSettings.type === 'video' && (
                            <div className="settings-option compact" onClick={() => updateBgSetting('pauseWhenUnfocused', !bgSettings.pauseWhenUnfocused)}>
                                <div className="settings-option-info">
                                    <span className="settings-option-name">Пауза при неактивности</span>
                                    <span className="settings-option-desc">Экономит ресурсы системы</span>
                                </div>
                                <button className={`toggle-switch ${bgSettings.pauseWhenUnfocused ? 'active' : ''}`}><span className="toggle-thumb" /></button>
                            </div>
                        )}
                        <div className="bg-info"><IconInfo size={16}/><span>Прямые ссылки на видео могут не работать. Рекомендуется использовать видео с хостингов (например, Imgur).</span></div>
                    </div>
                )}
            </div>

            <div className="settings-section-title">Эффекты</div>
            <div className="settings-option" onClick={handlePerfToggle}>
                <div className="settings-option-left">
                    <div className="settings-icon">✨</div>
                    <div className="settings-option-info">
                        <span className="settings-option-name">Стеклянный интерфейс</span>
                        <span className="settings-option-desc">Размытие (Blur) панелей</span>
                    </div>
                </div>
                <button className={`toggle-switch ${perf === 'high' ? 'active' : ''}`}><span className="toggle-thumb" /></button>
            </div>
            
            <div className="settings-option" onClick={handleSnowToggle}>
                <div className="settings-option-left">
                    <div className="settings-icon">❄️</div>
                    <div className="settings-option-info">
                        <span className="settings-option-name">Снегопад</span>
                    </div>
                </div>
                <button className={`toggle-switch ${snow ? 'active' : ''}`}><span className="toggle-thumb" /></button>
            </div>
            
            <style>{`
                .font-list-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 0 24px 12px; }
                .font-card { background: var(--color-item-bg); border: 1px solid var(--color-border); border-radius: 12px; padding: 12px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; justify-content: space-between; min-height: 90px; }
                .font-card:hover { border-color: var(--color-text-secondary); }
                .font-card.active { border-color: var(--color-primary); background: rgba(var(--color-primary-rgb), 0.08); }
                .font-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                .font-card-name { font-size: 13px; font-weight: 700; color: var(--color-text); }
                .font-card-preview { font-size: 18px; color: var(--color-text); opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .font-actions { display: flex; align-items: center; gap: 4px; }
                .active-check { color: var(--color-primary); display: flex; }
                .mini-btn { background: transparent; border: none; padding: 4px; border-radius: 4px; cursor: pointer; display: flex; transition: background 0.2s; }
                .mini-btn.download { color: var(--color-text-secondary); }
                .mini-btn.download:hover { background: rgba(255,255,255,0.1); color: var(--color-primary); }
                .mini-btn.delete { color: var(--color-text-muted); opacity: 0; transition: opacity 0.2s; }
                .font-card:hover .mini-btn.delete { opacity: 1; }
                .mini-btn.delete:hover { background: rgba(244,33,46,0.1); color: #f4212e; }
                .spinner-mini { width: 14px; height: 14px; border: 2px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .settings-option.compact { padding: 10px 0; border: none; background: transparent; }
                .icon-style-selector { display: flex; gap: 8px; padding: 0 24px 12px; flex-wrap: wrap; }
                .icon-style-btn { flex: 1; min-width: 80px; padding: 10px; border-radius: 10px; border: 1px solid var(--color-border); background: transparent; color: var(--color-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; text-align: center; }
                .icon-style-btn:hover { background: var(--color-item-bg); color: var(--color-text); }
                .icon-style-btn.active { background: var(--color-text); color: var(--color-background); border-color: transparent; }
                .theme-selector-container { display: flex; gap: 10px; padding: 0 24px 16px; }
                .theme-bg-pills { flex: 1; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; cursor: pointer; border: 2px solid transparent; gap: 6px; transition: all 0.2s; }
                .theme-bg-pills.active { border-color: var(--color-primary); transform: scale(1.02); }
                .custom-bg-section { padding: 0 24px 24px; }
                .bg-type-selector { display: flex; background: var(--color-input-bg); border-radius: 12px; padding: 4px; margin-bottom: 16px; animation: settingsViewFadeIn 0.3s ease; }
                .bg-type-selector button { flex: 1; background: transparent; border: none; padding: 8px; border-radius: 8px; font-weight: 700; color: var(--color-text-secondary); cursor: pointer; transition: all 0.2s; }
                .bg-type-selector button.active { background: var(--color-card); color: var(--color-text); box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                .bg-settings-panel { display: flex; flex-direction: column; gap: 16px; background: var(--color-input-bg); border-radius: 20px; padding: 16px; animation: settingsViewFadeIn 0.4s ease 0.1s backwards; }
                .bg-preview-box { width: 100%; height: 120px; border-radius: 14px; background-size: cover; background-position: center; position: relative; border: 1px solid var(--color-border); display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); font-size: 13px; overflow: hidden; }
                .bg-delete-overlay { position: absolute; top: 8px; right: 8px; width: 36px; height: 36px; border-radius: 50%; background: rgba(244, 33, 46, 0.9); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; z-index: 5; }
                .bg-delete-overlay:hover { transform: scale(1.1); }
                .slider-group { display: flex; flex-direction: column; gap: 6px; }
                .slider-header { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
                .slider-group input[type="range"] { width: 100%; -webkit-appearance: none; appearance: none; height: 6px; background: var(--color-border); border-radius: 3px; outline: none; cursor: pointer; }
                .slider-group input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; background: #fff; border-radius: 50%; border: 2px solid var(--color-primary); box-shadow: 0 0 5px var(--color-primary); }
                .bg-info { display: flex; gap: 8px; align-items: flex-start; background: rgba(var(--color-primary-rgb), 0.05); color: var(--color-text-secondary); padding: 12px; border-radius: 12px; font-size: 12px; line-height: 1.5; }
                .bg-input-group { display: flex; gap: 8px; }
                .bg-input-group .form-input { flex-grow: 1; margin: 0; }
                .upload-pc-btn { flex-shrink: 0; width: 44px; height: 44px; border-radius: 12px; border: 1px solid var(--color-border); background: var(--color-card); color: var(--color-text); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
                .upload-pc-btn:hover { border-color: var(--color-primary); background: var(--color-primary-alpha); color: var(--color-primary); }
                .settings-option-left { display: flex; align-items: center; gap: 12px; }
                .settings-icon { font-size: 24px; }
            `}</style>
        </div>
    );
};

export default AppearanceSettings;