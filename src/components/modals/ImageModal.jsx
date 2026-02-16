/* @source src/components/modals/ImageModal.jsx */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useModal } from '../../context/ModalContext';
import '../../styles/ImageModal.css';


const DownloadIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const ChevronLeft = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>;
const ChevronRight = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>;

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
    
    
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef(null);

    
    useEffect(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, [currentIndex]);

    
    const resetControlsTimeout = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (scale === 1 && !isVideo(images[currentIndex])) { 
                
                setShowControls(false); 
            }
        }, 3000);
    }, [scale, currentIndex, images]);

    useEffect(() => {
        window.addEventListener('mousemove', resetControlsTimeout);
        resetControlsTimeout();
        return () => window.removeEventListener('mousemove', resetControlsTimeout);
    }, [resetControlsTimeout]);

    
    const handleNext = (e) => {
        e?.stopPropagation();
        if (currentIndex < images.length - 1) setCurrentIndex(prev => prev + 1);
    };

    const handlePrev = (e) => {
        e?.stopPropagation();
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') closeModal();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === '+' || e.key === '=') setScale(s => Math.min(s + 0.5, 5));
            if (e.key === '-') setScale(s => Math.max(s - 0.5, 1));
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex]); 

    
    const handleWheel = (e) => {
        if (e.ctrlKey || scale > 1) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.2 : 0.2;
            setScale(prev => Math.min(Math.max(prev + delta, 1), 5));
        }
    };

    
    const onMouseDown = (e) => {
        if (scale > 1) {
            e.preventDefault();
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const onMouseMove = (e) => {
        if (isDragging && scale > 1) {
            e.preventDefault();
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
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
        <div 
            className="img-modal-overlay" 
            onWheel={handleWheel}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onClick={() => setShowControls(!showControls)} 
        >
            {}
            <div className={`img-modal-toolbar ${showControls ? 'visible' : ''}`} onClick={e => e.stopPropagation()}>
                <div className="img-counter">
                    {images.length > 1 && <span>{currentIndex + 1} / {images.length}</span>}
                </div>

                <div className="img-actions">
                    {scale > 1 && (
                        <button className="img-action-btn glass" onClick={() => { setScale(1); setPosition({x:0, y:0}); }}>
                            {Math.round(scale * 100)}%
                        </button>
                    )}
                    <button className="img-action-btn" onClick={handleDownload} title="Скачать">
                        <DownloadIcon />
                    </button>
                    <button className="img-action-btn close" onClick={closeModal} title="Закрыть">
                        <CloseIcon />
                    </button>
                </div>
            </div>

            {}
            {images.length > 1 && (
                <>
                    <button 
                        className={`img-nav-btn prev ${currentIndex === 0 ? 'disabled' : ''} ${showControls ? 'visible' : ''}`} 
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                    >
                        <ChevronLeft />
                    </button>
                    <button 
                        className={`img-nav-btn next ${currentIndex === images.length - 1 ? 'disabled' : ''} ${showControls ? 'visible' : ''}`} 
                        onClick={handleNext}
                        disabled={currentIndex === images.length - 1}
                    >
                        <ChevronRight />
                    </button>
                </>
            )}

            {}
            <div 
                className="img-viewport"
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                style={{ 
                    cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' 
                }}
            >
                <div 
                    className="img-transform-layer"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
                    }}
                >
                    {isVid ? (
                        <video 
                            src={currentItem.url} 
                            controls 
                            autoPlay 
                            className="modal-media-node video"
                            onClick={(e) => e.stopPropagation()} 
                        />
                    ) : (
                        <img 
                            src={currentItem.url} 
                            alt="Full view" 
                            className="modal-media-node image"
                            draggable="false"
                            onClick={(e) => e.stopPropagation()} 
                            onDoubleClick={() => scale > 1 ? setScale(1) : setScale(2)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageModal;