import React, { useState, useEffect, memo } from 'react'; 
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useUpload } from '../context/UploadContext'; 
import { useMusic } from '../context/MusicContext';
import { WidgetSkeleton } from './Skeletons';
import GlobalPlayer from './GlobalPlayer';
import '../styles/RightSidebar.css';

const WidgetBox = ({ title, children, showMoreLink, className = "", delay = "0s" }) => (
    <div 
        className={`widget-box animate-in ${className}`} 
        style={{ '--delay': delay }}
    >
        {title && <h2 className="widget-title">{title}</h2>}
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
    const { currentTrack } = useMusic();
    if (!currentTrack) return null;
    
    return (
        <div className="sidebar-player-widget animate-in" style={{ '--delay': '0.1s' }}>
            <GlobalPlayer />
        </div>
    );
};

const RightSidebar = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { uploads } = useUpload();
    

    const activeUploads = Object.values(uploads).filter(u => u.status !== 'complete' && u.status !== 'error');

    useEffect(() => {
        const fetchSidebarData = async () => {
            try {
                const usersRes = await apiClient.getSuggestions();
                setUsers(usersRes?.users?.slice(0, 5) || []);
            } catch (error) {
                console.error("Ошибка загрузки:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSidebarData();
    }, []);

    const getStatusLabel = (status) => {
        switch (status) {
            case 'reading_tags': return 'Теги...';
            case 'uploading_audio': return 'MP3...';
            case 'uploading_cover': return 'Обложка...';
            case 'creating_post': return 'Пост...';
            default: return 'Ждите...';
        }
    };

    return (
        <aside className="right-sidebar">
            
            {}
            <SidebarPlayerWrapper />

            {}
            {activeUploads.length > 0 && (
                <WidgetBox 
                    title="Загрузка" 
                    className="upload-widget-sidebar" 
                    delay="0.2s"
                >
                    {activeUploads.map(u => (
                        <div key={u.id} className="sidebar-upload-item">
                            <div className="sidebar-upload-info">
                                <span className="s-upload-name">{u.fileName}</span>
                                <span className="s-upload-status">{getStatusLabel(u.status)}</span>
                            </div>
                            <div className="sidebar-upload-bar">
                                <div className="sidebar-upload-fill"></div>
                            </div>
                        </div>
                    ))}
                </WidgetBox>
            )}

            {}
            {loading ? (
                <div className="animate-in" style={{ '--delay': '0.3s' }}>
                    <WidgetSkeleton />
                </div>
            ) : (
                <WidgetBox 
                    title="Кого читать" 
                    showMoreLink="/explore" 
                    delay="0.3s"
                >
                    {users.map((user, idx) => (
                        <Link 
                            to={`/profile/${user.username}`} 
                            key={user.id} 
                            className="widget-item stagger-item"
                            style={{ '--i': idx }}
                        >
                            <div className="avatar" style={{ width: 40, height: 40, fontSize: 20 }}>
                                {user.avatar || "👤"}
                            </div>
                            <div className="widget-item-info">
                                <span className="name">{user.displayName}</span>
                                <span className="count">@{user.username}</span>
                            </div>
                        </Link>
                    ))}
                </WidgetBox>
            )}

            <div className="sidebar-footer-copy animate-in" style={{ '--delay': '0.5s' }}>
                © 2026 итд.app
            </div>
        </aside>
    );
};


export default memo(RightSidebar);