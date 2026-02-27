/* @source src/components/modals/ImageModal.jsx */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useModalStore } from '../../store/modalStore';
import { AltArrowLeft, AltArrowRight, CloseCircle, DownloadSquare } from "@solar-icons/react";
import '../../styles/ImageModal.css';

const isVideo = (att) => {
    if (!att) return false;
    const type = att.mimeType || att.type || '';
    const url = att.url || '';
    return type.startsWith('video/') || url.toLowerCase().match(/\.(mp4|webm|mov)(\?|$)/);
};

const ImageModal = ({ images, initialIndex = 0 }) => {
    const closeModal = useModalStore(state => state.closeModal);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    
    
    const [scale, setScale] = useState(1);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [start, setStart] = useState({ x: 0, y: 0 });
    
    
    const [touchStart, setTouchStart] = useState(null);
    const [swipeOffset, setSwipeOffset] = useState(0);

    const viewportRef = useRef(null);
    const currentItem = images[currentIndex];
    const [currentSrc, setCurrentSrc] = useState('');

    useEffect(() => {
        setScale(1);
        setPos({ x: 0, y: 0 });
        setSwipeOffset(0);
        if (images[currentIndex]) {
            setCurrentSrc(images[currentIndex].url);
        }
    }, [currentIndex, images]);

    const handleError = useCallback(() => {
        if (currentSrc && currentSrc.startsWith('asset://')) {
            try {
                const urlObj = new URL(currentSrc);
                const originalUrl = urlObj.searchParams.get('url');
                if (originalUrl) {
                    setCurrentSrc(decodeURIComponent(originalUrl));
                }
            } catch (e) {
                console.error(e);
            }
        }
    }, [currentSrc]);

    const goNext = useCallback(() => { 
        if (currentIndex < images.length - 1) setCurrentIndex(c => c + 1); 
    }, [currentIndex, images.length]);

    const goPrev = useCallback(() => { 
        if (currentIndex > 0) setCurrentIndex(c => c - 1); 
    }, [currentIndex]);

    
    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const handleNativeWheel = (e) => {
            e.preventDefault(); 
            setScale(s => {
                if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && s === 1) {
                    if (e.deltaX > 20) goNext();
                    if (e.deltaX < -20) goPrev();
                    return s;
                }
                const delta = e.deltaY > 0 ? -0.15 : 0.15;
                return Math.min(Math.max(s + delta, 1), 5);
            });
        };

        viewport.addEventListener('wheel', handleNativeWheel, { passive: false });
        return () => viewport.removeEventListener('wheel', handleNativeWheel);
    }, [goNext, goPrev]);

    
    useEffect(() => {
        const handleKeys = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                closeModal();
            }
            if (scale === 1) {
                if (e.key === 'ArrowRight') {
                    e.preventDefault(); 
                    goNext();
                }
                if (e.key === 'ArrowLeft') {
                    e.preventDefault(); 
                    goPrev();
                }
            }
        };
        
        window.addEventListener('keydown', handleKeys, { capture: true });
        return () => window.removeEventListener('keydown', handleKeys, { capture: true });
    }, [scale, closeModal, goNext, goPrev]);

    
    const handleTouchStart = (e) => {
        if (scale > 1) return;
        setTouchStart(e.touches[0].clientX);
    };

    const handleTouchMove = (e) => {
        if (scale > 1 || touchStart === null) return;
        const currentX = e.touches[0].clientX;
        setSwipeOffset(currentX - touchStart);
    };

    const handleTouchEnd = () => {
        if (scale > 1 || touchStart === null) return;
        if (swipeOffset > 70) goPrev();
        else if (swipeOffset < -70) goNext();
        
        setTouchStart(null);
        setSwipeOffset(0);
    };

    
    const handleMouseDown = (e) => { 
        if(scale > 1) { 
            e.stopPropagation();
            setIsDragging(true); 
            setStart({ x: e.clientX - pos.x, y: e.clientY - pos.y }); 
        } 
    };

    const handleMouseMove = (e) => { 
        if(isDragging && scale > 1) {
            e.stopPropagation();
            setPos({ x: e.clientX - start.x, y: e.clientY - start.y }); 
        }
    };

    if (!currentItem) return null;

    return (
        <div className="img-full-viewer" onClick={closeModal}>
            <div className="img-overlay-gradient top" />

            
            <div className="img-full-header" onClick={e => e.stopPropagation()}>
                <div className="img-counter-badge">
                    {currentIndex + 1} / {images.length}
                </div>
                
                <div className="img-btns-right">
                    <button 
                        className="img-action-btn" 
                        onClick={() => window.api.downloadFile(currentSrc)}
                        title="Скачать"
                    >
                        <DownloadSquare size={22} />
                    </button>
                    <button 
                        className="img-action-btn close" 
                        onClick={closeModal}
                        title="Закрыть"
                    >
                        <CloseCircle size={22} />
                    </button>
                </div>
            </div>

            
            {images.length > 1 && scale === 1 && (
                <>
                    <button 
                        className={`nav-side left ${currentIndex === 0 ? 'hide' : ''}`} 
                        onClick={(e) => { e.stopPropagation(); goPrev(); }}
                    >
                        <AltArrowLeft size={28} />
                    </button>
                    <button 
                        className={`nav-side right ${currentIndex === images.length - 1 ? 'hide' : ''}`} 
                        onClick={(e) => { e.stopPropagation(); goNext(); }}
                    >
                        <AltArrowRight size={28} />
                    </button>
                </>
            )}

            
            <div 
                className="img-full-viewport"
                ref={viewportRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={(e) => { e.stopPropagation(); if(scale === 1) closeModal(); }}
            >
                <div 
                    className="img-full-container"
                    style={{ 
                        transform: `translate(${scale > 1 ? pos.x : swipeOffset}px, ${pos.y}px) scale(${scale})`,
                        transition: isDragging || touchStart !== null ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
                    }}
                >
                    {isVideo(currentItem) ? (
                        <video 
                            key={currentSrc} 
                            src={currentSrc} 
                            controls 
                            autoPlay 
                            onClick={e => e.stopPropagation()} 
                            onError={handleError}
                            className="img-content-element"
                        />
                    ) : (
                        <img 
                            key={currentSrc} 
                            src={currentSrc} 
                            alt="" 
                            className="img-content-element"
                            onDoubleClick={(e) => { e.stopPropagation(); setScale(scale > 1 ? 1 : 2.5); setPos({x:0, y:0}); }}
                            onError={handleError}
                            draggable={false}
                        />
                    )}
                </div>
            </div>

            
            {images.length > 1 && scale === 1 && (
                <div className="img-gallery-dots" onClick={e => e.stopPropagation()}>
                    {images.map((_, idx) => (
                        <button 
                            key={idx} 
                            className={`img-dot ${idx === currentIndex ? 'active' : ''}`}
                            onClick={() => setCurrentIndex(idx)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageModal;