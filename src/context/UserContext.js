import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AccountSwitchOverlay from '../components/AccountSwitchOverlay';  
import { FeedCache } from '../core/FeedCache';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [accounts, setAccounts] = useState([]);
    
    
    const [switchingTarget, setSwitchingTarget] = useState(null);
    const [isOverlayExiting, setIsOverlayExiting] = useState(false);

    
    const refreshAccountsList = useCallback(async () => {
        if (window.api) {
            try {
                const list = await window.api.invoke('auth:get-accounts');
                if (Array.isArray(list)) setAccounts(list);
            } catch (e) {
                console.error("Failed to get accounts list:", e);
            }
        }
    }, []);

    useEffect(() => {
        const rawData = localStorage.getItem('nowkie_user');
        if (rawData) {
            try { setCurrentUser(JSON.parse(rawData)); } catch (e) { localStorage.removeItem('nowkie_user'); }
        }
        refreshAccountsList();
    }, [refreshAccountsList]);

    
    const switchAccount = useCallback(async (userId) => {
        
        if (userId === currentUser?.id || !window.api) return;
        
        
        const targetAccount = accounts.find(acc => acc.id === userId);
        if (!targetAccount) return;

        
        setIsOverlayExiting(false);
        setSwitchingTarget(targetAccount);

        try {
            const startTime = Date.now();
            const MIN_ANIMATION_TIME = 1200; 

            
            await window.api.invoke('auth:switch-account', userId);

            
            FeedCache.clear();

            
            const newUserProfile = await window.api.invoke('get-init-user');

            if (!newUserProfile || newUserProfile.error) {
                throw new Error("Failed to fetch new user profile");
            }

            
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, MIN_ANIMATION_TIME - elapsed);
            if (remaining > 0) await new Promise(r => setTimeout(r, remaining));

            
            localStorage.setItem('nowkie_user', JSON.stringify(newUserProfile));
            setCurrentUser(newUserProfile);
            refreshAccountsList();

            
            
            await new Promise(r => setTimeout(r, 700));

            
            setIsOverlayExiting(true);

            
            setTimeout(() => {
                setSwitchingTarget(null);
                setIsOverlayExiting(false);
            }, 500);

        } catch (e) {
            console.error("Soft switch failed:", e);
            alert("Ошибка переключения. Приложение будет перезагружено.");
            window.location.reload();
        }
    }, [currentUser?.id, accounts, refreshAccountsList]);

    
    const logoutAccount = useCallback(async (userId) => {
        if (!window.api) return;
        try {
            await window.api.invoke('auth:remove-account', userId);
            if (userId === currentUser?.id) {
                
                localStorage.removeItem('nowkie_user');
                window.location.reload(); 
            } else {
                refreshAccountsList();
            }
        } catch (e) { console.error(e); }
    }, [currentUser?.id, refreshAccountsList]);

    return (
        <UserContext.Provider value={{ 
            currentUser, 
            setCurrentUser: (u) => {
                if(u) localStorage.setItem('nowkie_user', JSON.stringify(u));
                else localStorage.removeItem('nowkie_user');
                setCurrentUser(u);
            }, 
            accounts, 
            switchAccount,
            logoutAccount,
            refreshAccountsList 
        }}>
            {}
            {switchingTarget && (
                <AccountSwitchOverlay 
                    targetUser={switchingTarget} 
                    isExiting={isOverlayExiting} 
                />
            )}
            
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);