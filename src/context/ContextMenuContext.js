import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import ContextMenu from '../components/ContextMenu';

const ContextMenuContext = createContext();

export const ContextMenuProvider = ({ children }) => {
    const [menuState, setMenuState] = useState({
        isOpen: false,
        x: 0,
        y: 0,
        items: []
    });

    const closeContextMenu = useCallback(() => {
        setMenuState(prev => prev.isOpen ? { ...prev, isOpen: false } : prev);
    }, []);

    const openContextMenu = useCallback((x, y, items) => {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const menuW = 240; 
        const menuH = items.length * 40;

        const safeX = x + menuW > screenW ? x - menuW : x;
        const safeY = y + menuH > screenH ? y - menuH : y;

        setMenuState({
            isOpen: true,
            x: safeX,
            y: safeY,
            items
        });
    }, []);

    useEffect(() => {
        if (!menuState.isOpen) return;

        const handleGlobalClick = () => {
            closeContextMenu();
        };

        
        
        const timer = setTimeout(() => {
            window.addEventListener('mousedown', handleGlobalClick);
            window.addEventListener('wheel', handleGlobalClick);
            window.addEventListener('contextmenu', handleGlobalClick);
        }, 0);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('mousedown', handleGlobalClick);
            window.removeEventListener('wheel', handleGlobalClick);
            window.removeEventListener('contextmenu', handleGlobalClick);
        };
    }, [menuState.isOpen, closeContextMenu]);

    return (
        <ContextMenuContext.Provider value={{ openContextMenu, closeContextMenu }}>
            {children}
            <ContextMenu 
                isOpen={menuState.isOpen}
                x={menuState.x}
                y={menuState.y}
                items={menuState.items}
                onClose={closeContextMenu}
            />
        </ContextMenuContext.Provider>
    );
};

export const useContextMenu = () => {
    const context = useContext(ContextMenuContext);
    return context;
};