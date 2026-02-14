import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useModal } from '../../context/ModalContext';
import { PlayIcon, PauseIcon } from '../icons/MediaIcons';
import '../../styles/ImageModal.css';

const DownloadIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const CloseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

const isVideo = (att) => {
    const type = att.mimeType || att.type || '';
    return type.startsWith('video/') || att.url.toLowerCase().endsWith('.mp4');
};

const ImageModal = ({ images, initialIndex = 0 }) => {
    const { closeModal } = useModal();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    
     
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const imgRef = useRef(null);

    const resetZoom = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleZoom = useCallback((delta) => {
        setScale(prev => {
            const next = prev + delta;
            return Math.min(Math.max(next, 1), 8);  
        });
    }, []);

     
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === '=' || e.key === '+') { e.preventDefault(); handleZoom(0.5); }
                if (e.key === '-') { e.preventDefault(); handleZoom(-0.5); }
            } else {
                if (e.key === 'ArrowRight' && currentIndex < images.length - 1) { setCurrentIndex(prev => prev + 1); resetZoom(); }
                if (e.key === 'ArrowLeft' && currentIndex > 0) { setCurrentIndex(prev => prev - 1); resetZoom(); }
                if (e.key === 'Escape') closeModal();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, images.length, handleZoom, closeModal]);

     
    const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.3 : 0.3;
            handleZoom(delta);
        }
    };

     
    const onMouseDown = (e) => {
        if (scale === 1) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const onMouseMove = (e) => {
        if (!isDragging || scale === 1) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const onMouseUp = () => setIsDragging(false);

    const handleDownload = (e) => {
        e.stopPropagation();
        const url = images[currentIndex].url;
        if (window.api?.downloadFile) window.api.downloadFile(url);
    };

    const currentItem = images[currentIndex];
    const isVid = isVideo(currentItem);

    return (
        <div className="img-modal-overlay" onWheel={handleWheel} onMouseUp={onMouseUp}>
              
            <div className="img-modal-toolbar">
                <div className="img-info">
                    {images.length > 1 && <span>{currentIndex + 1} / {images.length}</span>}
                    {scale > 1 && <span className="zoom-badge">{Math.round(scale * 100)}%</span>}
                </div>
                <div className="img-actions">
                    <button onClick={handleDownload} title="Скачать"><DownloadIcon /></button>
                    <button onClick={closeModal} title="Закрыть"><CloseIcon /></button>
                </div>
            </div>

              
            {images.length > 1 && currentIndex > 0 && (
                <button className="nav-btn prev" onClick={(e) => { e.stopPropagation(); setCurrentIndex(v => v - 1); resetZoom(); }}>❮</button>
            )}
            {images.length > 1 && currentIndex < images.length - 1 && (
                <button className="nav-btn next" onClick={(e) => { e.stopPropagation(); setCurrentIndex(v => v + 1); resetZoom(); }}>❯</button>
            )}

              
            <div 
                className="img-viewport"
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            >
                <div 
                    className="img-transform-layer"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                    }}
                >
                    {isVid ? (
                        <video 
                            src={currentItem.url} 
                            controls 
                            autoPlay 
                            className="modal-media-node"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <img 
                            ref={imgRef}
                            src={currentItem.url} 
                            alt="Full size" 
                            className="modal-media-node"
                            onDoubleClick={() => scale > 1 ? resetZoom() : setScale(2.5)}
                            draggable="false"
                        />
                    )}
                </div>
            </div>

              
            <div className="img-modal-footer">
                Ctrl + Wheel для масштаба • Перетаскивайте зажатой мышкой
            </div>
        </div>
    );
};

export default ImageModal;