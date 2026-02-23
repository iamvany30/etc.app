import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const BrowserContext = createContext();

export const BrowserProvider = ({ children }) => {
    const [state, setState] = useState({
        isOpen: false,
        isMinimized: false,
        url: '',
        title: 'Браузер'
    });

    const openBrowser = useCallback((url) => {
        setState({ isOpen: true, isMinimized: false, url, title: new URL(url).hostname });
    }, []);

    const closeBrowser = useCallback(() => {
        setState({ isOpen: false, isMinimized: false, url: '', title: '' });
    }, []);

    const minimizeBrowser = useCallback(() => {
        setState(prev => ({ ...prev, isMinimized: true }));
    }, []);

    const maximizeBrowser = useCallback(() => {
        setState(prev => ({ ...prev, isMinimized: false }));
    }, []);

    const updateTitle = useCallback((title) => {
        setState(prev => ({ ...prev, title }));
    }, []);

    useEffect(() => {
        const handleEvent = (e) => openBrowser(e.detail);
        window.addEventListener('open-internal-browser', handleEvent);
        return () => window.removeEventListener('open-internal-browser', handleEvent);
    }, [openBrowser]);

    return (
        <BrowserContext.Provider value={{ 
            ...state, 
            openBrowser, 
            closeBrowser, 
            minimizeBrowser, 
            maximizeBrowser,
            updateTitle
        }}>
            {children}
        </BrowserContext.Provider>
    );
};

export const useBrowser = () => useContext(BrowserContext);