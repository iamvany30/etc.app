/* @source src/components/modals/ImageModal.jsx */
import React, { useState, useEffect } from 'react';
import { useModalStore } from '../../store/modalStore';
import { AltArrowLeft, AltArrowRight, CloseCircle, DownloadSquare } from "@solar-icons/react";
import '../../styles/ImageModal.css';

const isVideo = (att) => {
    const type = att.mimeType || att.type || '';
    const url = att.url || '';
    return type.startsWith('video/') || url.toLowerCase().endsWith('.mp4');
};

const ImageModal = ({ images, initialIndex = 0 }) => {
    const closeModal = useModalStore(state => state.closeModal);
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
    }, [currentIndex, scale, closeModal]);

    if (!currentItem) return null;

    return (
        <div className="img-full-viewer" onClick={closeModal}>
            {}
            <div className="img-overlay-gradient top" />

            <div className="img-full-header" onClick={e => e.stopPropagation()}>
                {}
                <div className="img-counter-badge">
                    {currentIndex + 1} / {images.length}
                </div>
                
                {}
                <div className="img-btns-right">
                    <button 
                        className="img-action-btn" 
                        onClick={() => window.api.downloadFile(currentItem.url)}
                        title="Скачать"
                    >
                        <DownloadSquare size={24} />
                    </button>
                    <button 
                        className="img-action-btn close" 
                        onClick={closeModal}
                        title="Закрыть"
                    >
                        <CloseCircle size={24} />
                    </button>
                </div>
            </div>

            {}
            {images.length > 1 && scale === 1 && (
                <>
                    <button 
                        className={`nav-side left ${currentIndex === 0 ? 'hide' : ''}`} 
                        onClick={(e) => { e.stopPropagation(); goPrev(); }}
                    >
                        <AltArrowLeft size={32} />
                    </button>
                    <button 
                        className={`nav-side right ${currentIndex === images.length - 1 ? 'hide' : ''}`} 
                        onClick={(e) => { e.stopPropagation(); goNext(); }}
                    >
                        <AltArrowRight size={32} />
                    </button>
                </>
            )}

            {}
            <div 
                className="img-full-viewport"
                onWheel={(e) => {
                    e.stopPropagation();
                    setScale(s => Math.min(Math.max(s + (e.deltaY > 0 ? -0.2 : 0.2), 1), 5));
                }}
                onMouseDown={(e) => { 
                    if(scale > 1) { 
                        e.stopPropagation();
                        setIsDragging(true); 
                        setStart({ x: e.clientX - pos.x, y: e.clientY - pos.y }); 
                    } 
                }}
                onMouseMove={(e) => { 
                    if(isDragging) {
                        e.stopPropagation();
                        setPos({ x: e.clientX - start.x, y: e.clientY - start.y }); 
                    }
                }}
                onMouseUp={() => setIsDragging(false)}
                onClick={(e) => { e.stopPropagation(); if(scale === 1) closeModal(); }}
            >
                <div 
                    className="img-full-container"
                    style={{ 
                        transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                        transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
                    }}
                >
                    {isVideo(currentItem) ? (
                        <video 
                            src={currentItem.url} 
                            controls 
                            autoPlay 
                            onClick={e => e.stopPropagation()} 
                            className="img-content-element"
                        />
                    ) : (
                        <img 
                            src={currentItem.url} 
                            alt="" 
                            className="img-content-element"
                            onDoubleClick={(e) => { e.stopPropagation(); setScale(scale > 1 ? 1 : 2.5); setPos({x:0, y:0}); }}
                            draggable={false}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageModal;