/* @source ModalContext.js */
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import '../styles/Modal.css';

const ModalContext = createContext();

const ModalManager = ({ isOpen, close, content, variant }) => {
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
            if (e.key === 'Escape' && isOpen) close();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, close]);

    
    const handleMouseDown = (e) => {
        mouseDownOnOverlay.current = e.target === e.currentTarget;
    };

    const handleMouseUp = (e) => {
        if (mouseDownOnOverlay.current && e.target === e.currentTarget) {
            close();
        }
        mouseDownOnOverlay.current = false;
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div 
            className={`modal-overlay ${isVisible ? 'active' : ''}`} 
            ref={overlayRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
        >
            <div 
                className={`modal-content ${variant || 'glass'} ${isVisible ? 'active' : ''}`} 
                onMouseDown={(e) => e.stopPropagation()} 
                onMouseUp={(e) => e.stopPropagation()}
            >
                {variant !== 'fullscreen' && (
                    <button className="modal-close-btn" onClick={close} title="Закрыть (Esc)">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                )}
                
                <div className="modal-body-wrapper">
                    <div className="modal-body">
                        {content}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export const ModalProvider = ({ children }) => {
    const [state, setState] = useState({
        isOpen: false,
        content: null,
        variant: 'glass'
    });

    const openModal = useCallback((content, options = {}) => {
        setState({
            isOpen: true,
            content,
            variant: options.variant || 'glass'
        });
    }, []);

    const closeModal = useCallback(() => {
        setState(prev => ({ ...prev, isOpen: false }));
        
        setTimeout(() => {
            setState({ isOpen: false, content: null, variant: 'glass' });
        }, 300);
    }, []);

    return (
        <ModalContext.Provider value={{ openModal, closeModal }}>
            {children}
            <ModalManager 
                isOpen={state.isOpen} 
                close={closeModal} 
                content={state.content} 
                variant={state.variant} 
            />
        </ModalContext.Provider>
    );
};

export const useModal = () => useContext(ModalContext);
export default ModalProvider;