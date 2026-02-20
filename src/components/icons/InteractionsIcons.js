
import React from 'react';
import IconWrapper from './IconWrapper';
import { ChatRoundDots, Repeat, Heart, Eye, Plain, Bookmark } from "@solar-icons/react";


export const CommentIcon = (props) => <IconWrapper IconComponent={ChatRoundDots} size={20} {...props} />;
export const RepostIcon = (props) => <IconWrapper IconComponent={Repeat} size={20} {...props} />;
export const ViewIcon = (props) => <IconWrapper IconComponent={Eye} size={18} {...props} />;
export const SendIcon = (props) => <IconWrapper IconComponent={Plain} size={18} {...props} />;


export const LikeIcon = ({ active = false, ...props }) => (
    <IconWrapper 
        IconComponent={Heart} 
        size={20} 
        variant={active ? "bold" : undefined} 
        color={active ? "#f91880" : "currentColor"}
        {...props} 
    />
);

export const BookmarkIcon = ({ active = false, ...props }) => (
    <IconWrapper 
        IconComponent={Bookmark} 
        size={20} 
        variant={active ? "bold" : undefined} 
        color={active ? "var(--color-primary)" : "currentColor"}
        {...props} 
    />
);