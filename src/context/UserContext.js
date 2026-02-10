import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
         
        const rawData = localStorage.getItem('nowkie_user');
        if (rawData) {
            try {
                setCurrentUser(JSON.parse(rawData));
            } catch (e) {
                console.error("Ошибка парсинга nowkie_user", e);
            }
        }
    }, []);

    return (
        <UserContext.Provider value={{ currentUser, setCurrentUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);