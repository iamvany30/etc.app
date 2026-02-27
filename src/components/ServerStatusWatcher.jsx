/* @source src/components/ServerStatusWatcher.jsx */
import { useEffect, useRef } from 'react';
import { useIslandStore } from '../store/islandStore';


const STATUS_API_URL = 'https://xn--80a7abcbg.xn--d1ah4a.com/api/status';
const CHECK_INTERVAL_MS = 3 * 60 * 1000; 

const ServerStatusWatcher = () => {
    const showIslandAlert = useIslandStore(state => state.showIslandAlert);
    
    
    const lastStatusRef = useRef('operational');

    useEffect(() => {
        const checkServerStatus = async () => {
            
            if (!navigator.onLine) return;

            try {
                const response = await fetch(STATUS_API_URL, {
                    
                    cache: 'no-cache', 
                    headers: { 'Accept': 'application/json' }
                });

                if (!response.ok) throw new Error('Status server unreachable');

                const data = await response.json();
                
                let currentLevel = 'operational';
                let alertMessage = '';
                let alertIcon = '✨';
                let alertType = 'success';

                
                if (data.overall_status === 'downtime') {
                    currentLevel = 'downtime';
                    alertMessage = 'Сбой серверов итд.app';
                    alertIcon = '🚨';
                    alertType = 'error';
                } else if (data.overall_status === 'degraded') {
                    currentLevel = 'degraded';
                    alertMessage = 'Серверы работают нестабильно';
                    alertIcon = '⚠️';
                    alertType = 'warning';
                } else {
                    
                    const problematicServices = data.services?.filter(
                        s => s.current_status === 'downtime' || s.current_status === 'degraded'
                    ) || [];

                    if (problematicServices.length > 0) {
                        currentLevel = 'partial';
                        const names = problematicServices.map(s => s.name.replace(' Service', '')).join(', ');
                        alertMessage = `Проблемы: ${names}`;
                        alertIcon = '⚙️';
                        alertType = 'warning';
                    }
                }

                
                if (currentLevel !== lastStatusRef.current) {
                    
                    if (currentLevel !== 'operational') {
                        
                        showIslandAlert(alertType, alertMessage, alertIcon, 5000);
                    } else if (lastStatusRef.current !== 'operational') {
                        
                        showIslandAlert('success', 'Работа систем восстановлена', '✅', 4000);
                    }
                    
                    lastStatusRef.current = currentLevel;
                }

            } catch (error) {
                console.warn('[ServerStatusWatcher] Ошибка проверки статуса:', error.message);
            }
        };

        
        const initialCheck = setTimeout(checkServerStatus, 5000);

        
        const intervalId = setInterval(checkServerStatus, CHECK_INTERVAL_MS);

        return () => {
            clearTimeout(initialCheck);
            clearInterval(intervalId);
        };
    }, [showIslandAlert]);

    return null; 
};

export default ServerStatusWatcher;