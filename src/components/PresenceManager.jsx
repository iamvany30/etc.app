import { useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { apiClient } from '../api/client';

const PresenceManager = () => {
    const currentUser = useUserStore(state => state.currentUser);

    useEffect(() => {
        if (!currentUser) return;

        window.api.invoke('presence:start');

        const handleOffline = () => {
             window.api.invoke('presence:stop');
             apiClient.sendLastSeen();
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