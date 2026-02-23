import React from 'react';
import IconWrapper from './IconWrapper';
import { 
    AltArrowLeft, 
    AltArrowRight, 
    Restart, 
    Paperclip,
    ChatSquare,
    MicrophoneLarge,
    MusicNote, 
    Plain, 
    CloseCircle, 
    TrashBinMinimalistic, 
    Stop,
    SmileCircle,
    TextBold,
    TextItalic,
    Code,
    EyeClosed,
    Camera, 
    Settings, 
    Calendar
} from "@solar-icons/react";


export const NavBackIcon = (props) => <IconWrapper IconComponent={AltArrowLeft} size={24} {...props} />;
export const NavForwardIcon = (props) => <IconWrapper IconComponent={AltArrowRight} size={24} {...props} />;
export const NavReloadIcon = (props) => <IconWrapper IconComponent={Restart} size={20} {...props} />;


export const ImageIcon = (props) => <IconWrapper IconComponent={Paperclip} size={22} {...props} />; 
export const MicIcon = (props) => <IconWrapper IconComponent={MicrophoneLarge} size={22} {...props} />;
export const PollIcon = (props) => <IconWrapper IconComponent={ChatSquare} size={22} {...props} />;
export const MusicIcon = (props) => <IconWrapper IconComponent={MusicNote} size={22} {...props} />;
export const SendIcon = (props) => <IconWrapper IconComponent={Plain} size={22} {...props} />;
export const EmojiIcon = (props) => <IconWrapper IconComponent={SmileCircle} size={22} {...props} />;


export const CloseIcon = (props) => <IconWrapper IconComponent={CloseCircle} size={20} {...props} />;
export const TrashIcon = (props) => <IconWrapper IconComponent={TrashBinMinimalistic} size={20} {...props} />;
export const StopIcon = (props) => <IconWrapper IconComponent={Stop} size={20} {...props} />;


export const BoldIcon = (props) => <IconWrapper IconComponent={TextBold} size={20} {...props} />;
export const ItalicIcon = (props) => <IconWrapper IconComponent={TextItalic} size={20} {...props} />;
export const CodeIcon = (props) => <IconWrapper IconComponent={Code} size={20} {...props} />;
export const SpoilerIcon = (props) => <IconWrapper IconComponent={EyeClosed} size={20} {...props} />;


export const CameraIcon = (props) => <IconWrapper IconComponent={Camera} size={22} {...props} />;
export const SettingsIcon = (props) => <IconWrapper IconComponent={Settings} size={22} {...props} />;
export const CalendarIcon = (props) => <IconWrapper IconComponent={Calendar} size={18} {...props} />;