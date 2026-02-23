import React from 'react';
import IconWrapper from './IconWrapper';
import { Download, TrashBinMinimalistic, Restart, Magnifer, Pallete } from "@solar-icons/react";

export const IconDownload = (props) => <IconWrapper IconComponent={Download} size={16} {...props} />;
export const IconTrash = (props) => <IconWrapper IconComponent={TrashBinMinimalistic} size={16} {...props} />;
export const IconRefresh = (props) => <IconWrapper IconComponent={Restart} size={16} {...props} />;
export const IconSearch = (props) => <IconWrapper IconComponent={Magnifer} size={16} {...props} />;
export const IconPalette = (props) => <IconWrapper IconComponent={Pallete} size={14} {...props} />;