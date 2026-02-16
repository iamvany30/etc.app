import React from 'react';
import { MenuDots, Share, Pen, TrashBinMinimalistic, Pin } from "@solar-icons/react";

export const MoreIcon = (props) => <MenuDots size={20} {...props} />;
export const ShareIcon = (props) => <Share size={18} {...props} />;
export const EditIcon = (props) => <Pen size={18} {...props} />;
export const DeleteIcon = (props) => <TrashBinMinimalistic size={18} {...props} />;

export const PinIcon = ({ pinned, ...props }) => (
    <Pin 
        size={18} 
        {...props} 
        style={{ transform: pinned ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}
    />
);