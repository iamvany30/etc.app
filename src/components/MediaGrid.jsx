/* @source src/components/MediaGrid.jsx */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useModalStore } from '../store/modalStore';
import ImageModal from './modals/ImageModal';
import VoicePlayer from './VoicePlayer';
import { MediaDownloadIcon, MediaErrorIcon } from './icons/CustomIcons';
import '../styles/MediaGrid.css';

const MediaItem = React.memo(({ media, isVid, onClick, onDownload }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    
    const [currentSrc, setCurrentSrc] = useState(media.url);
    const mediaRef = useRef(null);

    
    useEffect(() => {
        setCurrentSrc(media.url);
        setIsLoaded(false);
        setHasError(false);
    }, [media.url]);

    useEffect(() => {
        if (mediaRef.current) {
            if (isVid) {
                if (mediaRef.current.readyState >= 3) setIsLoaded(true);
            } else {
                if (mediaRef.current.complete) setIsLoaded(true);
            }
        }
    }, [isVid, currentSrc]);

    
    useEffect(() => {
        if (!isVid || !mediaRef.current) return;
        
        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0];
            if (entry.isIntersecting) {
                mediaRef.current.play().catch(() => {});
            } else {
                mediaRef.current.pause();
            }
        }, { threshold: 0.3 });

        observer.observe(mediaRef.current);
        return () => observer.disconnect();
    }, [isVid]);

    const handleLoad = useCallback(() => setIsLoaded(true), []);
    
    
    const handleError = useCallback(() => {
        
        if (currentSrc && currentSrc.startsWith('asset://')) {
            try {
                const urlObj = new URL(currentSrc);
                const originalUrl = urlObj.searchParams.get('url');
                
                if (originalUrl) {
                    
                    console.log(`[MediaGrid] Fallback to direct URL:`, originalUrl);
                    setCurrentSrc(decodeURIComponent(originalUrl));
                    return; 
                }
            } catch (e) {
                
            }
        }

        
        setHasError(true);
        setIsLoaded(true); 
    }, [currentSrc]);

    return (
        <div className="media-item" onClick={onClick}>
            {!isLoaded && !hasError && (
                <div className="skeleton-base skeleton-media-placeholder" />
            )}

            {hasError && (
                <div className="media-error-placeholder">
                    <MediaErrorIcon/>
                    <span>Ошибка загрузки</span>
                </div>
            )}

            <button 
                className="media-download-overlay-btn" 
                onClick={(e) => onDownload(e, media)}
                title="Скачать файл"
            >
                <MediaDownloadIcon />
            </button>

            {isVid ? (
                <video 
                    ref={mediaRef}
                    src={currentSrc} 
                    preload="metadata"
                    loop
                    muted
                    playsInline
                    onLoadedData={handleLoad}
                    onError={handleError} 
                    className={`post-video ${isLoaded && !hasError ? 'media-fade-in' : 'media-hidden'}`}
                />
            ) : (
                <img 
                    ref={mediaRef}
                    src={currentSrc} 
                    alt="" 
                    loading="lazy"
                    decoding="async"
                    onLoad={handleLoad}
                    onError={handleError} 
                    className={`post-image ${isLoaded && !hasError ? 'media-fade-in' : 'media-hidden'}`}
                />
            )}
        </div>
    );
});

const MediaGrid = ({ attachments }) => {
    const openModal = useModalStore(state => state.openModal);

    const visualMedia = useMemo(() => {
        return (attachments || []).filter(a => {
            const mime = (a.mimeType || a.type || '').toLowerCase();
            return !mime.startsWith('audio/');
        });
    }, [attachments]);

    const audioMedia = useMemo(() => {
        return (attachments || []).filter(a => {
            const mime = (a.mimeType || a.type || '').toLowerCase();
            return mime.startsWith('audio/');
        });
    }, [attachments]);

    const handleOpenModal = useCallback((e, index) => {
        if (e.target.closest('.media-download-overlay-btn')) return;
        
        e.preventDefault(); 
        e.stopPropagation();
        
        
        openModal(<ImageModal images={visualMedia} initialIndex={index} />, { variant: 'fullscreen' });
    }, [openModal, visualMedia]);

    const handleDownload = useCallback((e, media) => {
        e.preventDefault(); 
        e.stopPropagation();
        
        
        let dlUrl = media.url;
        if (dlUrl.startsWith('asset://')) {
            try {
                const parsed = new URL(dlUrl).searchParams.get('url');
                if (parsed) dlUrl = decodeURIComponent(parsed);
            } catch(e){}
        }
        
        if (window.api?.downloadFile) window.api.downloadFile(dlUrl);
    }, []);

    if (!attachments || attachments.length === 0) return null;

    const isVideoFile = (attachment) => {
        const type = (attachment.mimeType || attachment.type || '').toLowerCase();
        const url = (attachment.url || '').toLowerCase();
        return type.startsWith('video/') || /\.(mp4|webm|ogg|mov|qt)(?:\?|$)/i.test(url);
    };

    return (
        <div className="media-content-wrapper" onClick={e => e.stopPropagation()}>
            {audioMedia.length > 0 && (
                <div className="audio-list">
                    {audioMedia.map(track => {
                        let audioSrc = track.url;
                        if (audioSrc.startsWith('asset://')) {
                            try {
                                const parsed = new URL(audioSrc).searchParams.get('url');
                                if (parsed) audioSrc = decodeURIComponent(parsed);
                            } catch(e){}
                        }
                        return <VoicePlayer key={track.id} src={audioSrc} duration={track.duration || 0} />;
                    })}
                </div>
            )}
            
            {visualMedia.length > 0 && (
                <div className={`media-grid count-${Math.min(visualMedia.length, 4)}`}>
                    {visualMedia.slice(0, 4).map((media, index) => (
                        <MediaItem 
                            key={media.id || index} 
                            media={media} 
                            isVid={isVideoFile(media)}
                            onClick={(e) => handleOpenModal(e, index)}
                            onDownload={handleDownload}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MediaGrid;