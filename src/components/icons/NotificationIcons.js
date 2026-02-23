import React from 'react';
import IconWrapper from './IconWrapper'; 
import { Heart, ChatRoundDots, Repeat, User, Letter, DocumentText } from "@solar-icons/react";

const ICON_SIZE = 16; 


export const IconLikeFilled = (props) => <IconWrapper IconComponent={Heart} variant="Bold" size={ICON_SIZE} {...props} />;
export const IconCommentFilled = (props) => <IconWrapper IconComponent={ChatRoundDots} variant="Bold" size={ICON_SIZE} {...props} />;
export const IconRepostFilled = (props) => <IconWrapper IconComponent={Repeat} variant="Bold" size={ICON_SIZE} {...props} />;
export const IconUserFilled = (props) => <IconWrapper IconComponent={User} variant="Bold" size={ICON_SIZE} {...props} />;
export const IconMentionFilled = (props) => <IconWrapper IconComponent={Letter} variant="Bold" size={ICON_SIZE} {...props} />;
export const IconWallPost = (props) => <IconWrapper IconComponent={DocumentText} variant="Bold" size={ICON_SIZE} {...props} />;