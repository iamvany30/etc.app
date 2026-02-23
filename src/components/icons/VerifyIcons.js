import React from 'react';
import IconWrapper from './IconWrapper';
import { VerifiedCheck } from "@solar-icons/react";


export const VerifiedBlue = (props) => (
  <IconWrapper IconComponent={VerifiedCheck} size={20} color="#1d9bf0" variant="Bold" {...props} />
);

export const VerifiedGold = (props) => (
  <IconWrapper IconComponent={VerifiedCheck} size={22} color="#ffad1f" variant="Bold" {...props} />
);