/* @source src/components/ModalManager.jsx */
import React, { useEffect, useRef, useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useModalStore } from '../store/modalStore';
import { ModalCloseIcon } from './icons/CustomIcons';
import '../styles/Modal.css';

const ModalManager = () => {
    const { isOpen, content, variant, closeModal } = useModalStore();
    const overlayRef = useRef(null);
    const mouseDownOnOverlay = useRef(false);
    const [isVisible, setIsVisible] = useState(false);

    
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setIsVisible(true), 10);
            document.body.classList.add('modal-open');
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
            document.body.classList.remove('modal-open');
        }
    }, [isOpen]);

    
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) closeModal();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closeModal]);

    
    const handleMouseDown = (e) => {
        mouseDownOnOverlay.current = e.target === e.currentTarget;
    };

    const handleMouseUp = (e) => {
        if (mouseDownOnOverlay.current && e.target === e.currentTarget) {
            closeModal();
        }
        mouseDownOnOverlay.current = false;
    };

    
    
    const contentKey = useMemo(() => {
        if (!content) return 'empty';
        return content.type?.name || (typeof content.type === 'string' ? content.type : Math.random().toString());
    }, [content]);

    if (!isOpen && !isVisible) return null;

    return ReactDOM.createPortal(
        <div 
            className={`modal-overlay ${isVisible ? 'active' : ''}`} 
            ref={overlayRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            style={{ zIndex: 'var(--z-modal-overlay)' }} 
        >
            <div 
                className={`modal-content ${variant || 'glass'} ${isVisible ? 'active' : ''}`} 
                onMouseDown={(e) => e.stopPropagation()} 
                onMouseUp={(e) => e.stopPropagation()}
            >
                {variant !== 'fullscreen' && (
                    <button className="modal-close-btn" onClick={closeModal} title="Закрыть (Esc)">
                        <ModalCloseIcon />
                    </button>
                )}
                
                <div className="modal-body-wrapper" key={contentKey}>
                    <div className="modal-body">
                        {content}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ModalManager;