import React, { createContext, useContext, useState, useCallback } from 'react';
import '../styles/Modal.css';

const ModalContext = createContext();

const ModalManager = ({ isOpen, close, content }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={close}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                { }
                <button className="modal-close-btn" onClick={close} title="Закрыть">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                
                { }
                <div className="modal-body">
                    {content}
                </div>
            </div>
        </div>
    );
};

export const ModalProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);

    const openModal = useCallback((content) => {
        setModalContent(content);
        setIsOpen(true);
         
         
        if (typeof document !== 'undefined') {
              
        }
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
        setModalContent(null);
        if (typeof document !== 'undefined') {
              
        }
    }, []);

    return (
        <ModalContext.Provider value={{ openModal, closeModal }}>
            {children}
            <ModalManager isOpen={isOpen} close={closeModal} content={modalContent} />
        </ModalContext.Provider>
    );
};

export const useModal = () => useContext(ModalContext);