import React from 'react';
import IconWrapper from './IconWrapper';
import { Play, Pause, SkipPrevious, SkipNext } from "@solar-icons/react";

export const PlayIcon = (props) => <IconWrapper IconComponent={Play} size={18} {...props} />;
export const PauseIcon = (props) => <IconWrapper IconComponent={Pause} size={18} {...props} />;
export const PrevIcon = (props) => <IconWrapper IconComponent={SkipPrevious} size={20} {...props} />;
export const NextIcon = (props) => <IconWrapper IconComponent={SkipNext} size={20} {...props} />;