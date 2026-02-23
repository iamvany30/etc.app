import React from 'react';
import { useAppearanceStore } from '../../store/appearanceStore';

const VARIANT_MAP = {
    linear: 'Linear',
    bold: 'Bold',
    broken: 'Broken',
    bulk: 'Bulk',
    outline: 'Outline',
    twotone: 'TwoTone'
};

const IconWrapper = ({ IconComponent, variant, ...props }) => {
    
    const iconStyle = useAppearanceStore(state => state.iconStyle);

    
    
    const rawStyle = variant || iconStyle || 'linear';
    
    
    const targetStyle = String(rawStyle).toLowerCase();
    const solarVariant = VARIANT_MAP[targetStyle] || 'Linear';

    if (!IconComponent) return null;

    return (
        <span className="icon-wrapper-solar" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconComponent {...props} variant={solarVariant} />
        </span>
    );
};

export default IconWrapper;