/* @source src/components/RightSidebar.jsx */
import React, { useState, useEffect, memo, useRef } from 'react'; 
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useUploadStore } from '../store/uploadStore'; 
import { useDownloadStore } from '../store/downloadStore';
import { useMusicStore } from '../store/musicStore';
import { useBrowser } from '../context/BrowserContext';
import { useUserStore } from '../store/userStore'; 
import { WidgetSkeleton } from './Skeletons';
import GlobalPlayer from './GlobalPlayer';
import { SidebarExpandIcon, SidebarCloseIcon } from './icons/CustomIcons';
import '../styles/RightSidebar.css';

const PROMOTED_USERNAMES = ['vany', "itdStatus"];

const WidgetBox = ({ title, children, showMoreLink, className = "", delay = "0s", headerAccessory }) => (
    <div 
        className={`widget-box animate-in ${className}`} 
        style={{ '--delay': delay }}
    >
        {(title || headerAccessory) && (
            <div className="widget-header">
                {title && <h2 className="widget-title">{title}</h2>}
                {headerAccessory && <div className="widget-header-accessory">{headerAccessory}</div>}
            </div>
        )}
        <div className="widget-content">
            {children}
        </div>
        {showMoreLink && (
            <Link to={showMoreLink} className="widget-more">
                Показать еще
            </Link>
        )}
    </div>
);

const SidebarPlayerWrapper = () => {
    const currentTrack = useMusicStore(state => state.currentTrack);
    const hasTrack = !!currentTrack;

    return (
        <div className={`dynamic-widget-wrapper player-wrapper ${hasTrack ? 'visible' : ''}`}>
            <div className="sidebar-player-widget animate-in">
                <GlobalPlayer />
            </div>
        </div>
    );
};

