/* @source src/components/DiscordManager.jsx */
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMusicStore } from '../store/musicStore';
import { useUserStore } from '../store/userStore';
import { useIslandStore } from '../store/islandStore';
import { DiscordIcon } from './icons/CustomIcons';

const DiscordManager = () => {
    const location = useLocation();
    const currentTrack = useMusicStore(state => state.currentTrack);
    const isPlaying = useMusicStore(state => state.isPlaying);
    const duration = useMusicStore(state => state.duration);
    const progress = useMusicStore(state => state.progress);
    const currentUser = useUserStore(state => state.currentUser);
    const showIslandAlert = useIslandStore(state => state.showIslandAlert);

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