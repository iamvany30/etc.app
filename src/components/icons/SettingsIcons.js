
import React from 'react';
import { 
    AltArrowLeft, AltArrowRight, User, Lock, 
    ShieldCheck, Pallete, Videocamera, Logout, 
    CheckRead, InfoCircle, SquareShareLine,
    UsersGroupTwoRounded 
} from "@solar-icons/react";

export const IconBack = (props) => <AltArrowLeft size={24} {...props} />;
export const IconChevron = (props) => <AltArrowRight size={20} {...props} />;
export const IconUser = (props) => <User size={20} {...props} />;
export const IconLock = (props) => <Lock size={20} {...props} />;
export const IconShield = (props) => <ShieldCheck size={20} {...props} />;
export const IconPalette = (props) => <Pallete size={20} {...props} />;
export const IconMedia = (props) => <Videocamera size={20} {...props} />;
export const IconLogout = (props) => <Logout size={20} {...props} />;
export const IconCheck = (props) => <CheckRead size={24} strokeWidth={3} {...props} />;
export const IconInfo = (props) => <InfoCircle size={20} {...props} />;
export const IconExternalLink = (props) => <SquareShareLine size={16} {...props} />;
export const IconUsers = (props) => <UsersGroupTwoRounded size={20} {...props} />;