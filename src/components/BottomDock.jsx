/* @source src/components/BottomDock.jsx */
import React from 'react';
import { useLocation } from 'react-router-dom'; 
import { useMusicStore } from '../store/musicStore';   
import { useUserStore } from '../store/userStore';
import { useUploadStore } from '../store/uploadStore'; 
import { useBrowser } from '../context/BrowserContext'; 
import GlobalPlayer from './GlobalPlayer';
import MobileNav from './MobileNav';
import '../styles/BottomDock.css';

const BottomDock = () => {
    const currentUser = useUserStore(state => state.currentUser);
    const currentTrack = useMusicStore(state => state.currentTrack); 
    const uploads = useUploadStore(state => state.uploads);          
    
    const { isOpen, isMinimized, maximizeBrowser } = useBrowser(); 
    const location = useLocation(); 

    if (!currentUser || location.pathname.startsWith('/login')) return null;

    const activeUploads = Object.values(uploads).filter(u => u.status !== 'complete' && u.status !== 'error');
    const hasUploads = activeUploads.length > 0;
    const showBrowserMini = isOpen && isMinimized;
    const showPlayer = !!currentTrack;

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
        <div className={`bottom-dock-container ${showBrowserMini ? 'has-browser-mini' : ''}`}>
            <div className="dock-glass-wrapper">
                
                {}
                <div className={`dock-dynamic-section ${showBrowserMini ? 'visible' : ''}`}>
                    <div className="dock-dynamic-content">
                        <div 
                            className="dock-browser-section" 
                            onClick={maximizeBrowser}
                        >
                            <span style={{fontSize: 16}}>🌐</span>
                            <span className="dock-browser-text">Вернуться в браузер</span>
                        </div>
                    </div>
                </div>

                {}
                <div className={`dock-dynamic-section ${showPlayer ? 'visible' : ''}`}>
                    <div className="dock-dynamic-content dock-player-section">
                        <GlobalPlayer />
                    </div>
                </div>

                {}
                <div className={`dock-dynamic-section ${hasUploads ? 'visible' : ''}`}>
                    <div className="dock-dynamic-content dock-upload-section">
                        {activeUploads.slice(0, 1).map(u => (
                            <div key={u.id} className="dock-upload-mini">
                                <div className="upload-pulse-dot"></div>
                                <span className="upload-mini-text">
                                    {getMiniStatusText(u.status)}
                                </span>
                                <div className="upload-mini-bar">
                                    <div className="upload-mini-fill"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {}
                <div className="dock-nav-section">
                    <MobileNav />
                </div>
            </div>
        </div>
    );
};

export default BottomDock;