import React from 'react';
import IconWrapper from './IconWrapper';
import { Home, MusicNote, CompassBig, Bell, User, Download, BookmarkSquareMinimalistic } from "@solar-icons/react";


export const IconFeed = (props) => <IconWrapper IconComponent={Home} size={26} {...props} />;
export const IconMusic = (props) => <IconWrapper IconComponent={MusicNote} size={26} {...props} />;
export const IconDownload = (props) => <IconWrapper IconComponent={Download} size={26} {...props} />;
export const IconBookmarks = (props) => <IconWrapper IconComponent={BookmarkSquareMinimalistic} size={26} {...props} />;
export const IconExplore = (props) => <IconWrapper IconComponent={CompassBig} size={26} {...props} />;
export const IconNotifications = (props) => <IconWrapper IconComponent={Bell} size={26} {...props} />;
export const IconProfile = (props) => <IconWrapper IconComponent={User} size={26} {...props} />;