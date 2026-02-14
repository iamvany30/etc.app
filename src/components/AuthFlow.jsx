import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useUser } from '../context/UserContext';
import Login from '../pages/Login';
import OfflinePage from '../pages/OfflinePage';

const AuthFlow = ({ children }) => {
    const { setCurrentUser } = useUser();
    const [status, setStatus] = useState('pending'); 
    const isChecking = useRef(false);

    const emitStatus = (type) => {
        window.dispatchEvent(new CustomEvent('app-network-status', { detail: type }));
    };

    const checkNetworkHealth = useCallback(async () => {
        if (isChecking.current) return;
        isChecking.current = true;

        if (!navigator.onLine) {
            emitStatus('browser_offline');
            isChecking.current = false;
            return;
        }

        try {
            const [apiAlive, internetAlive] = await Promise.all([
                window.api.invoke('app:check-api-status'),
                window.api.invoke('app:quick-check') 
            ]);

            if (!internetAlive) {
                emitStatus('internet_issue');
            } else if (!apiAlive) {
                emitStatus('server_down');
            } else {
                emitStatus('online');
            }
        } catch (e) {
            emitStatus('internet_issue');
        } finally {
            isChecking.current = false;
        }
    }, []);

    
    const checkSession = useCallback(async () => {
        
        try {
            const verifiedUser = await window.api.getInitUser();

            if (verifiedUser && !verifiedUser.error) {
                
                localStorage.setItem('nowkie_user', JSON.stringify(verifiedUser));
                setCurrentUser(verifiedUser);
                setStatus('auth');
                emitStatus('online');
            } else {
                
                localStorage.removeItem('nowkie_user');
                setCurrentUser(null);
                setStatus('guest');
                
                if (verifiedUser?.error?.code !== 'NETWORK_ERROR') {
                    checkNetworkHealth();
                }
            }
        } catch (e) {
            console.error("AuthFlow critical error:", e);
            setStatus('guest'); 
            checkNetworkHealth();
        }
    }, [setCurrentUser, checkNetworkHealth]);

    useEffect(() => {
        
        checkSession();

        const interval = setInterval(checkNetworkHealth, 10000); 
        window.addEventListener('online', checkNetworkHealth);
        window.addEventListener('offline', () => emitStatus('browser_offline'));

        return () => {
            clearInterval(interval);
            window.removeEventListener('online', checkNetworkHealth);
        };
    }, [checkSession, checkNetworkHealth]);

    if (status === 'pending') return <div style={{ height: '100vh', backgroundColor: '#101214' }} />;
    if (status === 'guest' && !navigator.onLine) return <OfflinePage onRetry={checkSession} />;
    
    
    if (status === 'guest') return <Login onLoginSuccess={checkSession} />;

    return children;
};

export default AuthFlow;