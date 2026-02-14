import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useLayoutEffect } from 'react';
import '../styles/Modal.css';

const ModalContext = createContext();

const ModalManager = ({ isOpen, close, content, variant }) => {
    const contentRef = useRef(null);
    const [containerHeight, setContainerHeight] = useState('auto');
    const [opacity, setOpacity] = useState(0);

     
    useEffect(() => {
        if (isOpen) {
             
            requestAnimationFrame(() => setOpacity(1));
        } else {
            setOpacity(0);
            setContainerHeight('auto');
        }
    }, [isOpen]);

     
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) close();
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
            if (variant !== 'fullscreen') document.body.style.paddingRight = '8px';
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [isOpen, close, variant]);

     
     
     
    useLayoutEffect(() => {
        if (!contentRef.current || variant === 'fullscreen') return;

        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                 
                const height = entry.borderBoxSize 
                    ? entry.borderBoxSize[0].blockSize 
                    : entry.target.getBoundingClientRect().height;

                 
                const maxHeight = window.innerHeight * 0.85;
                const finalHeight = Math.min(height, maxHeight);
                
                setContainerHeight(`${finalHeight}px`);
            }
        });

        observer.observe(contentRef.current);

        return () => observer.disconnect();
    }, [content, variant]);  

    if (!isOpen) return null;

    let containerClasses = ['modal-content'];
    if (variant === 'fullscreen') containerClasses.push('fullscreen');
    else if (variant === 'liquid') containerClasses.push('liquid');
    else containerClasses.push('glass');

    return (
        <div className="modal-overlay" onClick={close}>
            <div 
                className={containerClasses.join(' ')} 
                onClick={(e) => e.stopPropagation()}
                style={{ 
                     
                    height: variant === 'fullscreen' ? '95vh' : containerHeight 
                }}
            >
                {variant === 'liquid' && (
                    <>
                        <div className="liquid-blob blob-1"></div>
                        <div className="liquid-blob blob-2"></div>
                        <div className="liquid-blob blob-3"></div>
                    </>
                )}

                {variant !== 'fullscreen' && (
                    <button className="modal-close-btn" onClick={close} title="Закрыть (Esc)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                )}
                
                  
                <div 
                    className="modal-body-wrapper" 
                    ref={contentRef}
                    style={{ opacity: opacity, transition: 'opacity 0.2s ease-in-out' }}
                >
                    <div className="modal-body">
                        {content}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ModalProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [modalVariant, setModalVariant] = useState('glass'); 

    const openModal = useCallback((content, options = {}) => {
        setModalContent(content);
        setModalVariant(options.variant || 'glass'); 
        setIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
        setTimeout(() => {
            setModalContent(null);
            setModalVariant('glass');
        }, 300);
    }, []);

    return (
        <ModalContext.Provider value={{ openModal, closeModal }}>
            {children}
            <ModalManager 
                isOpen={isOpen} 
                close={closeModal} 
                content={modalContent} 
                variant={modalVariant}
            />
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) throw new Error('useModal must be used within a ModalProvider');
    return context;
};

export default ModalProvider;