import React, { useEffect, useState, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import Login from '../pages/Login';
import OfflinePage from '../pages/OfflinePage';

const AuthFlow = ({ children }) => {
    const { currentUser, setCurrentUser } = useUser();
    const [status, setStatus] = useState('loading');  

    const checkSession = useCallback(async () => {
         
        if (currentUser) {
            setStatus('auth');
            return;
        }

        setStatus('loading');
        
        try {
             
            const user = await window.api.getInitUser();
            console.log("[AuthFlow] Result:", user);

            if (user && user.error?.code === 'NETWORK_ERROR') {
                setStatus('offline');
            } else if (user && user.id) {
                 
                setCurrentUser(user);
                localStorage.setItem('nowkie_user', JSON.stringify(user));  
                setStatus('auth');
            } else {
                 
                setCurrentUser(null);
                localStorage.removeItem('nowkie_user');
                setStatus('guest');
            }
        } catch (e) {
            console.error("[AuthFlow] Error:", e);
            setStatus('guest');
        }
    }, [currentUser, setCurrentUser]);

    useEffect(() => {
        checkSession();
    }, []);  

    const handleLoginSuccess = () => {
        console.log("[AuthFlow] Login success signal received");
        checkSession();  
    };

    if (status === 'loading') {
        return (
            <div style={{
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100vh',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text-secondary)'
            }}>
                <div className="spinner" style={{marginBottom: 20}}></div>
                <p>Загрузка профиля...</p>
            </div>
        );
    }

    if (status === 'offline') {
        return <OfflinePage onRetry={checkSession} />;
    }

    if (status === 'guest') {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

     
    return children;
};

export default AuthFlow;