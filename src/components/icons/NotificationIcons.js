
import React from 'react';
import IconWrapper from './IconWrapper'; 
import { Heart, ChatRoundDots, Repeat, User, Letter, DocumentText } from "@solar-icons/react";

const ICON_SIZE = 16; 


export const IconLikeFilled = (props) => <IconWrapper IconComponent={Heart} size={ICON_SIZE} {...props} />;
export const IconCommentFilled = (props) => <IconWrapper IconComponent={ChatRoundDots} size={ICON_SIZE} {...props} />;
export const IconRepostFilled = (props) => <IconWrapper IconComponent={Repeat} size={ICON_SIZE} {...props} />;
export const IconUserFilled = (props) => <IconWrapper IconComponent={User} size={ICON_SIZE} {...props} />;
export const IconMentionFilled = (props) => <IconWrapper IconComponent={Letter} size={ICON_SIZE} {...props} />;
export const IconWallPost = (props) => <IconWrapper IconComponent={DocumentText} size={ICON_SIZE} {...props} />;