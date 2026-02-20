import React, { useState, useEffect } from 'react';
import { useModal } from '../../context/ModalContext';
import '../../styles/ImageModal.css';

const isVideo = (att) => {
    const type = att.mimeType || att.type || '';
    const url = att.url || '';
    return type.startsWith('video/') || url.toLowerCase().endsWith('.mp4');
};

const ImageModal = ({ images, initialIndex = 0 }) => {
    const { closeModal } = useModal();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [scale, setScale] = useState(1);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [start, setStart] = useState({ x: 0, y: 0 });

    const currentItem = images[currentIndex];

    useEffect(() => {
        setScale(1);
        setPos({ x: 0, y: 0 });
    }, [currentIndex]);

    
    const goNext = (e) => { e?.stopPropagation(); if (currentIndex < images.length - 1) setCurrentIndex(c => c + 1); };
    const goPrev = (e) => { e?.stopPropagation(); if (currentIndex > 0) setCurrentIndex(c => c - 1); };

    useEffect(() => {
        const handleKeys = (e) => {
            if (e.key === 'Escape') closeModal();
            if (scale === 1) {
                if (e.key === 'ArrowRight') goNext();
                if (e.key === 'ArrowLeft') goPrev();
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [currentIndex, scale]);

    if (!currentItem) return null;

    return (
        <div className="img-full-viewer">
            {}
            <div className="img-full-header">
                <span className="img-count">{currentIndex + 1} / {images.length}</span>
                <div className="img-btns">
                    <button className="img-btn" onClick={() => window.api.downloadFile(currentItem.url)}>💾</button>
                    <button className="img-btn close" onClick={closeModal}>✕</button>
                </div>
            </div>

            {}
            {images.length > 1 && scale === 1 && (
                <>
                    <button className={`nav-side left ${currentIndex === 0 ? 'hide' : ''}`} onClick={goPrev}>‹</button>
                    <button className={`nav-side right ${currentIndex === images.length - 1 ? 'hide' : ''}`} onClick={goNext}>›</button>
                </>
            )}

            {}
            <div 
                className="img-full-viewport"
                onWheel={(e) => setScale(s => Math.min(Math.max(s + (e.deltaY > 0 ? -0.3 : 0.3), 1), 5))}
                onMouseDown={(e) => { if(scale > 1) { setIsDragging(true); setStart({ x: e.clientX - pos.x, y: e.clientY - pos.y }); } }}
                onMouseMove={(e) => { if(isDragging) setPos({ x: e.clientX - start.x, y: e.clientY - start.y }); }}
                onMouseUp={() => setIsDragging(false)}
                onClick={() => { if(scale === 1) closeModal(); }}
            >
                <div 
                    className="img-full-container"
                    style={{ 
                        transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                    }}
                >
                    {isVideo(currentItem) ? (
                        <video src={currentItem.url} controls autoPlay onClick={e => e.stopPropagation()} />
                    ) : (
                        <img 
                            src={currentItem.url} 
                            alt="" 
                            onClick={e => e.stopPropagation()}
                            onDoubleClick={(e) => { e.stopPropagation(); setScale(scale > 1 ? 1 : 2.5); setPos({x:0, y:0}); }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageModal;