/* @source BottomDock.jsx */
import React from 'react';
import { useMusic } from '../context/MusicContext';
import { useUser } from '../context/UserContext';
import { useUpload } from '../context/UploadContext'; 
import GlobalPlayer from './GlobalPlayer';
import MobileNav from './MobileNav';
import '../styles/BottomDock.css';

const BottomDock = () => {
    const { currentUser } = useUser();
    const { currentTrack } = useMusic();
    const { uploads } = useUpload();

    if (!currentUser) return null;

    
    const activeUploads = Object.values(uploads).filter(u => u.status !== 'complete' && u.status !== 'error');
    const hasUploads = activeUploads.length > 0;

    
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
        <div className={`bottom-dock-container ${currentTrack ? 'has-player' : ''} ${hasUploads ? 'has-uploads' : ''}`}>
            <div className="dock-glass-wrapper">
                
                {}
                {currentTrack && (
                    <div className="dock-player-section">
                        <GlobalPlayer />
                    </div>
                )}

                {}
                {hasUploads && (
                    <div className="dock-upload-section">
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
                )}

                {}
                <div className="dock-nav-section">
                    <MobileNav />
                </div>
            </div>
        </div>
    );
};

export default BottomDock;