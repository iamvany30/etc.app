import React from 'react';
import IconWrapper from './IconWrapper';
import { 
    Reply, 
    AltArrowLeft, 
    HomeWiFi, 
    Copy, 
    Restart, 
    DownloadSquare, 
    DangerCircle, 
    DownloadMinimalistic, 
    CheckCircle, 
    CloseCircle, 
    Minimize, 
    SquareShareLine, 
    ShieldWarning, 
    Settings, 
    Logout, 
    AddCircle, 
    VerifiedCheck, 
    MenuDots, 
    TrashBinMinimalistic,
    HandShake,
    Pen,
    MagicStick3,
    Eraser,
    Pipette,
    Global,
    RulerPen,
    ArrowRightUp,
    MaximizeSquare,
    RecordCircle,
    MagniferZoomIn,
    MagniferZoomOut,
    Pin
} from "@solar-icons/react";

import { 
    Selection,
    Triangle,
    PaintBucket,
} from "@phosphor-icons/react";


export const ReplyIcon = (props) => <IconWrapper IconComponent={Reply} size={16} {...props} />;
export const PostBackIcon = (props) => <IconWrapper IconComponent={AltArrowLeft} size={22} {...props} />;


export const DiscordIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09.01-.02-.01-.07-.07-.07-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.2 2.65.03.01.06 0 .07-.02.4-.55.76-1.13 1.07-1.74.02-.04 0-.08-.04-.09-.66-.25-1.29-.54-1.89-.85-.04-.02-.05-.07-.01-.1.13-.1.25-.2.37-.31.03-.02.07-.03.1 0 3.41 1.58 7.08 1.58 10.42 0 .03-.03.07-.02.1 0 .12.11.24.21.37.31.04.03.03.08-.01.1-.6.31-1.23.6-1.89.85-.04.01-.06.05-.04.09.31.61.67 1.19 1.07 1.74.02.03.05.04.08.02 1.67-.53 3.4-1.33 5.2-2.65.02-.01.03-.03.03-.05.44-4.53-.73-8.46-3.1-11.95-.01-.01-.02-.02-.03-.02ZM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12Zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12Z"/>
    </svg>
);


export const WifiOffIcon = (props) => <IconWrapper IconComponent={HomeWiFi} variant="Bold" size={18} {...props} style={{opacity: 0.5}} />; 
export const CopyIslandIcon = (props) => <IconWrapper IconComponent={Copy} size={18} {...props} />;
export const UpdateIslandIcon = (props) => <IconWrapper IconComponent={Restart} size={18} {...props} />;


export const MediaDownloadIcon = (props) => <IconWrapper IconComponent={DownloadSquare} size={18} {...props} />;
export const MediaErrorIcon = (props) => <IconWrapper IconComponent={DangerCircle} size={24} {...props} />;
export const MusicDownloadIcon = (props) => <IconWrapper IconComponent={DownloadMinimalistic} size={20} {...props} />;
export const MusicCheckIcon = (props) => <IconWrapper IconComponent={CheckCircle} size={20} {...props} />;


export const ModalCloseIcon = (props) => <IconWrapper IconComponent={CloseCircle} size={20} {...props} />;
export const BrowserMinimizeIcon = (props) => <IconWrapper IconComponent={Minimize} size={20} {...props} />;
export const BrowserExternalIcon = (props) => <IconWrapper IconComponent={SquareShareLine} size={18} {...props} />;
export const OfflineIcon = (props) => <IconWrapper IconComponent={HomeWiFi} size={64} {...props} variant="Broken" />;
export const DevToolsWarnIcon = (props) => <IconWrapper IconComponent={ShieldWarning} size={64} {...props} />;


export const ProfileSettingsIcon = (props) => <IconWrapper IconComponent={Settings} size={18} {...props} />;
export const ProfileLogoutIcon = (props) => <IconWrapper IconComponent={Logout} size={18} {...props} />;
export const ProfileAddIcon = (props) => <IconWrapper IconComponent={AddCircle} size={18} {...props} />;
export const ProfileCheckIcon = (props) => <IconWrapper IconComponent={VerifiedCheck} size={18} {...props} />;
export const SidebarExpandIcon = (props) => <IconWrapper IconComponent={MenuDots} size={18} {...props} />;
export const SidebarCloseIcon = (props) => <IconWrapper IconComponent={CloseCircle} size={16} {...props} />;


export const WinMinimizeIcon = (props) => <IconWrapper IconComponent={Minimize} size={14} {...props} />;
export const WinMaximizeIcon = (props) => <IconWrapper IconComponent={MaximizeSquare} size={12} {...props} />;
export const WinCloseIcon = (props) => <IconWrapper IconComponent={CloseCircle} size={14} {...props} />;


export const AttachmentCloseIcon = (props) => <IconWrapper IconComponent={CloseCircle} size={18} {...props} />;
export const DragDropIcon = (props) => <IconWrapper IconComponent={DownloadSquare} size={40} {...props} />;
export const LinkPreviewCloseIcon = AttachmentCloseIcon;
export const PollRemoveIcon = (props) => <IconWrapper IconComponent={TrashBinMinimalistic} size={18} {...props} />;
export const PollAddIcon = (props) => <IconWrapper IconComponent={AddCircle} size={18} {...props} />;


export const ToolPanIcon = (props) => <IconWrapper IconComponent={HandShake} size={22} {...props} />;
export const ToolPenIcon = (props) => <IconWrapper IconComponent={Pen} size={22} {...props} />;
export const ToolSprayIcon = (props) => <IconWrapper IconComponent={MagicStick3} size={22} {...props} />;
export const ToolFillIcon = (props) => <IconWrapper IconComponent={PaintBucket} size={22} {...props} />;
export const ToolEraserIcon = (props) => <IconWrapper IconComponent={Eraser} size={22} {...props} />;
export const ToolPickerIcon = (props) => <IconWrapper IconComponent={Pipette} size={22} {...props} />;
export const ToolGlobalPickerIcon = (props) => <IconWrapper IconComponent={Global} size={22} {...props} />;
export const ToolLineIcon = (props) => <IconWrapper IconComponent={RulerPen} size={22} {...props} />;
export const ToolArrowIcon = (props) => <IconWrapper IconComponent={ArrowRightUp} size={22} {...props} />;
export const ToolRectIcon = (props) => <IconWrapper IconComponent={MaximizeSquare} size={22} {...props} />;
export const ToolTriangleIcon = (props) => <IconWrapper IconComponent={Triangle} size={22} {...props} />;
export const ToolCircleIcon = (props) => <IconWrapper IconComponent={RecordCircle} size={22} {...props} />;
export const ZoomInIcon = (props) => <IconWrapper IconComponent={MagniferZoomIn} size={18} {...props} />;
export const ZoomOutIcon = (props) => <IconWrapper IconComponent={MagniferZoomOut} size={18} {...props} />;
export const PinIcon = (props) => <IconWrapper IconComponent={Pin} size={20} {...props} />;