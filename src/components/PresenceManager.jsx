import { useEffect } from 'react';
import { useUser } from '../context/UserContext';

const PresenceManager = () => {
    const { currentUser } = useUser();

    useEffect(() => {
        
        if (!currentUser) return;

        
        console.log('[PresenceManager] Requesting stream start via Electron...');
        window.api.invoke('presence:start');

        
        const handleOffline = () => {
             
             window.api.invoke('presence:stop');
             
             
             const storageData = localStorage.getItem('nowkie_user');
             if (storageData) {
                 try {
                     const token = JSON.parse(storageData).accessToken;
                     fetch('https://xn--d1ah4a.com/api/users/me/offline', {
                         method: 'POST',
                         headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                         },
                         body: JSON.stringify({ timestamp: new Date().toISOString() }),
                         keepalive: true
                     });
                 } catch (e) {}
             }
        };

        window.addEventListener('beforeunload', handleOffline);

        return () => {
            
            window.api.invoke('presence:stop');
            window.removeEventListener('beforeunload', handleOffline);
        };
    }, [currentUser]);

    return null;
};

export default PresenceManager;