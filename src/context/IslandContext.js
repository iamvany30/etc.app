import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const IslandContext = createContext();

export const IslandProvider = ({ children }) => {
    const [alert, setAlert] = useState(null);
    const timeoutRef = useRef(null);

    const showIslandAlert = useCallback((type, message, icon, duration = 4000) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        setAlert({ type, message, icon });
        
        timeoutRef.current = setTimeout(() => {
            setAlert(null);
        }, duration);
    }, []);

    return (
        <IslandContext.Provider value={{ alert, showIslandAlert }}>
            {children}
        </IslandContext.Provider>
    );
};

export const useIsland = () => useContext(IslandContext);