import React from 'react';
import IconWrapper from './IconWrapper';
import { 
    AltArrowLeft, AltArrowRight, User, Lock, 
    ShieldCheck, Pallete, Videocamera, Logout, 
    CheckRead, InfoCircle, SquareShareLine,
    UsersGroupTwoRounded, Bell, ShieldCross, Pin
} from "@solar-icons/react";

export const IconBack = (props) => <IconWrapper IconComponent={AltArrowLeft} size={24} {...props} />;
export const IconChevron = (props) => <IconWrapper IconComponent={AltArrowRight} size={20} {...props} />;
export const IconUser = (props) => <IconWrapper IconComponent={User} size={20} {...props} />;
export const IconLock = (props) => <IconWrapper IconComponent={Lock} size={20} {...props} />;
export const IconShield = (props) => <IconWrapper IconComponent={ShieldCheck} size={20} {...props} />;
export const IconPalette = (props) => <IconWrapper IconComponent={Pallete} size={20} {...props} />;
export const IconMedia = (props) => <IconWrapper IconComponent={Videocamera} size={20} {...props} />;
export const IconLogout = (props) => <IconWrapper IconComponent={Logout} size={20} {...props} />;
export const IconCheck = (props) => <IconWrapper IconComponent={CheckRead} size={24} strokeWidth={3} {...props} />;
export const IconInfo = (props) => <IconWrapper IconComponent={InfoCircle} size={20} {...props} />;
export const IconExternalLink = (props) => <IconWrapper IconComponent={SquareShareLine} size={16} {...props} />;
export const IconUsers = (props) => <IconWrapper IconComponent={UsersGroupTwoRounded} size={20} {...props} />;
export const IconBell = (props) => <IconWrapper IconComponent={Bell} size={20} {...props} />;
export const IconBlock = (props) => <IconWrapper IconComponent={ShieldCross} size={20} {...props} />;
export const IconPin = (props) => <IconWrapper IconComponent={Pin} size={20} {...props} />;