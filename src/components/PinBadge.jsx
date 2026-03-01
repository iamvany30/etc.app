/* @source src/components/PinBadge.jsx */
import React, { useState, useEffect } from 'react';
import Tooltip from './Tooltip';
import { getCachedUrl } from '../utils/assetHelper';


const SITE_DOMAIN = 'https://xn--d1ah4a.com';

const PinBadge = ({ pin, size = 16, style = {} }) => {
    const [imgSrc, setImgSrc] = useState(null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (!pin) return;
        
        const slug = typeof pin === 'string' ? pin : pin.slug;
        const remoteUrl = `${SITE_DOMAIN}/assets/pins/${slug}.png`;
        
        
        setImgSrc(getCachedUrl(remoteUrl));
    }, [pin]);

    if (!pin || hasError || !imgSrc) return null;

    const name = typeof pin === 'object' && pin.name ? pin.name : 'Эксклюзивный пин';
    const desc = typeof pin === 'object' && pin.description ? pin.description : null;

    const tooltipContent = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
            <div style={{ fontSize: '13px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Пин:</span> {name}
            </div>
            {desc && (
                <div style={{ fontSize: '12px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Ивент:</span> {desc}
                </div>
            )}
        </div>
    );

    return (
        <Tooltip content={tooltipContent}>
            <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '4px', cursor: 'help', ...style }}>
                <img
                    src={imgSrc}
                    alt={name}
                    style={{
                        width: size,
                        height: size,
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))',
                    }}
                    onError={() => setHasError(true)}
                />
            </span>
        </Tooltip>
    );
};

export default PinBadge;