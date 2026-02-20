import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMusic } from '../context/MusicContext';
import { useUser } from '../context/UserContext';
import { useIsland } from '../context/IslandContext';


const DiscordIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09.01-.02-.01-.07-.07-.07-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.2 2.65.03.01.06 0 .07-.02.4-.55.76-1.13 1.07-1.74.02-.04 0-.08-.04-.09-.66-.25-1.29-.54-1.89-.85-.04-.02-.05-.07-.01-.1.13-.1.25-.2.37-.31.03-.02.07-.03.1 0 3.41 1.58 7.08 1.58 10.42 0 .03-.03.07-.02.1 0 .12.11.24.21.37.31.04.03.03.08-.01.1-.6.31-1.23.6-1.89.85-.04.01-.06.05-.04.09.31.61.67 1.19 1.07 1.74.02.03.05.04.08.02 1.67-.53 3.4-1.33 5.2-2.65.02-.01.03-.03.03-.05.44-4.53-.73-8.46-3.1-11.95-.01-.01-.02-.02-.03-.02ZM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12Zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12Z"/>
    </svg>
);

const DiscordManager = () => {
    const location = useLocation();
    const { currentTrack, isPlaying, duration, progress } = useMusic();
    const { currentUser } = useUser();
    const { showIslandAlert } = useIsland();

    
    useEffect(() => {
        if (!window.api?.on) return;

        const handleDiscordConnected = (discordUser) => {
            console.log('[DiscordManager] << EVENT RECEIVED: discord-connected >> User:', discordUser);
            
            showIslandAlert(
                'discord', 
                `Подключено: ${discordUser.username}`, 
                <DiscordIcon />
            );
        };

        const unsubscribe = window.api.on('discord-connected', handleDiscordConnected);

        return () => unsubscribe();
    }, [showIslandAlert]);

    
    useEffect(() => {
        if (!currentUser) return;

        const updatePresence = async () => {
            let activity = {
                largeImageKey: 'big_logo',
                largeImageText: 'итд.app',
                instance: false
            };

            
            if (currentTrack && isPlaying) {
                activity = {
                    ...activity,
                    details: currentTrack.title,
                    state: `by ${currentTrack.artist}`,
                    smallImageKey: 'play_icon',
                    smallImageText: 'Слушает сейчас',
                    endTimestamp: duration ? Date.now() + (duration - progress) * 1000 : undefined,
                };
            } else {
                const path = location.pathname;

                if (path === '/') {
                    activity.details = 'Листает ленту';
                    activity.state = 'В поиске контента';
                } else if (path === '/explore') {
                    activity.details = 'В разделе Обзор';
                    activity.state = 'Изучает тренды';
                } else if (path === '/notifications') {
                    activity.details = 'Проверяет уведомления';
                } else if (path === '/music') {
                    activity.details = 'Слушает музыку';
                    activity.state = 'Библиотека';
                } else if (path.startsWith('/profile/')) {
                    const username = path.split('/')[2];
                    activity.details = 'Смотрит профиль';
                    activity.state = `@${username}`;
                } else if (path.startsWith('/post/')) {
                    activity.details = 'Читает обсуждение';
                    activity.state = 'Просмотр поста';
                } else if (path === '/downloads') {
                    activity.details = 'Управление файлами';
                    activity.state = 'Загрузки';
                } else {
                    activity.details = 'В сети';
                    activity.state = 'итд.app';
                }
            }

            try {
                await window.api.invoke('discord:set-activity', activity);
            } catch (e) {
                console.error("Discord RPC Update Error:", e);
            }
        };

        updatePresence();
        const interval = setInterval(updatePresence, 15000);
        
        return () => clearInterval(interval);

    }, [location.pathname, currentTrack, isPlaying, currentUser, duration, progress]);

    return null;
};

export default DiscordManager;