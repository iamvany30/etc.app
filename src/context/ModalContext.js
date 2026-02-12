import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import '../styles/Modal.css';

const ModalContext = createContext();

const ModalManager = ({ isOpen, close, content, variant }) => {
    /**
     * Логика управления жизненным циклом модального окна:
     * 1. Блокировка прокрутки фона.
     * 2. Обработка клавиши Escape.
     */
    useEffect(() => {
        const handleKeyDown = (e) => {
             
            if (e.key === 'Escape' && isOpen) {
                close();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            
             
            document.body.style.overflow = 'hidden';
            
            /**
             * Если это стандартная модалка (не полноэкранная), добавляем отступ,
             * чтобы контент приложения не дергался из-за исчезновения полосы прокрутки.
             */
            if (variant !== 'fullscreen') {
                document.body.style.paddingRight = '8px'; 
            }
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
             
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [isOpen, close, variant]);

    if (!isOpen) return null;

    /**
     * Динамическое формирование классов.
     * glass - стандарт (настройки, профиль)
     * liquid - премиальный эффект с пятнами
     * fullscreen - парящая галерея с блюром по бокам
     */
    let containerClasses = ['modal-content'];
    if (variant === 'fullscreen') {
        containerClasses.push('fullscreen');
    } else if (variant === 'liquid') {
        containerClasses.push('liquid');
    } else {
        containerClasses.push('glass');
    }

    return (
        <div className="modal-overlay" onClick={close}>
            <div 
                className={containerClasses.join(' ')} 
                onClick={(e) => e.stopPropagation()}
            >
                { }
                {variant === 'liquid' && (
                    <>
                        <div className="liquid-blob blob-1"></div>
                        <div className="liquid-blob blob-2"></div>
                        <div className="liquid-blob blob-3"></div>
                    </>
                )}

                {/* 
                  Стандартная кнопка закрытия (крестик).
                  В режиме fullscreen (галерея) мы её скрываем, так как 
                  ImageModal имеет свои собственные стильные кнопки управления.
                */}
                {variant !== 'fullscreen' && (
                    <button className="modal-close-btn" onClick={close} title="Закрыть (Esc)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                )}
                
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
    const [modalVariant, setModalVariant] = useState('glass'); 

    /**
     * Универсальная функция для открытия модалок.
     * @param {React.ReactNode} content - Компонент, который нужно отрисовать.
     * @param {Object} options - Настройки окна { variant: 'glass' | 'liquid' | 'fullscreen' }.
     */
    const openModal = useCallback((content, options = {}) => {
        setModalContent(content);
        setModalVariant(options.variant || 'glass'); 
        setIsOpen(true);
    }, []);

    /**
     * Закрытие модалки с задержкой, чтобы успела проиграться CSS-анимация.
     */
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

/**
 * Хук для использования контекста модалок в любом компоненте.
 */
export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};

export default ModalProvider;