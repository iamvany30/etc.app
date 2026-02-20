
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom'; 
import { useUser } from '../context/UserContext';
import Login from '../pages/Login';
import OfflinePage from '../pages/OfflinePage';
import { FeedCache } from '../core/FeedCache'; 

const AuthFlow = ({ children }) => {
    const { setCurrentUser } = useUser();
    const [status, setStatus] = useState('pending'); 
    const location = useLocation(); 
    
    const hasChecked = useRef(false); 

    const checkSession = useCallback(async () => {
        if (hasChecked.current) return;
        hasChecked.current = true;

        try {
            console.log('[AuthFlow] Checking session...');
            const verifiedUser = await window.api.getInitUser();
            
            if (verifiedUser && !verifiedUser.error) {
                setCurrentUser(verifiedUser);
                setStatus('auth');
                window.dispatchEvent(new CustomEvent('app-network-status', { detail: 'online' }));
                setTimeout(() => FeedCache.preload(), 100); 
            } else {
                setStatus('guest');
            }
        } catch (e) {
            console.error('[AuthFlow] Error:', e);
            setStatus('guest'); 
        }
    }, [setCurrentUser]);

    useEffect(() => {
        checkSession();
    }, []); 

    if (status === 'pending') return <div style={{ height: '100vh', backgroundColor: '#101214' }} />;
    
    
    if (location.pathname.startsWith('/login')) {
        return children;
    }

    if (status === 'guest') {
        return <Login onLoginSuccess={() => {
            hasChecked.current = false; 
            checkSession();
        }} />;
    }

    return children;
};

export default AuthFlow;