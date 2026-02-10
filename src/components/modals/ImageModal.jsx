import React, { useState } from 'react';
import '../../styles/ImageModal.css';

const DownloadIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;


const isVideo = (attachment) => {
    const type = attachment.mimeType || attachment.type || '';
    const url = attachment.url || '';
    if (type.startsWith('video/')) return true;
    return /\.(mp4|webm|ogg|mov|qt)(?:\?|$)/i.test(url);
};

const ImageModal = ({ images, initialIndex = 0 }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    const next = (e) => {
        e.stopPropagation();
        if (currentIndex < images.length - 1) setCurrentIndex(currentIndex + 1);
    };

    const prev = (e) => {
        e.stopPropagation();
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    };

    const handleDownload = (e) => {
        e.stopPropagation();
        const currentItem = images[currentIndex];
        const link = document.createElement('a');
        link.href = currentItem.url;
        
        const ext = isVideo(currentItem) ? 'mp4' : 'jpg';
        link.download = `itd-media-${new Date().getTime()}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const currentItem = images[currentIndex];
    const isCurrentVideo = isVideo(currentItem);

    return (
        <div className="image-modal-container">
            <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="image-modal-action-btn download" onClick={handleDownload} title="Скачать">
                    <DownloadIcon />
                </button>
                
                {images.length > 1 && currentIndex > 0 && (
                    <button className="image-modal-nav prev" onClick={prev}>❮</button>
                )}
                
                <div className="media-container">
                    {isCurrentVideo ? (
                        <video 
                            src={currentItem.url} 
                            controls 
                            autoPlay 
                            className="modal-media"
                            style={{maxHeight: '90vh', maxWidth: '100%'}}
                        />
                    ) : (
                        <img 
                            src={currentItem.url} 
                            alt="fullsize" 
                            className="modal-media" 
                        />
                    )}
                </div>

                {images.length > 1 && currentIndex < images.length - 1 && (
                    <button className="image-modal-nav next" onClick={next}>❯</button>
                )}
            </div>
        </div>
    );
};

export default ImageModal;