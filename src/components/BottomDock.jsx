/* @source src/components/BottomDock.jsx */
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom'; 
import { useMusicStore } from '../store/musicStore';   
import { useUserStore } from '../store/userStore';
import { useUploadStore } from '../store/uploadStore'; 
import { useBrowser } from '../context/BrowserContext'; 
import GlobalPlayer from './GlobalPlayer';
import MobileNav from './MobileNav';
import '../styles/BottomDock.css';

const DockUploadMini = ({ id }) => {
    const upload = useUploadStore(useCallback(state => state.uploads[id], [id]));

    if (!upload) return null;

    const getMiniStatusText = (status) => {
        switch (status) {
            case 'reading_tags': return 'Метаданные...';
            case 'uploading_audio': return 'Загрузка MP3...';
            case 'uploading_cover': return 'Обложка...';
            case 'creating_post': return 'Публикация...';
            default: return 'В очереди...';
        }
    };

    return (
        <div className="dock-upload-mini">
            <div className="upload-pulse-dot"></div>
            <span className="upload-mini-text">
                {getMiniStatusText(upload.status)}
            </span>
            <div className="upload-mini-bar">
                <div className="upload-mini-fill"></div>
            </div>
        </div>
    );
};

const BottomDock = () => {
    const currentUser = useUserStore(state => state.currentUser);
    const currentTrackId = useMusicStore(state => state.currentTrack?.id);
    
    const activeUploadIdsStr = useUploadStore(state => 
        Object.values(state.uploads)
            .filter(u => u.status !== 'complete' && u.status !== 'error')
            .map(u => u.id)
            .join(',')
    );
    
    const { isOpen, isMinimized, maximizeBrowser } = useBrowser(); 
    const location = useLocation(); 

    
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);
    const ticking = useRef(false);
    const initialWindowHeight = useRef(window.innerHeight);

    useEffect(() => {
        const handleScroll = (e) => {
            if (!ticking.current) {
                window.requestAnimationFrame(() => {
                    const target = e.target;
                    let currentScrollY = 0;

                    if (target && target.getAttribute && target.getAttribute('data-virtuoso-scroller') === 'true') {
                        currentScrollY = target.scrollTop;
                    } else if (target === document || target === window) {
                        currentScrollY = window.scrollY;
                    } else {
                        currentScrollY = target.scrollTop || 0;
                    }

                    if (currentScrollY > lastScrollY.current + 15) {
                        setIsVisible(false);
                    } else if (currentScrollY < lastScrollY.current - 10) {
                        setIsVisible(true);
                    }
                    
                    if (currentScrollY <= 50) setIsVisible(true);

                    lastScrollY.current = currentScrollY;
                    ticking.current = false;
                });
                ticking.current = true;
            }
        };

        const handleResize = () => {
            const currentHeight = window.innerHeight;
            if (initialWindowHeight.current - currentHeight > 150) {
                setIsVisible(false); 
            } else {
                setIsVisible(true);  
            }
        };

        window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
        window.addEventListener('resize', handleResize, { passive: true });
        
        return () => {
            window.removeEventListener('scroll', handleScroll, { capture: true });
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    if (!currentUser || location.pathname.startsWith('/login')) return null;

    const activeUploadIds = activeUploadIdsStr ? activeUploadIdsStr.split(',') : [];
    const hasUploads = activeUploadIds.length > 0;
    
    const showBrowserMini = isOpen && isMinimized;
    const showPlayer = !!currentTrackId;

    return (
        <div className={`bottom-dock-container ${!isVisible ? 'hidden' : ''} ${showBrowserMini ? 'has-browser-mini' : ''}`}>
            <div className="dock-glass-wrapper">
                
                <div className={`dock-dynamic-section ${showBrowserMini ? 'visible' : ''}`}>
                    <div className="dock-dynamic-content">
                        <div className="dock-browser-section" onClick={maximizeBrowser}>
                            <span style={{fontSize: 16}}>🌐</span>
                            <span className="dock-browser-text">Вернуться в браузер</span>
                        </div>
                    </div>
                </div>

                <div className={`dock-dynamic-section ${showPlayer ? 'visible' : ''}`}>
                    {}
                    <div className="dock-dynamic-content">
                        <div className="dock-player-section">
                            <GlobalPlayer />
                        </div>
                    </div>
                </div>

                <div className={`dock-dynamic-section ${hasUploads ? 'visible' : ''}`}>
                    {}
                    <div className="dock-dynamic-content">
                        <div className="dock-upload-section">
                            {activeUploadIds.slice(0, 1).map(id => (
                                <DockUploadMini key={id} id={id} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="dock-nav-section">
                    <MobileNav />
                </div>
            </div>
        </div>
    );
};

export default BottomDock;