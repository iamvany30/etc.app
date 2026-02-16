import React, { useState, useEffect, useRef } from 'react';
import { useModal } from '../context/ModalContext';
import ImageModal from './modals/ImageModal';
import VoicePlayer from './VoicePlayer';
import '../styles/MediaGrid.css';


const MediaItem = ({ media, isVid, onClick, onDownload }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const mediaRef = useRef(null);

    
    useEffect(() => {
        if (mediaRef.current) {
            if (isVid) {
                if (mediaRef.current.readyState >= 3) setIsLoaded(true);
            } else {
                if (mediaRef.current.complete) setIsLoaded(true);
            }
        }
    }, [isVid]);

    const handleLoad = () => setIsLoaded(true);
    
    const handleError = () => {
        setHasError(true);
        setIsLoaded(true); 
    };

    return (
        <div className="media-item" onClick={onClick}>
            {}
            {!isLoaded && !hasError && (
                <div className="skeleton-base skeleton-media-placeholder" />
            )}

            {}
            {hasError && (
                <div className="media-error-placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>Ошибка загрузки</span>
                </div>
            )}

            <button 
                className="media-download-overlay-btn" 
                onClick={(e) => onDownload(e, media)}
            >
                <DownloadIcon />
            </button>

            {isVid ? (
                <video 
                    ref={mediaRef}
                    src={media.url} 
                    preload="metadata"
                    onLoadedData={handleLoad}
                    onError={handleError}
                    className={`post-video ${isLoaded && !hasError ? 'media-fade-in' : 'media-hidden'}`}
                    muted
                />
            ) : (
                <img 
                    ref={mediaRef}
                    src={media.url} 
                    alt="" 
                    onLoad={handleLoad}
                    onError={handleError}
                    className={`post-image ${isLoaded && !hasError ? 'media-fade-in' : 'media-hidden'}`}
                    loading="lazy"
                />
            )}
        </div>
    );
};



const DownloadIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

const MediaGrid = ({ attachments }) => {
    const { openModal } = useModal();
    if (!attachments || attachments.length === 0) return null;

    const visualMedia = attachments.filter(a => {
        const mime = (a.mimeType || a.type || '').toLowerCase();
        return !mime.startsWith('audio/');
    });

    const audioMedia = attachments.filter(a => {
        const mime = (a.mimeType || a.type || '').toLowerCase();
        return mime.startsWith('audio/');
    });

    const isVideoFile = (attachment) => {
        const type = (attachment.mimeType || attachment.type || '').toLowerCase();
        const url = (attachment.url || '').toLowerCase();
        return type.startsWith('video/') || /\.(mp4|webm|ogg|mov|qt)(?:\?|$)/i.test(url);
    };

    const handleOpenModal = (e, index) => {
        if (e.target.closest('.media-download-overlay-btn') || e.target.tagName === 'VIDEO') return;
        e.preventDefault(); e.stopPropagation();
        openModal(<ImageModal images={visualMedia} initialIndex={index} />, { variant: 'fullscreen' });
    };

    const handleDownload = (e, media) => {
        e.preventDefault(); e.stopPropagation();
        if (window.api?.downloadFile) window.api.downloadFile(media.url);
    };

    return (
        <div className="media-content-wrapper" onClick={e => e.stopPropagation()}>
            {audioMedia.length > 0 && (
                <div className="audio-list">
                    {audioMedia.map(track => (
                        <VoicePlayer key={track.id} src={track.url} duration={track.duration || 0} />
                    ))}
                </div>
            )}
            {visualMedia.length > 0 && (
                <div className={`media-grid count-${Math.min(visualMedia.length, 4)}`}>
                    {visualMedia.slice(0, 4).map((media, index) => (
                        <MediaItem 
                            key={media.id} media={media} 
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