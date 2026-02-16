import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsland } from '../context/IslandContext';
import { useUpload } from '../context/UploadContext';
import { useDownload } from '../context/DownloadContext';
import '../styles/DynamicIsland.css';

const DynamicIsland = () => {
    const location = useLocation();
    const { alert } = useIsland();
    const { uploads } = useUpload();
    const { downloads } = useDownload();
    
    const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }, 30000);
        return () => clearInterval(timer);
    }, []);

    
    const pageMeta = useMemo(() => {
        const path = location.pathname;
        if (path === '/') return { name: 'Главная', icon: '🏠' };
        if (path === '/explore') return { name: 'Обзор', icon: '🧭' };
        if (path === '/notifications') return { name: 'События', icon: '🔔' };
        if (path === '/music') return { name: 'Музыка', icon: '🎵' };
        if (path.startsWith('/profile/')) return { name: `@${path.split('/')[2]}`, icon: '👤' };
        if (path.startsWith('/post/')) return { name: 'Пост', icon: '📝' };
        if (path === '/status') return { name: 'Сеть', icon: '📡' };
        return { name: 'итд.app', icon: '✨' };
    }, [location]);

    const activeUploads = Object.values(uploads).filter(u => u.status !== 'complete' && u.status !== 'error');
    const activeDownloads = Object.values(downloads).filter(d => d.status === 'progressing' || d.status === 'starting');

    const mode = useMemo(() => {
        if (alert) return 'alert';
        if (activeDownloads.length > 0) return 'download';
        if (activeUploads.length > 0) return 'upload';
        return 'idle';
    }, [alert, activeDownloads, activeUploads]);

    const ContentWrapper = ({ children, className }) => (
        <div className={`island-content-inner ${className}`}>
            {children}
        </div>
    );

    return (
        <div className={`island-host ${mode}`}>
            <div className="island-morpher">
                
                {}
                {mode === 'alert' && (
                    <ContentWrapper className="alert-layout">
                        <div className={`island-status-icon ${alert.type}`}>
                            {alert.type === 'success' ? '✓' : '!'}
                        </div>
                        <div className="island-column">
                            <span className="island-caption">{alert.type === 'success' ? 'Система' : 'Ошибка'}</span>
                            <span className="island-maintext">{alert.message}</span>
                        </div>
                    </ContentWrapper>
                )}

                {}
                {mode === 'download' && activeDownloads[0] && (
                    <ContentWrapper className="transfer-layout">
                        <div className="progress-stack">
                            <svg className="island-ring" viewBox="0 0 36 36">
                                <circle className="ring-track" cx="18" cy="18" r="16" />
                                <circle className="ring-progress" cx="18" cy="18" r="16" 
                                    style={{ strokeDasharray: `${activeDownloads[0].percent || 0}, 100` }} />
                            </svg>
                            <span className="dir-arrow">↓</span>
                        </div>
                        <div className="island-column">
                            <span className="island-maintext">Загрузка</span>
                            <span className="island-caption">{activeDownloads[0].percent || 0}%</span>
                        </div>
                    </ContentWrapper>
                )}

                {}
                {mode === 'upload' && (
                    <ContentWrapper className="transfer-layout">
                        <div className="progress-stack">
                            <div className="island-spinner-arc" />
                            <span className="dir-arrow" style={{color: 'var(--color-primary)'}}>↑</span>
                        </div>
                        <div className="island-column">
                            <span className="island-maintext">Публикация</span>
                            <span className="island-caption">Медиа...</span>
                        </div>
                    </ContentWrapper>
                )}

                {}
                {mode === 'idle' && (
                    <ContentWrapper className="idle-layout">
                        <span className="island-time">{time}</span>
                        <div className="island-v-sep" />
                        <div className="island-page-pill">
                            <span className="island-page-icon">{pageMeta.icon}</span>
                            <span className="island-page-name">{pageMeta.name}</span>
                        </div>
                    </ContentWrapper>
                )}

            </div>
        </div>
    );
};

export default DynamicIsland;