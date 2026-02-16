import React from 'react';
import ReactDOM from 'react-dom';
import '../styles/ContextMenu.css';

const ContextMenu = ({ isOpen, x, y, items, onClose }) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <>
            {}
            <div className="context-menu-backdrop" onClick={onClose} />
            
            <div 
                className="context-menu-container" 
                style={{ top: y, left: x }}
                
                
                onMouseDown={(e) => e.stopPropagation()}
            >
                {items.map((item, index) => {
                    if (item.isSeparator) return <div key={index} className="context-menu-separator" />;
                    if (item.isLabel) return <div key={index} className="context-menu-label">{item.label}</div>;

                    return (
                        <button
                            key={index}
                            className={`context-menu-item ${item.type || ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (item.action) item.action();
                                onClose(); 
                            }}
                        >
                            <div className="context-menu-item-left">
                                {item.icon && <span className="context-menu-icon">{item.icon}</span>}
                                <span>{item.label}</span>
                            </div>
                            {item.shortcut && <span className="context-menu-shortcut">{item.shortcut}</span>}
                        </button>
                    );
                })}
            </div>
        </>,
        document.body
    );
};

export default ContextMenu;