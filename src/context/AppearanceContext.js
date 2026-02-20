/**
 * @file AppearanceContext.js
 * @description Глобальный контекст для управления настройками внешнего вида приложения.
 * 
 * Этот провайдер управляет тремя ключевыми аспектами UI:
 * 1.  `fontFamily`: ID выбранного текстового шрифта ('inter', 'manrope', 'system' и т.д.).
 * 2.  `emojiFamily`: ID выбранного шрифта для смайликов ('noto_emoji', 'system').
 * 3.  `iconStyle`: Стиль иконок Solar Icons ('Linear', 'Bold', 'Bulk', 'Broken').
 * 
 * Состояние сохраняется в localStorage и применяется при загрузке приложения.
 * Изменение шрифта также устанавливает `data-font` атрибут на <html> для CSS.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { FontLoader } from '../core/FontLoader';


const AppearanceContext = createContext();


export const AppearanceProvider = ({ children }) => {
    
    
    
    
    const [iconStyle, setIconStyle] = useState(
        () => localStorage.getItem('itd_icon_style') || 'linear' 
    );
    
    
    const [fontFamily, setFontFamily] = useState(
        () => localStorage.getItem('itd_font_family') || 'inter'
    );
    
    
    const [emojiFamily, setEmojiFamily] = useState(
        () => localStorage.getItem('itd_emoji_family') || 'system'
    );

    

    
    useEffect(() => {
        localStorage.setItem('itd_icon_style', iconStyle);
    }, [iconStyle]);

    
    useEffect(() => {
        localStorage.setItem('itd_font_family', fontFamily);
        document.documentElement.setAttribute('data-font', fontFamily); 
        FontLoader.init(); 
    }, [fontFamily]);

    
    useEffect(() => {
        localStorage.setItem('itd_emoji_family', emojiFamily);
        FontLoader.init(); 
    }, [emojiFamily]);

    
    useEffect(() => {
        document.documentElement.setAttribute('data-font', fontFamily);
        FontLoader.init(); 
    }, []);

    
    const value = {
        iconStyle, setIconStyle,
        fontFamily, setFontFamily,
        emojiFamily, setEmojiFamily
    };

    return (
        <AppearanceContext.Provider value={value}>
            {children}
        </AppearanceContext.Provider>
    );
};

/**
 * Кастомный хук для удобного доступа к контексту внешнего вида.
 * @returns {{
 *   iconStyle: string, 
 *   setIconStyle: Function,
 *   fontFamily: string,
 *   setFontFamily: Function,
 *   emojiFamily: string,
 *   setEmojiFamily: Function
 * }}
 */
export const useAppearance = () => {
    const context = useContext(AppearanceContext);
    if (context === undefined) {
        throw new Error('useAppearance must be used within an AppearanceProvider');
    }
    return context;
};