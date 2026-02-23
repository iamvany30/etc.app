/* @source src/core/ipcManager.js */
import React from 'react';
import { useMusicStore } from '../store/musicStore';
import { useUploadStore } from '../store/uploadStore';
import { useModalStore } from '../store/modalStore';
import DevToolsWarningModal from '../components/modals/DevToolsWarningModal';

export const initIpcListeners = () => {
    if (!window.api?.on) return;

    
    window.api.on('media-control', (command) => {
        const music = useMusicStore.getState();
        switch (command) {
            case 'play-pause': music.togglePlay(); break;
            case 'next': music.nextTrack(); break;
            case 'prev': music.prevTrack(); break;
            default: break;
        }
    });

    
    window.api.on('upload-progress', (data) => {
        const { id, status, error } = data;
        useUploadStore.getState().updateUploadProgress(id, status, error);
    });

    
    window.api.on('show-devtools-warning', () => {
        useModalStore.getState().openModal(<DevToolsWarningModal />);
    });
};