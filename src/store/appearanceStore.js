/* @source src/store/appearanceStore.js */
import { create } from 'zustand';
import { FontLoader } from '../core/FontLoader';

export const useAppearanceStore = create((set) => ({
    iconStyle: localStorage.getItem('itd_icon_style') || 'linear',
    fontFamily: localStorage.getItem('itd_font_family') || 'inter',
    emojiFamily: localStorage.getItem('itd_emoji_family') || 'system',
    
    
    scrollbarMode: localStorage.getItem('itd_scrollbar_mode') || 'visible',
    
    
    useFullNumbers: localStorage.getItem('itd_full_numbers') === 'true',

    setIconStyle: (style) => {
        localStorage.setItem('itd_icon_style', style);
        set({ iconStyle: style });
    },

    setFontFamily: (font) => {
        localStorage.setItem('itd_font_family', font);
        document.documentElement.setAttribute('data-font', font); 
        FontLoader.init();
        set({ fontFamily: font });
    },

    setEmojiFamily: (font) => {
        localStorage.setItem('itd_emoji_family', font);
        document.documentElement.setAttribute('data-emoji', font); 
        FontLoader.init();
        set({ emojiFamily: font });
    },

    setScrollbarMode: (mode) => {
        localStorage.setItem('itd_scrollbar_mode', mode);
        document.documentElement.setAttribute('data-scrollbar', mode);
        set({ scrollbarMode: mode });
    },

    
    setUseFullNumbers: (enabled) => {
        localStorage.setItem('itd_full_numbers', String(enabled));
        set({ useFullNumbers: enabled });
    }
}));