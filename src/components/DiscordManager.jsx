/* @source src/components/DiscordManager.jsx */
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMusicStore } from '../store/musicStore';
import { useUserStore } from '../store/userStore';
import { useDownloadStore } from '../store/downloadStore';
import { useUploadStore } from '../store/uploadStore';
import { useIslandStore } from '../store/islandStore';
import { useDiscordStore } from '../store/discordStore'; 
import { DiscordIcon } from './icons/CustomIcons';

const DiscordManager = () => {
    const location = useLocation();
    
    
    const { currentTrack, isPlaying, duration, progress } = useMusicStore();
    const currentUser = useUserStore(state => state.currentUser);
    const showIslandAlert = useIslandStore(state => state.showIslandAlert);
    const { currentActivity } = useDiscordStore();
    
    const downloads = useDownloadStore(state => state.downloads);
    const uploads = useUploadStore(state => state.uploads);

    useEffect(() => {
        if (!window.api?.on) return;
        const handleDiscordConnected = (discordUser) => {
            showIslandAlert('discord', `Подключено: ${discordUser.username}`, <DiscordIcon />);
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

            const activeDlCount = Object.values(downloads).filter(d => d.status === 'progressing').length;
            const activeUlCount = Object.values(uploads).filter(u => u.status !== 'complete' && u.status !== 'error').length;

            
            if (currentTrack && isPlaying) {
                activity.details = currentTrack.title;
                activity.state = `by ${currentTrack.artist}`;
                activity.smallImageKey = 'play_icon';
                activity.smallImageText = 'Слушает сейчас';
                if (duration) activity.endTimestamp = Date.now() + (duration - progress) * 1000;
            } 
            
            else if (currentActivity) {
                if (currentActivity.type === 'drawing') {
                    activity.details = '🎨 Рисует шедевр';
                    activity.state = 'В графическом редакторе';
                } else if (currentActivity.type === 'typing') {
                    activity.details = '✍️ Пишет новый пост';
                    activity.state = 'В раздумьях...';
                }
            } 
            
            else if (activeDlCount > 0 || activeUlCount > 0) {
                activity.details = '📦 Работает с файлами';
                if (activeDlCount > 0) activity.state = `Скачивает файлов: ${activeDlCount}`;
                else if (activeUlCount > 0) activity.state = `Отправляет файлов: ${activeUlCount}`;
            } 
            
            else {
                const path = location.pathname;

                if (path === '/') {
                    activity.details = '📱 Листает ленту';
                    activity.state = 'Изучает посты друзей';
                } else if (path === '/explore') {
                    activity.details = '🧭 В разделе Обзор';
                    activity.state = 'Ищет новый контент';
                } else if (path === '/notifications') {
                    activity.details = '🔔 Проверяет уведомления';
                } else if (path === '/music') {
                    activity.details = '🎵 Выбирает музыку';
                    activity.state = 'В аудиотеке';
                } else if (path.startsWith('/profile/')) {
                    const username = path.split('/')[2];
                    activity.details = `👤 Смотрит профиль`;
                    activity.state = `@${username}`;
                } else if (path.startsWith('/post/')) {
                    activity.details = '💬 Читает обсуждение';
                    activity.state = 'В комментариях';
                } else if (path === '/bookmarks') {
                    activity.details = '🔖 Разбирает закладки';
                } else {
                    activity.details = '✨ В сети';
                    activity.state = 'итд.app';
                }
            }

            try {
                await window.api.invoke('discord:set-activity', activity);
            } catch (e) {
                console.error("Discord RPC Error:", e);
            }
        };

        updatePresence();
        const interval = setInterval(updatePresence, 15000); 
        
        return () => clearInterval(interval);
    }, [location.pathname, currentTrack, isPlaying, currentUser, duration, progress, currentActivity, downloads, uploads]);

    return null;
};

export default DiscordManager;