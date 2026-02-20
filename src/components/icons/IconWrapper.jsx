import React from 'react';
import { useAppearance } from '../../context/AppearanceContext';

const VARIANT_MAP = {
    linear: 'Linear',
    bold: 'Bold',
    broken: 'Broken',
    bulk: 'Bulk',
    outline: 'Outline',
    twotone: 'TwoTone'
};

const IconWrapper = ({ IconComponent, variant, ...props }) => {
    const { iconStyle } = useAppearance();

    const rawStyle = variant || iconStyle || 'linear';
    const targetStyle = String(rawStyle).toLowerCase();
    const solarVariant = VARIANT_MAP[targetStyle] || 'Linear';

    if (!IconComponent) return null;

    
    return (
        <span className="icon-wrapper-solar">
            <IconComponent {...props} variant={solarVariant} />
        </span>
    );
};

export default IconWrapper;