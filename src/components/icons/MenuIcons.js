import React from 'react';
import IconWrapper from './IconWrapper';
import { MenuDots, Share, Pen, TrashBinMinimalistic, Pin, Flag } from "@solar-icons/react";

export const MoreIcon = (props) => <IconWrapper IconComponent={MenuDots} size={20} {...props} />;
export const ShareIcon = (props) => <IconWrapper IconComponent={Share} size={18} {...props} />;
export const EditIcon = (props) => <IconWrapper IconComponent={Pen} size={18} {...props} />;
export const DeleteIcon = (props) => <IconWrapper IconComponent={TrashBinMinimalistic} size={18} {...props} />;
export const ReportIcon = (props) => <IconWrapper IconComponent={Flag} size={18} {...props} />;

export const PinIcon = ({ pinned, ...props }) => (
    <IconWrapper 
        IconComponent={Pin} 
        size={18} 
        {...props} 
        style={{ 
            transform: pinned ? 'rotate(45deg)' : 'none', 
            transition: 'transform 0.2s',
            ...props.style 
        }}
    />
);