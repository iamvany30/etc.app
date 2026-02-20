import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsland } from '../context/IslandContext';
import { useUpload } from '../context/UploadContext';
import { useDownload } from '../context/DownloadContext';
import '../styles/DynamicIsland.css';


const WifiOffIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="1" y1="1" x2="23" y2="23" /><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.11M1 10.44a11.13 11.13 0 0 1 2.3-3.6M8.6 3.3a11.4 11.4 0 0 1 3.4-1.22M4.26 6.26A11.09 11.09 0 0 1 8 4.79" /><path d="M11.6 16.21A2.5 2.5 0 0 1 10.2 13M12.9 18.23a6.83 6.83 0 0 1-1.7.27c-3.87 0-7-3.13-7-7a7.07 7.07 0 0 1 2.05-4.94" /><path d="M17.74 17.74c1.1-1.1.92-3.34.22-4.83a7.48 7.48 0 0 0-4.13-4.13c-1.49-.7-3.73-.88-4.83.22" />
    </svg>
);
const CopyIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
);
const UpdateIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
);


const MORPHER_DIMS = {
    idle:     { height: 'clamp(32px, 2.5vw, 40px)', width: 'clamp(140px, 14vw, 240px)' },
    offline:  { height: 'clamp(44px, 3.5vw, 56px)', width: 'clamp(200px, 21vw, 300px)' },
    alert:    { height: 'clamp(44px, 3.5vw, 56px)', width: 'clamp(220px, 23.5vw, 340px)' },
    update:   { height: 'clamp(44px, 3.5vw, 56px)', width: 'clamp(190px, 20vw, 290px)' },
    download: { height: 'clamp(44px, 3.5vw, 56px)', width: 'clamp(190px, 20vw, 290px)' },
    upload:   { height: 'clamp(44px, 3.5vw, 56px)', width: 'clamp(190px, 20vw, 290px)' },
};

const MODE_DEBOUNCE_MS = 80;
const EXIT_DURATION_MS = 260;

const MODE_SIZE_RANK = {
    offline:  5,
    alert:    4,
    update:   3,
    download: 3,
    upload:   3,
    idle:     1,
};

const getShrinkDelay = (from, to) =>
    (MODE_SIZE_RANK[to] ?? 1) < (MODE_SIZE_RANK[from] ?? 1)
        ? EXIT_DURATION_MS - 40
        : 0;


