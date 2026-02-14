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
        const cachedUserRaw = localStorage.getItem('nowkie_user');
        
        
        checkNetworkHealth();

        if (!cachedUserRaw) {
            setStatus('guest');
            return;
        }

        try {
            setCurrentUser(JSON.parse(cachedUserRaw));
            setStatus('auth');

            
            const verifiedUser = await Promise.race([
                window.api.getInitUser(),
                new Promise((_, reject) => setTimeout(() => reject('timeout'), 5000))
            ]);

            if (!verifiedUser || verifiedUser === 'timeout' || verifiedUser.error) {
                
                checkNetworkHealth();
                if (verifiedUser?.error && verifiedUser.error.code !== 'NETWORK_ERROR') {
                    handleLogout();
                }
            } else {
                emitStatus('online');
                localStorage.setItem('nowkie_user', JSON.stringify(verifiedUser));
                setCurrentUser(verifiedUser);
            }
        } catch (e) {
            checkNetworkHealth();
        }
    }, [setCurrentUser, checkNetworkHealth]);

    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem('nowkie_user');
        setStatus('guest');
    };

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
    if (status === 'guest' && !navigator.onLine) return <OfflinePage onRetry={() => window.location.reload()} />;
    if (status === 'guest') return <Login onLoginSuccess={() => window.location.reload()} />;

    return children;
};

export default AuthFlow;