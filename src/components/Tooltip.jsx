/* @source src/components/Tooltip.jsx */
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import '../styles/Tooltip.css';

const Tooltip = ({ content, children }) => {
    const [tooltipState, setTooltipState] = useState({ 
        visible: false, 
        x: 0, 
        y: 0 
    });

    const handleMouseEnter = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipState({
            visible: true,
            x: rect.left + rect.width / 2,
            y: rect.top - 8 
        });
    };

    const handleMouseLeave = () => {
        setTooltipState(prev => ({ ...prev, visible: false }));
    };

    return (
        <>
            <span 
                onMouseEnter={handleMouseEnter} 
                onMouseLeave={handleMouseLeave}
                style={{ display: 'inline-flex', alignItems: 'center' }}
            >
                {children}
            </span>

            {tooltipState.visible && ReactDOM.createPortal(
                <div 
                    className="global-tooltip"
                    style={{
                        top: tooltipState.y,
                        left: tooltipState.x,
                    }}
                >
                    {content}
                </div>,
                document.body
            )}
        </>
    );
};

export default Tooltip;