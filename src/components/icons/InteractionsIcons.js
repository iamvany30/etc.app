import React from 'react';
import { ChatRoundDots, Repeat, Heart, Eye, Plain } from "@solar-icons/react";

export const CommentIcon = (props) => <ChatRoundDots size={20} {...props} />;
export const RepostIcon = (props) => <Repeat size={20} {...props} />;
export const LikeIcon = ({ active = false, ...props }) => (
    <Heart 
        size={20} 
        {...props} 
        variant={active ? "linear" : "outline"}
        color={active ? "#E0245E" : "currentColor"}
    />
);
export const ViewIcon = (props) => <Eye size={18} {...props} />;
export const SendIcon = (props) => <Plain size={18} {...props} />;