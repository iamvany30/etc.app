import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { VerifiedBlue, VerifiedGold, VerifiedGreen } from './icons/VerifyIcons'; 
const VerifiedBadgeWithTooltip = ({ type, size = 20, style }) => {
    const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });

    const badgeConfig = {
        blue: {
            component: VerifiedBlue,
            text: 'Официальный аккаунт'
        },
        gold: {
            component: VerifiedGold,
            text: 'Разработчик итд.app'
        },
        green: {
            component: VerifiedGreen,
            text: 'ITD+ Пользователь'
        }
    };

    const config = badgeConfig[type];
    if (!config) return null;

    const BadgeComponent = config.component;

    const handleMouseEnter = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
            visible: true,
            text: config.text,
            x: rect.left + rect.width / 2,
            y: rect.top - 8 
        });
    };

    const handleMouseLeave = () => {
        setTooltip(prev => ({ ...prev, visible: false }));
    };

    return (
        <>
            <span
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                    cursor: 'help',
                    display: 'inline-flex',
                    alignItems: 'center',
                    ...style
                }}
            >
                <BadgeComponent size={size} />
            </span>

            {tooltip.visible && ReactDOM.createPortal(
                <div style={{
                    position: 'fixed',
                    top: tooltip.y,
                    left: tooltip.x,
                    transform: 'translate(-50%, -100%)', 
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    zIndex: 99999,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    animation: 'tooltipFadeIn 0.2s ease forwards'
                }}>
                    {tooltip.text}
                    <div style={{
                        position: 'absolute',
                        bottom: '-5px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderTop: '5px solid rgba(0, 0, 0, 0.9)'
                    }} />
                    {}
                    <style>{`
                        @keyframes tooltipFadeIn {
                            from { opacity: 0; transform: translate(-50%, -90%); }
                            to { opacity: 1; transform: translate(-50%, -100%); }
                        }
                    `}</style>
                </div>,
                document.body
            )}
        </>
    );
};

export default VerifiedBadgeWithTooltip;