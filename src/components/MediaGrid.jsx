import React from 'react';
import { useModal } from '../context/ModalContext';
import ImageModal from './modals/ImageModal';
import VoicePlayer from './VoicePlayer';
import '../styles/MediaGrid.css';

/**
 * Вспомогательная функция для определения, является ли файл видео
 */
const isVideoFile = (attachment) => {
    const type = (attachment.mimeType || attachment.type || '').toLowerCase();
    const url = (attachment.url || '').toLowerCase();
    if (type.startsWith('video/')) return true;
     
    return /\.(mp4|webm|ogg|mov|qt)(?:\?|$)/i.test(url);
};

/**
 * Иконка скачивания (SVG)
 */
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

    /**
     * Открытие галереи в полноэкранном режиме
     */
    const handleOpenModal = (e, index) => {
         
        if (e.target.closest('.media-download-overlay-btn') || e.target.tagName === 'VIDEO') return;
        
        e.preventDefault();
        e.stopPropagation();

         
        openModal(
            <ImageModal images={visualMedia} initialIndex={index} />, 
            { variant: 'fullscreen' }
        );
    };

    /**
     * Обработка скачивания файла
     */
    const handleDownload = (e, media) => {
        e.preventDefault();
        e.stopPropagation(); 

        const url = media.url;
        
        if (window.api && window.api.downloadFile) {
             
            window.api.downloadFile(url);
        } else {
             
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', ''); 
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="media-content-wrapper" onClick={e => e.stopPropagation()}>
            
            { }
            {audioMedia.length > 0 && (
                <div className="audio-list">
                    {audioMedia.map(track => (
                        <VoicePlayer 
                            key={track.id} 
                            src={track.url} 
                            duration={track.duration || 0} 
                        />
                    ))}
                </div>
            )}

            { }
            {visualMedia.length > 0 && (
                <div className={`media-grid count-${Math.min(visualMedia.length, 4)}`}>
                    {visualMedia.slice(0, 4).map((media, index) => {
                        const isVid = isVideoFile(media);

                        return (
                            <div 
                                key={media.id} 
                                className="media-item"
                                onClick={(e) => handleOpenModal(e, index)}
                            >
                                { }
                                <button 
                                    className="media-download-overlay-btn" 
                                    onClick={(e) => handleDownload(e, media)}
                                    title="Скачать файл"
                                >
                                    <DownloadIcon />
                                </button>

                                { }
                                {isVid ? (
                                    <div className="video-container">
                                        <video 
                                            src={media.url} 
                                            preload="metadata" 
                                            controls 
                                            className="post-video"
                                        />
                                    </div>
                                ) : (
                                    <img 
                                        src={media.url} 
                                        alt="post attachment" 
                                        className="post-image"
                                        loading="lazy"
                                    />
                                )}

                                { }
                                {index === 3 && visualMedia.length > 4 && (
                                    <div className="more-overlay">
                                        <span>+{visualMedia.length - 4}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MediaGrid;