const DynamicIsland = () => {
    
    const location = useLocation();
    const { alert, showIslandAlert, customColor } = useIsland();
    const { uploads } = useUpload();
    const { downloads } = useDownload();

    const [time, setTime] = useState(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [updateProgress, setUpdateProgress] = useState(null);

    const [displayMode, setDisplayMode] = useState('idle');
    const [phase, setPhase] = useState('stable'); 
    const [isShaking, setIsShaking] = useState(false);
    
    const [morphDelay, setMorphDelay] = useState(0);
    const displayModeRef = useRef('idle'); 

    const targetModeRef  = useRef('idle');
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
        return 'idle';
    }, [alert, activeDownloads, activeUploads, isOffline, updateProgress]);
    
    useEffect(() => {
        targetModeRef.current = targetMode;
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            const incoming = targetModeRef.current;
            const current  = displayModeRef.current;
            if (incoming === current) return; 
            const delay = getShrinkDelay(current, incoming);
            setMorphDelay(delay);
            setPhase('exiting');
            clearTimeout(exitTimer.current);
            exitTimer.current = setTimeout(() => {
                displayModeRef.current = incoming;
                setDisplayMode(incoming);
                setMorphDelay(0);    
                setPhase('entering');
                clearTimeout(enterTimer.current);
                enterTimer.current = setTimeout(() => { setPhase('stable'); }, 20);
            }, EXIT_DURATION_MS);
        }, MODE_DEBOUNCE_MS);
        return () => { clearTimeout(debounceTimer.current); };
    }, [targetMode]); 

    useEffect(() => {
        if (alert?.type === 'error') {
            setIsShaking(true);
            clearTimeout(shakeTimer.current);
            shakeTimer.current = setTimeout(() => setIsShaking(false), 500);
        }
    }, [alert]);

    useEffect(() => () => {
        clearTimeout(debounceTimer.current);
        clearTimeout(exitTimer.current);
        clearTimeout(enterTimer.current);
        clearTimeout(shakeTimer.current);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }, 30000);
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
            showIslandAlert('clipboard', 'Скопировано', <CopyIcon />, 1500);
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
        const dims = MORPHER_DIMS[displayMode] || MORPHER_DIMS.idle;
        const style = { ...dims };
        if (morphDelay > 0) {
            style.transitionDelay = `${morphDelay}ms`;
        } else {
            style.transitionDelay = '0ms';
        }
        if (displayMode === 'idle' && customColor?.color1) {
            style['--island-gradient'] = `linear-gradient(135deg, ${customColor.color1}, ${customColor.color2})`;
            style.boxShadow = `0 12px 40px -10px ${customColor.color1.replace('rgb', 'rgba').replace(')', ', 0.35)')}`;
        }
        return style;
    }, [displayMode, customColor, morphDelay]);

    const contentClass = useMemo(() => {
        if (phase === 'exiting')  return 'island-content-inner exiting';
        if (phase === 'entering') return 'island-content-inner entering';
        return 'island-content-inner';
    }, [phase]);

    const renderContent = () => {
        switch (displayMode) {
            case 'offline':
                return (<div className={`${contentClass} offline-mode`}><div className="island-status-icon error"><WifiOffIcon /></div><div className="island-column"><span className="island-caption">НЕТ СЕТИ</span><span className="island-maintext">Подключение...</span></div></div>);
            case 'alert':
                if (!alert) return null;
                return (<div className={`${contentClass} alert-${alert.type}`}><div className={`island-status-icon ${alert.type}`}>{alert.icon || (alert.type === 'success' ? '✓' : '!')}</div><div className="island-column"><span className="island-caption">{alert.type === 'success' ? 'Успешно' : alert.type === 'clipboard' ? 'Буфер обмена' : alert.type === 'discord' ? 'Discord' : 'Ошибка'}</span><span className="island-maintext">{alert.message}</span></div></div>);
            case 'update':
                if (!updateProgress) return null;
                return (<div className={contentClass}><div className="progress-stack"><svg className="island-ring" viewBox="0 0 36 36"><circle className="ring-track" cx="18" cy="18" r="16" /><circle className="ring-progress" cx="18" cy="18" r="16" style={{strokeDasharray: `${updateProgress.percent}, 100`, stroke: '#2AABEE'}}/></svg><span className="dir-arrow" style={{color: '#2AABEE'}}><UpdateIcon /></span></div><div className="island-column"><span className="island-maintext">Обновление</span><span className="island-caption">{updateProgress.percent}%</span></div></div>);
            case 'download': {
                const dl = activeDownloads[0];
                if (!dl) return null;
                return (<div className={contentClass}><div className="progress-stack"><svg className="island-ring" viewBox="0 0 36 36"><circle className="ring-track" cx="18" cy="18" r="16" /><circle className="ring-progress" cx="18" cy="18" r="16" style={{strokeDasharray: `${dl.percent || 0}, 100`}} /></svg><span className="dir-arrow">↓</span></div><div className="island-column"><span className="island-maintext">Загрузка</span><span className="island-caption">{Math.round(dl.percent || 0)}%</span></div></div>);
            }
            case 'upload':
                return (<div className={contentClass}><div className="progress-stack"><div className="island-spinner-arc" /><span className="dir-arrow" style={{color: 'var(--color-primary)'}}>↑</span></div><div className="island-column"><span className="island-maintext">Публикация</span><span className="island-caption">Отправка...</span></div></div>);
            default: 
                return (<div className={contentClass}><span className="island-time">{time}</span><div className="island-v-sep" /><div className="island-page-pill"><span className="island-page-icon">{pageMeta.icon}</span><span className="island-page-name">{pageMeta.name}</span></div></div>);
        }
    };
    
    return (
        <div className={`island-host ${isShaking ? 'shaking' : ''}`}>
            <div className={`island-morpher ${customColor && displayMode === 'idle' ? 'has-gradient' : ''}`} data-mode={displayMode} style={morpherStyle}>
                {renderContent()}
            </div>
        </div>
    );
};

export default DynamicIsland;