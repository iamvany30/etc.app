
import React from 'react';
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
    Camera, 
    Settings, 
    Calendar,
    TextBold,
    TextItalic,
    Code,
    EyeClosed,
    Heart,
    ChatRoundDots,
    Repeat,
    Eye,
    MenuDots,
    Share,
    Pen,
    Pin
} from "@solar-icons/react";


export const NavBackIcon = (props) => <AltArrowLeft size={24} {...props} />;
export const NavForwardIcon = (props) => <AltArrowRight size={24} {...props} />;
export const NavReloadIcon = (props) => <Restart size={20} {...props} />;


export const ImageIcon = (props) => (
  <Paperclip 
    weight="Bold" 
    size={64} 
    {...props} 
  />
);
export const MicIcon = (props) => (
  <MicrophoneLarge 
    weight="Bold" 
    size={64} 
    {...props} 
  />
);
export const PollIcon = (props) => <ChatSquare size={22} {...props} />;
export const MusicIcon = (props) => <MusicNote size={22} {...props} />;
export const SendIcon = (props) => <Plain size={22} {...props} />;
export const CloseIcon = (props) => <CloseCircle size={20} {...props} />;
export const TrashIcon = (props) => <TrashBinMinimalistic size={20} {...props} />;
export const StopIcon = (props) => <Stop size={20} {...props} />;


export const BoldIcon = (props) => (
  <TextBold 
    weight="Bold" 
    size={64} 
    {...props} 
  />
);
export const ItalicIcon = (props) => <TextItalic size={20} {...props} />;
export const CodeIcon = (props) => <Code size={20} {...props} />;
export const SpoilerIcon = (props) => <EyeClosed size={20} {...props} />;


export const CameraIcon = (props) => <Camera size={22} {...props} />;
export const SettingsIcon = (props) => <Settings size={22} {...props} />;
export const CalendarIcon = (props) => <Calendar size={18} {...props} />;


export const LikeIcon = (props) => <Heart size={22} {...props} />;
export const CommentIcon = (props) => <ChatRoundDots size={22} {...props} />;
export const RepostIcon = (props) => <Repeat size={22} {...props} />;
export const ViewIcon = (props) => <Eye size={18} {...props} />;


export const MoreIcon = (props) => <MenuDots size={22} {...props} />;
export const ShareIcon = (props) => <Share size={20} {...props} />;
export const EditIcon = (props) => <Pen size={20} {...props} />;
export const PinIcon = (props) => <Pin size={20} {...props} />;