const RightSidebar = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const uploads = useUploadStore(state => state.uploads);
    const downloads = useDownloadStore(state => state.downloads);
    const { isOpen, isMinimized, title, url, maximizeBrowser, closeBrowser } = useBrowser();
    
    
    const currentUser = useUserStore(state => state.currentUser);

    const activeUploads = Object.values(uploads).filter(u => u.status !== 'complete' && u.status !== 'error');
    const activeDownloads = Object.values(downloads);

    const devClickRef = useRef({ count: 0, lastTime: 0 });

    useEffect(() => {
        const fetchSidebarData = async () => {
            setLoading(true);
            try {
                
                const usersRes = await apiClient.getSuggestions();
                let apiUsers = usersRes?.users || [];

                
                const promotedPromises = PROMOTED_USERNAMES.map(username =>
                    apiClient.getProfile(username).catch(() => null) 
                );
                const promotedResults = await Promise.all(promotedPromises);

                
                const promotedUsers = promotedResults
                    .map(res => res?.user || res?.data || res)
                    .filter(u => u && u.username && u.username !== currentUser?.username);

                
                const promotedSet = new Set(promotedUsers.map(u => u.username));
                apiUsers = apiUsers.filter(u => !promotedSet.has(u.username));

                
                const finalUsers = [...promotedUsers, ...apiUsers].slice(0, 5);

                setUsers(finalUsers);
            } catch (error) {
                console.error("Ошибка загрузки:", error);
            } finally {
                setLoading(false);
            }
        };
        
        if (currentUser) {
            fetchSidebarData();
        }
    }, [currentUser?.username]); 

    const handleDevTrigger = () => {
        const now = Date.now();
        if (now - devClickRef.current.lastTime > 10000) {
            devClickRef.current.count = 0;
        }
        
        devClickRef.current.lastTime = now;
        devClickRef.current.count++;

        if (devClickRef.current.count >= 6) {
            if (window.api && window.api.invoke) {
                window.api.invoke('debug:open-dev-window');
            }
            devClickRef.current.count = 0;
        }
    };

    const getUploadStatusLabel = (status) => {
        switch (status) {
            case 'reading_tags': return 'Теги...';
            case 'uploading_audio': return 'MP3...';
            case 'uploading_cover': return 'Обложка...';
            case 'creating_post': return 'Пост...';
            default: return 'В очереди...';
        }
    };

    const BrowserWidget = () => {
        const isVisible = isOpen && isMinimized;
        let hostname = 'localhost';
        try { hostname = new URL(url).hostname; } catch(e){}
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;

        return (
            <div className={`dynamic-widget-wrapper browser-wrapper ${isVisible ? 'visible' : ''}`}>
                <div className="widget-box interactive" onClick={maximizeBrowser}>
                    <div className="widget-header">
                        <h2 className="widget-title">
                            <span className="live-dot"></span>
                            Активная вкладка
                        </h2>
                        <button className="widget-header-close" onClick={(e) => { e.stopPropagation(); closeBrowser(); }} title="Закрыть вкладку">
                            <SidebarCloseIcon />
                        </button>
                    </div>
                    <div className="widget-content browser-content">
                        <div className="browser-icon-wrapper">
                            <img src={faviconUrl} alt="" onError={e => e.target.style.display='none'} />
                        </div>
                        <div className="browser-info">
                            <span className="browser-title">{title || 'Загрузка...'}</span>
                            <span className="browser-url">{hostname}</span>
                        </div>
                        <SidebarExpandIcon />
                    </div>
                </div>
            </div>
        );
    };

    const TransfersWidget = () => {
        const hasTransfers = activeDownloads.length > 0 || activeUploads.length > 0;

        return (
            <div className={`dynamic-widget-wrapper transfers-wrapper ${hasTransfers ? 'visible' : ''}`}>
                <div className="widget-box transfers-widget">
                    <div className="widget-header">
                        <h2 className="widget-title">Менеджер файлов</h2>
                    </div>
                    <div className="widget-content transfers-list">
                        {activeDownloads.map(d => (
                            <div key={d.startTime} className="transfer-item">
                                <div className="transfer-icon download">↓</div>
                                <div className="transfer-info">
                                    <div className="transfer-header">
                                        <span className="transfer-name" title={d.fileName}>{d.fileName}</span>
                                        <span className="transfer-status">{Math.round(d.percent || 0)}%</span>
                                    </div>
                                    <div className="transfer-progress determinate"><div className="fill" style={{ width: `${d.percent || 0}%` }} /></div>
                                </div>
                            </div>
                        ))}
                        {activeUploads.map(u => (
                            <div key={u.id} className="transfer-item">
                                <div className="transfer-icon upload">↑</div>
                                <div className="transfer-info">
                                    <div className="transfer-header">
                                        <span className="transfer-name" title={u.fileName}>{u.fileName}</span>
                                        <span className="transfer-status">{getUploadStatusLabel(u.status)}</span>
                                    </div>
                                    <div className="transfer-progress indeterminate"><div className="fill" /></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <aside className="right-sidebar">
            <BrowserWidget />
            <SidebarPlayerWrapper />
            <TransfersWidget />

            {loading ? (
                <div className="animate-in" style={{ '--delay': '0s' }}><WidgetSkeleton /></div>
            ) : (
                users.length > 0 &&
                <WidgetBox title="Кого читать" showMoreLink="/explore" delay="0s">
                    {users.map((user, idx) => (
                        <Link to={`/profile/${user.username}`} key={user.id || user.username} className="widget-item stagger-item" style={{ '--i': idx }}>
                            <div className="avatar" style={{ width: 40, height: 40, fontSize: 20 }}>{user.avatar || "👤"}</div>
                            <div className="widget-item-info">
                                <span className="name">{user.displayName}</span>
                                <span className="count">@{user.username}</span>
                            </div>
                        </Link>
                    ))}
                </WidgetBox>
            )}

            <div 
                className="sidebar-footer-copy animate-in" 
                style={{ '--delay': '0.2s', cursor: 'default', userSelect: 'none' }}
                onClick={handleDevTrigger}
            >
                © 2026 итд.app
            </div>
        </aside>
    );
};

export default memo(RightSidebar);