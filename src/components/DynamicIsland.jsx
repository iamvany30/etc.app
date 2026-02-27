/* @source src/components/DynamicIsland.jsx */
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useIslandStore } from '../store/islandStore';
import { useUploadStore } from '../store/uploadStore';
import { useDownloadStore } from '../store/downloadStore';
import { WifiOffIcon, CopyIslandIcon, UpdateIslandIcon } from './icons/CustomIcons';
import '../styles/DynamicIsland.css';



const MORPHER_CONFIG = {
    idle:          { height: 36, minWidth: 120 },
    offline:       { height: 48, minWidth: 200 },
    alert:         { height: 48, minWidth: 240 }, 
    update:        { height: 48, minWidth: 220 },
    download:      { height: 48, minWidth: 220 },
    upload:        { height: 48, minWidth: 220 },
    site_activity: { height: 48, minWidth: 240 }, 
};

const DynamicIsland = () => {
    const location = useLocation();
    
    const alert = useIslandStore(state => state.alert);
    const showIslandAlert = useIslandStore(state => state.showIslandAlert);
    const customColor = useIslandStore(state => state.customColor);
    const siteActivity = useIslandStore(state => state.siteActivity);
    
    const uploads = useUploadStore(state => state.uploads);
    const downloads = useDownloadStore(state => state.downloads);

    const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [updateProgress, setUpdateProgress] = useState(null);

    const [displayMode, setDisplayMode] = useState('idle');
    const [configMode, setConfigMode] = useState('idle'); 
    const [phase, setPhase] = useState('stable'); 
    const [isShaking, setIsShaking] = useState(false);
    
    const displayModeRef = useRef('idle'); 
    const debounceTimer  = useRef(null);
    const exitTimer      = useRef(null);
    const enterTimer     = useRef(null);
    const shakeTimer     = useRef(null);
    
    const activeUploads   = Object.values(uploads).filter(u => u.status !== 'complete' && u.status !== 'error');
    const activeDownloads = Object.values(downloads).filter(d => d.status === 'progressing' || d.status === 'starting');

    const targetMode = useMemo(() => {
        if (isOffline) return 'offline';
        if (alert)     return 'alert';
        if (updateProgress)           return 'update';
        if (activeDownloads.length > 0) return 'download';
        if (activeUploads.length > 0)   return 'upload';
        if (siteActivity)               return 'site_activity'; 
        return 'idle';
    }, [alert, activeDownloads, activeUploads, isOffline, updateProgress, siteActivity]);
    
    
    useEffect(() => {
        const incoming = targetMode;
        
        clearTimeout(debounceTimer.current);

        if (incoming === displayModeRef.current) return;
        
        debounceTimer.current = setTimeout(() => {
            if (incoming === displayModeRef.current) return; 

            
            setConfigMode(incoming); 
            setPhase('exiting');
            
            clearTimeout(exitTimer.current);
            
            exitTimer.current = setTimeout(() => {
                
                displayModeRef.current = incoming;
                setDisplayMode(incoming);
                setPhase('entering');
                
                clearTimeout(enterTimer.current);
                enterTimer.current = setTimeout(() => { 
                    
                    setPhase('stable'); 
                }, 300); 
            }, 150); 
        }, 50); 
    }, [targetMode]); 

    
    useEffect(() => {
        if (alert?.type === 'error') {
            setIsShaking(true);
            clearTimeout(shakeTimer.current);
            shakeTimer.current = setTimeout(() => setIsShaking(false), 500);
        }
    }, [alert]);

    
    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }, 10000);
        return () => clearInterval(timer);
    }, []);

    
    useEffect(() => {
        const handleOnline  = () => { setIsOffline(false); showIslandAlert('success', 'Сеть восстановлена', 'ok', 2000); };
        const handleOffline = () => setIsOffline(true);
        const handleApp     = (e) => setIsOffline(e.detail === 'offline');
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('app-network-status', handleApp);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('app-network-status', handleApp);
        };
    }, [showIslandAlert]);

    useEffect(() => {
        if (!window.api?.on) return;
        const removeProgress   = window.api.on('app-update-progress',   (data) => setUpdateProgress({ percent: Math.round(data.percent) }));
        const removeDownloaded = window.api.on('app-update-downloaded', () => {
            setUpdateProgress(null);
            showIslandAlert('success', 'Обновление готово', '🚀');
        });
        return () => { removeProgress?.(); removeDownloaded?.(); };
    }, [showIslandAlert]);

    useEffect(() => {
        const original = navigator.clipboard.writeText;
        navigator.clipboard.writeText = async (text) => {
            await original.call(navigator.clipboard, text);
            showIslandAlert('clipboard', 'Скопировано', <CopyIslandIcon />, 1500);
        };
        return () => { navigator.clipboard.writeText = original; };
    }, [showIslandAlert]);
    
    
    const pageMeta = useMemo(() => {
        const path = location.pathname;
        if (path === '/')                  return { name: 'Главная',      icon: '🏠' };
        if (path === '/explore')           return { name: 'Обзор',        icon: '🧭' };
        if (path === '/notifications')     return { name: 'События',      icon: '🔔' };
        if (path === '/music')             return { name: 'Музыка',       icon: '🎵' };
        if (path === '/downloads')         return { name: 'Загрузки',     icon: '💾' };
        if (path === '/bookmarks')         return { name: 'Закладки',     icon: '🗂️' };
        if (path.startsWith('/profile/')) return { name: `@${path.split('/')[2]}`, icon: '👤' };
        if (path.startsWith('/post/'))    return { name: 'Пост',          icon: '📝' };
        return { name: 'итд.app', icon: '✨' };
    }, [location]);

    
    const morpherStyle = useMemo(() => {
        const config = MORPHER_CONFIG[configMode] || MORPHER_CONFIG.idle;
        
        const style = { 
            height: `${config.height}px`,
            minWidth: `${config.minWidth}px`, 
            borderRadius: `${config.height / 2}px` 
        };
        
        if ((configMode === 'idle' || configMode === 'site_activity') && customColor?.color1) {
            style['--island-gradient'] = `linear-gradient(135deg, ${customColor.color1}, ${customColor.color2})`;
            style.boxShadow = `0 12px 40px -10px ${customColor.color1.replace('rgb', 'rgba').replace(')', ', 0.35)')}`;
        }
        return style;
    }, [configMode, customColor]);

    const contentClass = `island-content-inner ${phase === 'exiting' ? 'exiting' : phase === 'entering' ? 'entering' : ''}`;

    const renderContent = () => {
        switch (displayMode) {
            case 'offline':
                return (
                    <div className={`${contentClass} offline-mode`}>
                        <div className="island-status-icon error"><WifiOffIcon /></div>
                        <div className="island-column">
                            <span className="island-caption">НЕТ СЕТИ</span>
                            <span className="island-maintext">Подключение...</span>
                        </div>
                    </div>
                );
            case 'alert':
                if (!alert) return null;
                return (
                    <div className={`${contentClass} alert-${alert.type}`}>
                        <div className={`island-status-icon ${alert.type}`}>
                            {alert.icon || (alert.type === 'success' ? '✓' : '!')}
                        </div>
                        <div className="island-column">
                            <span className="island-caption">
                                {alert.type === 'success' ? 'Успешно' : alert.type === 'clipboard' ? 'Буфер обмена' : alert.type === 'discord' ? 'Discord' : 'Ошибка'}
                            </span>
                            <span className="island-maintext">{alert.message}</span>
                        </div>
                    </div>
                );
            case 'update':
                if (!updateProgress) return null;
                return (
                    <div className={contentClass}>
                        <div className="progress-stack">
                            <svg className="island-ring" viewBox="0 0 36 36">
                                <circle className="ring-track" cx="18" cy="18" r="16" />
                                <circle className="ring-progress" cx="18" cy="18" r="16" style={{strokeDasharray: `${updateProgress.percent}, 100`, stroke: 'var(--color-primary)'}}/>
                            </svg>
                            <span className="dir-arrow" style={{color: 'var(--color-primary)'}}><UpdateIslandIcon /></span>
                        </div>
                        <div className="island-column">
                            <span className="island-maintext">Обновление</span>
                            <span className="island-caption">{updateProgress.percent}%</span>
                        </div>
                    </div>
                );
            case 'download': {
                const dl = activeDownloads[0];
                if (!dl) return null;
                const isIndeterminate = dl.percent < 0;
                return (
                    <div className={contentClass}>
                        <div className="progress-stack">
                            <svg className={`island-ring ${isIndeterminate ? 'spinning' : ''}`} viewBox="0 0 36 36">
                                <circle className="ring-track" cx="18" cy="18" r="16" />
                                <circle 
                                    className="ring-progress" 
                                    cx="18" cy="18" r="16" 
                                    style={{
                                        strokeDasharray: `${isIndeterminate ? 30 : (dl.percent || 0)}, 100`,
                                        stroke: 'var(--color-text)'
                                    }} 
                                />
                            </svg>
                            <span className="dir-arrow">↓</span>
                        </div>
                        <div className="island-column">
                            <span className="island-maintext" title={dl.fileName}>{dl.fileName}</span>
                            <span className="island-caption">
                                {isIndeterminate ? 'В процессе...' : `${Math.round(dl.percent || 0)}%`}
                            </span>
                        </div>
                    </div>
                );
            }
            case 'upload':
                return (
                    <div className={contentClass}>
                        <div className="progress-stack">
                            <div className="island-spinner-arc" />
                            <span className="dir-arrow" style={{color: 'var(--color-primary)'}}>↑</span>
                        </div>
                        <div className="island-column">
                            <span className="island-maintext">Публикация</span>
                            <span className="island-caption">Отправка...</span>
                        </div>
                    </div>
                );
            case 'site_activity':
                if (!siteActivity) return null;
                return (
                    <div className={contentClass}>
                        <div className="island-status-icon" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                            {siteActivity.icon || '🌐'}
                        </div>
                        <div className="island-column">
                            <span className="island-maintext">{siteActivity.title}</span>
                            <span className="island-caption" style={{ color: 'var(--color-text-secondary)', textTransform: 'none' }}>
                                {siteActivity.subtitle}
                            </span>
                        </div>
                        {typeof siteActivity.progress === 'number' && (
                            <div style={{ marginLeft: 'auto', width: '30px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: `${siteActivity.progress}%`, height: '100%', background: 'var(--color-text)', borderRadius: '2px', transition: 'width 0.3s linear' }} />
                            </div>
                        )}
                    </div>
                );
            default: 
                return (
                    <div className={contentClass}>
                        <span className="island-time">{time}</span>
                        <div className="island-v-sep" />
                        <div className="island-page-pill" key={pageMeta.name}>
                            <span className="island-page-icon">{pageMeta.icon}</span>
                            <span className="island-page-name">{pageMeta.name}</span>
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <div className={`island-host ${isShaking ? 'shaking' : ''}`}>
            <div 
                className={`island-morpher ${(customColor && (configMode === 'idle' || configMode === 'site_activity')) ? 'has-gradient' : ''}`} 
                data-mode={configMode} 
                style={morpherStyle}
            >
                {renderContent()}
            </div>
        </div>
    );
};

export default DynamicIsland;