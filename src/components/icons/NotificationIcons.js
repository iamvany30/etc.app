
import React from 'react';
import { Heart, ChatRoundDots, Repeat, User, Letter, DocumentText } from "@solar-icons/react";

const ICON_SIZE = 16; 

export const IconLikeFilled = (props) => <Heart size={ICON_SIZE} variant="bold" {...props} />;
export const IconCommentFilled = (props) => <ChatRoundDots size={ICON_SIZE} variant="bold" {...props} />;
export const IconRepostFilled = (props) => <Repeat size={ICON_SIZE} variant="bold" {...props} />;
export const IconUserFilled = (props) => <User size={ICON_SIZE} variant="bold" {...props} />;
export const IconMentionFilled = (props) => <Letter size={ICON_SIZE} variant="bold" {...props} />;
export const IconWallPost = (props) => <DocumentText size={ICON_SIZE} variant="bold" {...props} />;